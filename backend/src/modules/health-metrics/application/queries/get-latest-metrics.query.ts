import { MetricRepositoryPort } from '../../domain/ports/metric-repository.port';
import { MetricSnapshot } from '../../domain/health-metric.types';

export interface GetLatestMetricsQuery {
  patientId: string;
}

export class GetLatestMetricsHandler {
  constructor(private readonly repository: MetricRepositoryPort) {}

  async handle(query: GetLatestMetricsQuery): Promise<MetricSnapshot[]> {
    return this.repository.getLatestMetrics(query.patientId);
  }
}
