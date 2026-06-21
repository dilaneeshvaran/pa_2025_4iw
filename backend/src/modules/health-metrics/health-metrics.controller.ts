import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../../config/database';
import { prismaEventStore } from './adapters/event-store.prisma';
import { prismaMetricRepository } from './adapters/metric-repository.prisma';
import { MetricProjector } from './adapters/projector';
import { RecordMetricHandler } from './application/commands/record-metric.command';
import { RemoveMetricHandler } from './application/commands/remove-metric.command';
import { GetLatestMetricsHandler } from './application/queries/get-latest-metrics.query';
import { GetMetricHistoryHandler } from './application/queries/get-metric-history.query';
import { recordMetricSchema } from './health-metrics.schema';
import { MetricType } from './domain/health-metric.types';

const projector = new MetricProjector(prismaMetricRepository);
const recordMetricHandler = new RecordMetricHandler(prismaEventStore, projector);
const removeMetricHandler = new RemoveMetricHandler(prismaEventStore, projector);
const getLatestMetricsHandler = new GetLatestMetricsHandler(prismaMetricRepository);
const getMetricHistoryHandler = new GetMetricHistoryHandler(prismaMetricRepository);

export class HealthMetricsController {
  async recordMetric(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string; role: string };
    if (user.role !== 'PATIENT') {
      return reply.status(403).send({ success: false, message: 'Accès réservé aux patients' });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!patient) {
      return reply.status(404).send({ success: false, message: 'Profil patient non trouvé' });
    }

    const body = recordMetricSchema.parse(request.body);
    const metricId = await recordMetricHandler.handle({
      patientId: patient.id,
      metricType: body.metricType,
      value: body.value,
      unit: body.unit,
      recordedAt: body.recordedAt,
    });

    return reply.status(201).send({
      success: true,
      data: { id: metricId },
      message: 'Indicateur de santé enregistré avec succès',
    });
  }

  async getLatestMetrics(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string; role: string };
    let patientId: string;

    if (user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!patient) {
        return reply.status(404).send({ success: false, message: 'Profil patient non trouvé' });
      }
      patientId = patient.id;
    } else if (user.role === 'PRACTITIONER') {
      const query = request.query as { patientId?: string };
      if (!query.patientId) {
        return reply.status(400).send({ success: false, message: 'patientId est requis pour les praticiens' });
      }
      patientId = query.patientId;
    } else {
      return reply.status(403).send({ success: false, message: 'Accès non autorisé' });
    }

    const data = await getLatestMetricsHandler.handle({ patientId });
    return reply.send({ success: true, data });
  }

  async getMetricHistory(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string; role: string };
    const params = request.params as { type: string };
    const metricType = params.type.toUpperCase() as MetricType;

    const validTypes = ['WEIGHT', 'TEMPERATURE', 'BLOOD_PRESSURE', 'HEART_RATE', 'BLOOD_GLUCOSE'];
    if (!validTypes.includes(metricType)) {
      return reply.status(400).send({ success: false, message: "Type d'indicateur de santé invalide" });
    }

    let patientId: string;

    if (user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!patient) {
        return reply.status(404).send({ success: false, message: 'Profil patient non trouvé' });
      }
      patientId = patient.id;
    } else if (user.role === 'PRACTITIONER') {
      const query = request.query as { patientId?: string };
      if (!query.patientId) {
        return reply.status(400).send({ success: false, message: 'patientId est requis pour les praticiens' });
      }
      patientId = query.patientId;
    } else {
      return reply.status(403).send({ success: false, message: 'Accès non autorisé' });
    }

    const data = await getMetricHistoryHandler.handle({ patientId, metricType });
    return reply.send({ success: true, data });
  }

  async removeMetric(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string; role: string };
    if (user.role !== 'PATIENT') {
      return reply.status(403).send({ success: false, message: 'Accès réservé aux patients' });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!patient) {
      return reply.status(404).send({ success: false, message: 'Profil patient non trouvé' });
    }

    const params = request.params as { id: string };
    await removeMetricHandler.handle({
      id: params.id,
      patientId: patient.id,
    });

    return reply.send({
      success: true,
      message: 'Indicateur de santé supprimé avec succès',
    });
  }
}

export const healthMetricsController = new HealthMetricsController();
