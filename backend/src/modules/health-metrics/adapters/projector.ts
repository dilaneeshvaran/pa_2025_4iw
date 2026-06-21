import { MetricRepositoryPort } from '../domain/ports/metric-repository.port';
import { DomainEvent } from '../domain/health-metric.events';

export class MetricProjector {
  constructor(private readonly repository: MetricRepositoryPort) {}

  async project(event: DomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'MetricRecorded': {
        const { patientId, metricType, value, unit, recordedAt } = event.payload;
        const snapshot = {
          id: event.aggregateId,
          patientId,
          metricType,
          value,
          unit,
          recordedAt: new Date(recordedAt),
        };
        await this.repository.saveHistoryMetric(snapshot);
        await this.repository.saveLatestMetric(snapshot);
        break;
      }
      case 'MetricRemoved': {
        const { patientId, metricType } = event.payload;
        await this.repository.removeHistoryMetric(event.aggregateId);
        await this.repository.removeLatestMetric(patientId, metricType);
        break;
      }
    }
  }
}
