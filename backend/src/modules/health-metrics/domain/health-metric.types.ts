export type MetricType = 'WEIGHT' | 'TEMPERATURE' | 'BLOOD_PRESSURE' | 'HEART_RATE' | 'BLOOD_GLUCOSE';

export interface HealthMetricState {
  id: string;
  patientId: string;
  metricType: MetricType;
  value: number;
  unit: string;
  recordedAt: Date;
  version: number;
  isDeleted: boolean;
}

export interface MetricSnapshot {
  id: string;
  patientId: string;
  metricType: MetricType;
  value: number;
  unit: string;
  recordedAt: Date;
}
