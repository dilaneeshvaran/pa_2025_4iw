import { MetricRepositoryPort } from '../../domain/ports/metric-repository.port';
import { MetricType, MetricSnapshot } from '../../domain/health-metric.types';

export interface GetMetricHistoryQuery {
  patientId: string;
  metricType: MetricType;
}

export class GetMetricHistoryHandler {
  constructor(private readonly repository: MetricRepositoryPort) {}

  async handle(query: GetMetricHistoryQuery): Promise<MetricSnapshot[]> {
    return this.repository.getMetricHistory(query.patientId, query.metricType);
  }
}
