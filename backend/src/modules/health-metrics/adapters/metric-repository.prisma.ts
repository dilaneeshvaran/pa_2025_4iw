import { MetricRepositoryPort } from '../domain/ports/metric-repository.port';
import { MetricType, MetricSnapshot } from '../domain/health-metric.types';
import prisma from '../../../config/database';
import { PatientMetric, PatientMetricHistory } from '@prisma/client';

export class PrismaMetricRepository implements MetricRepositoryPort {
  async getLatestMetrics(patientId: string): Promise<MetricSnapshot[]> {
    const records = await prisma.patientMetric.findMany({
      where: { patientId },
      orderBy: { metricType: 'asc' },
    });

    return records.map((record: PatientMetric) => ({
      id: record.id,
      patientId: record.patientId,
      metricType: record.metricType as MetricType,
      value: record.value,
      unit: record.unit,
      recordedAt: record.recordedAt,
    }));
  }

  async getMetricHistory(patientId: string, metricType: MetricType): Promise<MetricSnapshot[]> {
    const records = await prisma.patientMetricHistory.findMany({
      where: { patientId, metricType },
      orderBy: { recordedAt: 'desc' },
    });

    return records.map((record: PatientMetricHistory) => ({
      id: record.id,
      patientId: record.patientId,
      metricType: record.metricType as MetricType,
      value: record.value,
      unit: record.unit,
      recordedAt: record.recordedAt,
    }));
  }

  async getMetricById(id: string): Promise<MetricSnapshot | null> {
    const record = await prisma.patientMetricHistory.findUnique({
      where: { id },
    });

    if (!record) return null;

    return {
      id: record.id,
      patientId: record.patientId,
      metricType: record.metricType as MetricType,
      value: record.value,
      unit: record.unit,
      recordedAt: record.recordedAt,
    };
  }

  async saveLatestMetric(snapshot: MetricSnapshot): Promise<void> {
    await prisma.patientMetric.upsert({
      where: {
        patientId_metricType: {
          patientId: snapshot.patientId,
          metricType: snapshot.metricType,
        },
      },
      update: {
        id: snapshot.id,
        value: snapshot.value,
        unit: snapshot.unit,
        recordedAt: snapshot.recordedAt,
      },
      create: {
        id: snapshot.id,
        patientId: snapshot.patientId,
        metricType: snapshot.metricType,
        value: snapshot.value,
        unit: snapshot.unit,
        recordedAt: snapshot.recordedAt,
      },
    });
  }

  async saveHistoryMetric(snapshot: MetricSnapshot): Promise<void> {
    await prisma.patientMetricHistory.upsert({
      where: { id: snapshot.id },
      update: {
        value: snapshot.value,
        unit: snapshot.unit,
        recordedAt: snapshot.recordedAt,
      },
      create: {
        id: snapshot.id,
        patientId: snapshot.patientId,
        metricType: snapshot.metricType,
        value: snapshot.value,
        unit: snapshot.unit,
        recordedAt: snapshot.recordedAt,
      },
    });
  }

  async removeLatestMetric(patientId: string, metricType: MetricType): Promise<void> {
    const remainingHistory = await prisma.patientMetricHistory.findFirst({
      where: { patientId, metricType },
      orderBy: { recordedAt: 'desc' },
    });

    if (remainingHistory) {
      await prisma.patientMetric.upsert({
        where: {
          patientId_metricType: {
            patientId,
            metricType,
          },
        },
        update: {
          id: remainingHistory.id,
          value: remainingHistory.value,
          unit: remainingHistory.unit,
          recordedAt: remainingHistory.recordedAt,
        },
        create: {
          id: remainingHistory.id,
          patientId,
          metricType,
          value: remainingHistory.value,
          unit: remainingHistory.unit,
          recordedAt: remainingHistory.recordedAt,
        },
      });
    } else {
      await prisma.patientMetric.deleteMany({
        where: { patientId, metricType },
      });
    }
  }

  async removeHistoryMetric(id: string): Promise<void> {
    await prisma.patientMetricHistory.delete({
      where: { id },
    });
  }
}
export const prismaMetricRepository = new PrismaMetricRepository();
