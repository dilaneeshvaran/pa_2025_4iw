import { HealthMetricAggregate } from '../domain/health-metric.aggregate';
import { MetricRecordedEvent, MetricRemovedEvent } from '../domain/health-metric.events';
import { RecordMetricCommand, RecordMetricHandler } from '../application/commands/record-metric.command';
import { RemoveMetricCommand, RemoveMetricHandler } from '../application/commands/remove-metric.command';
import { GetLatestMetricsHandler } from '../application/queries/get-latest-metrics.query';
import { GetMetricHistoryHandler } from '../application/queries/get-metric-history.query';
import { MetricProjector } from '../adapters/projector';
import { EventStorePort } from '../domain/ports/event-store.port';
import { MetricRepositoryPort } from '../domain/ports/metric-repository.port';

describe('Health Metrics Core - Hexagonal, CQRS & Event Sourcing', () => {
  describe('Domain Aggregate Root & Event Sourcing', () => {
    it('doit créer un agrégat et lever un événement MetricRecordedEvent', () => {
      const id = 'hm_1';
      const patientId = 'pat_1';
      const date = new Date();
      const aggregate = HealthMetricAggregate.create(id, patientId, 'WEIGHT', 75.5, 'kg', date);

      expect(aggregate.state).toBeDefined();
      expect(aggregate.state?.id).toBe(id);
      expect(aggregate.state?.patientId).toBe(patientId);
      expect(aggregate.state?.metricType).toBe('WEIGHT');
      expect(aggregate.state?.value).toBe(75.5);
      expect(aggregate.state?.unit).toBe('kg');
      expect(aggregate.state?.version).toBe(1);
      expect(aggregate.state?.isDeleted).toBe(false);

      expect(aggregate.changes).toHaveLength(1);
      expect(aggregate.changes[0]).toBeInstanceOf(MetricRecordedEvent);
      expect(aggregate.changes[0].eventType).toBe('MetricRecorded');
    });

    it('doit rejeter les valeurs négatives ou nulles lors de la création', () => {
      expect(() => {
        HealthMetricAggregate.create('hm_1', 'pat_1', 'WEIGHT', -5, 'kg', new Date());
      }).toThrow('La valeur de la mesure doit être supérieure à zéro');

      expect(() => {
        HealthMetricAggregate.create('hm_1', 'pat_1', 'WEIGHT', 0, 'kg', new Date());
      }).toThrow('La valeur de la mesure doit être supérieure à zéro');
    });

    it('doit marquer l\'agrégat comme supprimé et lever un événement MetricRemovedEvent', () => {
      const aggregate = HealthMetricAggregate.create('hm_1', 'pat_1', 'WEIGHT', 75.5, 'kg', new Date());
      aggregate.clearChanges();

      const event = aggregate.remove('pat_1');
      expect(aggregate.state?.isDeleted).toBe(true);
      expect(aggregate.state?.version).toBe(2);
      expect(event).toBeInstanceOf(MetricRemovedEvent);
      expect(aggregate.changes).toHaveLength(1);
    });

    it('doit rejeter la suppression par un autre patient', () => {
      const aggregate = HealthMetricAggregate.create('hm_1', 'pat_1', 'WEIGHT', 75.5, 'kg', new Date());
      expect(() => {
        aggregate.remove('pat_autre');
      }).toThrow('Non autorisé à supprimer cet indicateur de santé');
    });

    it('doit reconstituer l\'état de l\'agrégat à partir de son historique d\'événements (rehydration)', () => {
      const id = 'hm_1';
      const patientId = 'pat_1';
      const date = new Date();

      const events = [
        new MetricRecordedEvent(id, 1, {
          patientId,
          metricType: 'WEIGHT',
          value: 75.5,
          unit: 'kg',
          recordedAt: date,
        }),
        new MetricRemovedEvent(id, 2, {
          patientId,
          metricType: 'WEIGHT',
        }),
      ];

      const aggregate = HealthMetricAggregate.fromHistory(events);
      expect(aggregate.state).toBeDefined();
      expect(aggregate.state?.id).toBe(id);
      expect(aggregate.state?.isDeleted).toBe(true);
      expect(aggregate.state?.version).toBe(2);
    });
  });

  describe('CQRS Commands & Queries (Application Layer)', () => {
    let mockEventStore: jest.Mocked<EventStorePort>;
    let mockMetricRepository: jest.Mocked<MetricRepositoryPort>;
    let projector: MetricProjector;

    beforeEach(() => {
      mockEventStore = {
        saveEvents: jest.fn().mockResolvedValue(undefined),
        getEventsForAggregate: jest.fn(),
      };
      mockMetricRepository = {
        getLatestMetrics: jest.fn(),
        getMetricHistory: jest.fn(),
        getMetricById: jest.fn(),
        saveLatestMetric: jest.fn().mockResolvedValue(undefined),
        saveHistoryMetric: jest.fn().mockResolvedValue(undefined),
        removeLatestMetric: jest.fn().mockResolvedValue(undefined),
        removeHistoryMetric: jest.fn().mockResolvedValue(undefined),
      };
      projector = new MetricProjector(mockMetricRepository);
    });

    it('RecordMetricHandler doit enregistrer l\'événement et appeler la projection', async () => {
      const handler = new RecordMetricHandler(mockEventStore, projector);
      const command = {
        patientId: 'pat_1',
        metricType: 'HEART_RATE' as const,
        value: 72,
        unit: 'bpm',
        recordedAt: new Date(),
      };

      const id = await handler.handle(command);
      expect(id).toBeDefined();
      expect(mockEventStore.saveEvents).toHaveBeenCalledTimes(1);
      expect(mockMetricRepository.saveHistoryMetric).toHaveBeenCalledTimes(1);
      expect(mockMetricRepository.saveLatestMetric).toHaveBeenCalledTimes(1);
    });

    it('RemoveMetricHandler doit recharger l\'historique, exécuter la suppression et mettre à jour la projection', async () => {
      const id = 'hm_1';
      const patientId = 'pat_1';
      const events = [
        new MetricRecordedEvent(id, 1, {
          patientId,
          metricType: 'WEIGHT',
          value: 75.5,
          unit: 'kg',
          recordedAt: new Date(),
        }),
      ];

      mockEventStore.getEventsForAggregate.mockResolvedValue(events);

      const handler = new RemoveMetricHandler(mockEventStore, projector);
      await handler.handle({ id, patientId });

      expect(mockEventStore.getEventsForAggregate).toHaveBeenCalledWith(id);
      expect(mockEventStore.saveEvents).toHaveBeenCalledWith(id, expect.any(Array), 1);
      expect(mockMetricRepository.removeHistoryMetric).toHaveBeenCalledWith(id);
      expect(mockMetricRepository.removeLatestMetric).toHaveBeenCalledWith(patientId, 'WEIGHT');
    });

    it('GetLatestMetricsHandler doit appeler le repository en lecture seule', async () => {
      const expectedData = [
        { id: '1', patientId: 'pat_1', metricType: 'WEIGHT' as const, value: 70, unit: 'kg', recordedAt: new Date() },
      ];
      mockMetricRepository.getLatestMetrics.mockResolvedValue(expectedData);

      const handler = new GetLatestMetricsHandler(mockMetricRepository);
      const result = await handler.handle({ patientId: 'pat_1' });

      expect(result).toBe(expectedData);
      expect(mockMetricRepository.getLatestMetrics).toHaveBeenCalledWith('pat_1');
    });

    it('GetMetricHistoryHandler doit appeler le repository en lecture seule', async () => {
      const expectedData = [
        { id: '1', patientId: 'pat_1', metricType: 'WEIGHT' as const, value: 70, unit: 'kg', recordedAt: new Date() },
      ];
      mockMetricRepository.getMetricHistory.mockResolvedValue(expectedData);

      const handler = new GetMetricHistoryHandler(mockMetricRepository);
      const result = await handler.handle({ patientId: 'pat_1', metricType: 'WEIGHT' });

      expect(result).toBe(expectedData);
      expect(mockMetricRepository.getMetricHistory).toHaveBeenCalledWith('pat_1', 'WEIGHT');
    });
  });
});
