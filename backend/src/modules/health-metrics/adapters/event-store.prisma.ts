import { EventStorePort } from '../domain/ports/event-store.port';
import { DomainEvent } from '../domain/health-metric.events';
import prisma from '../../../config/database';
import { EventStore } from '@prisma/client';

export class PrismaEventStore implements EventStorePort {
  async saveEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const currentEvents = await tx.eventStore.findMany({
        where: { aggregateId },
        orderBy: { version: 'desc' },
        take: 1,
      });

      const currentVersion = currentEvents.length > 0 ? currentEvents[0].version : 0;
      if (currentVersion !== expectedVersion) {
        throw new Error(`Conflit de concurrence: version attendue ${expectedVersion}, obtenue ${currentVersion}`);
      }

      for (const event of events) {
        await tx.eventStore.create({
          data: {
            aggregateType: event.aggregateType,
            aggregateId: event.aggregateId,
            eventType: event.eventType,
            payload: event.payload as any,
            version: event.version,
          },
        });
      }
    });
  }

  async getEventsForAggregate(aggregateId: string): Promise<DomainEvent[]> {
    const records = await prisma.eventStore.findMany({
      where: { aggregateId },
      orderBy: { version: 'asc' },
    });

    return records.map((record: EventStore) => ({
      id: record.id,
      aggregateType: record.aggregateType,
      aggregateId: record.aggregateId,
      eventType: record.eventType,
      payload: record.payload,
      version: record.version,
      occurredAt: record.createdAt,
    }));
  }
}
export const prismaEventStore = new PrismaEventStore();
