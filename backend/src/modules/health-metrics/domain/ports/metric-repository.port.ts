import { MetricType, MetricSnapshot } from '../health-metric.types';

export interface MetricRepositoryPort {
  getLatestMetrics(patientId: string): Promise<MetricSnapshot[]>;
  getMetricHistory(patientId: string, metricType: MetricType): Promise<MetricSnapshot[]>;
  getMetricById(id: string): Promise<MetricSnapshot | null>;
  saveLatestMetric(snapshot: MetricSnapshot): Promise<void>;
  saveHistoryMetric(snapshot: MetricSnapshot): Promise<void>;
  removeLatestMetric(patientId: string, metricType: MetricType): Promise<void>;
  removeHistoryMetric(id: string): Promise<void>;
}
