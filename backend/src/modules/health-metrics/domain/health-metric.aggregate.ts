import { MetricType, HealthMetricState } from './health-metric.types';
import { DomainEvent, MetricRecordedEvent, MetricRemovedEvent } from './health-metric.events';

export class HealthMetricAggregate {
  private _state: HealthMetricState | null = null;
  private _changes: DomainEvent[] = [];

  get state(): HealthMetricState | null {
    return this._state;
  }

  get changes(): DomainEvent[] {
    return this._changes;
  }

  get version(): number {
    return this._state ? this._state.version : 0;
  }

  static create(
    id: string,
    patientId: string,
    metricType: MetricType,
    value: number,
    unit: string,
    recordedAt: Date
  ): HealthMetricAggregate {
    if (value <= 0) {
      throw new Error('La valeur de la mesure doit être supérieure à zéro');
    }
    if (!id || !patientId || !metricType || !unit || !recordedAt) {
      throw new Error('Champs obligatoires manquants');
    }

    const aggregate = new HealthMetricAggregate();
    const event = new MetricRecordedEvent(id, 1, {
      patientId,
      metricType,
      value,
      unit,
      recordedAt,
    });
    aggregate.apply(event);
    aggregate._changes.push(event);
    return aggregate;
  }

  remove(patientId: string): MetricRemovedEvent {
    if (!this._state) {
      throw new Error("L'indicateur de santé n'existe pas");
    }
    if (this._state.isDeleted) {
      throw new Error("L'indicateur de santé est déjà supprimé");
    }
    if (this._state.patientId !== patientId) {
      throw new Error("Non autorisé à supprimer cet indicateur de santé");
    }

    const event = new MetricRemovedEvent(this._state.id, this.version + 1, {
      patientId: this._state.patientId,
      metricType: this._state.metricType,
    });
    this.apply(event);
    this._changes.push(event);
    return event;
  }

  apply(event: DomainEvent): void {
    switch (event.eventType) {
      case 'MetricRecorded':
        this._state = {
          id: event.aggregateId,
          patientId: event.payload.patientId,
          metricType: event.payload.metricType,
          value: event.payload.value,
          unit: event.payload.unit,
          recordedAt: new Date(event.payload.recordedAt),
          version: event.version,
          isDeleted: false,
        };
        break;
      case 'MetricRemoved':
        if (this._state) {
          this._state.isDeleted = true;
          this._state.version = event.version;
        }
        break;
    }
  }

  static fromHistory(events: DomainEvent[]): HealthMetricAggregate {
    const aggregate = new HealthMetricAggregate();
    for (const event of events) {
      aggregate.apply(event);
    }
    return aggregate;
  }

  clearChanges(): void {
    this._changes = [];
  }
}
