import { MetricType } from './health-metric.types';

export interface DomainEvent {
  id?: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: any;
  version: number;
  occurredAt: Date;
}

export class MetricRecordedEvent implements DomainEvent {
  readonly aggregateType = 'HealthMetric';
  readonly eventType = 'MetricRecorded';
  readonly occurredAt: Date;

  constructor(
    readonly aggregateId: string,
    readonly version: number,
    readonly payload: {
      patientId: string;
      metricType: MetricType;
      value: number;
      unit: string;
      recordedAt: Date;
    }
  ) {
    this.occurredAt = new Date();
  }
}

export class MetricRemovedEvent implements DomainEvent {
  readonly aggregateType = 'HealthMetric';
  readonly eventType = 'MetricRemoved';
  readonly occurredAt: Date;

  constructor(
    readonly aggregateId: string,
    readonly version: number,
    readonly payload: {
      patientId: string;
      metricType: MetricType;
    }
  ) {
    this.occurredAt = new Date();
  }
}
