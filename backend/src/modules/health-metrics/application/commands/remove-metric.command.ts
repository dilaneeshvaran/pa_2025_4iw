import { EventStorePort } from '../../domain/ports/event-store.port';
import { HealthMetricAggregate } from '../../domain/health-metric.aggregate';
import { MetricProjector } from '../../adapters/projector';

export interface RemoveMetricCommand {
  id: string;
  patientId: string;
}

export class RemoveMetricHandler {
  constructor(
    private readonly eventStore: EventStorePort,
    private readonly projector: MetricProjector
  ) {}

  async handle(command: RemoveMetricCommand): Promise<void> {
    const events = await this.eventStore.getEventsForAggregate(command.id);
    if (events.length === 0) {
      throw new Error("L'indicateur de santé n'existe pas");
    }

    const aggregate = HealthMetricAggregate.fromHistory(events);
    const expectedVersion = aggregate.version;

    aggregate.remove(command.patientId);

    await this.eventStore.saveEvents(command.id, aggregate.changes, expectedVersion);

    for (const event of aggregate.changes) {
      await this.projector.project(event);
    }
  }
}
