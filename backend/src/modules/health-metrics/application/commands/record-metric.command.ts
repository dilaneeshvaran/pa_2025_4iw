import { MetricType } from '../../domain/health-metric.types';
import { EventStorePort } from '../../domain/ports/event-store.port';
import { HealthMetricAggregate } from '../../domain/health-metric.aggregate';
import { MetricProjector } from '../../adapters/projector';
import crypto from 'crypto';

export interface RecordMetricCommand {
  patientId: string;
  metricType: MetricType;
  value: number;
  unit: string;
  recordedAt: Date;
}

export class RecordMetricHandler {
  constructor(
    private readonly eventStore: EventStorePort,
    private readonly projector: MetricProjector
  ) {}

  async handle(command: RecordMetricCommand): Promise<string> {
    const id = `hm_${crypto.randomUUID().replace(/-/g, '').substring(0, 22)}`;

    const aggregate = HealthMetricAggregate.create(
      id,
      command.patientId,
      command.metricType,
      command.value,
      command.unit,
      command.recordedAt
    );

    await this.eventStore.saveEvents(id, aggregate.changes, 0);

    for (const event of aggregate.changes) {
      await this.projector.project(event);
    }

    return id;
  }
}
