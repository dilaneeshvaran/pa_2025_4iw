import { DomainEvent } from '../health-metric.events';

export interface EventStorePort {
  saveEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
  getEventsForAggregate(aggregateId: string): Promise<DomainEvent[]>;
}
