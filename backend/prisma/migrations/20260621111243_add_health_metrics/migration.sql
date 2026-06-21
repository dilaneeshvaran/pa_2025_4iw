-- CreateTable
CREATE TABLE "event_store" (
    "id" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_metrics" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_metric_history" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_metric_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_store_aggregateId_idx" ON "event_store"("aggregateId");

-- CreateIndex
CREATE INDEX "event_store_aggregateType_aggregateId_idx" ON "event_store"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "patient_metrics_patientId_idx" ON "patient_metrics"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "patient_metrics_patientId_metricType_key" ON "patient_metrics"("patientId", "metricType");

-- CreateIndex
CREATE INDEX "patient_metric_history_patientId_idx" ON "patient_metric_history"("patientId");

-- CreateIndex
CREATE INDEX "patient_metric_history_patientId_metricType_idx" ON "patient_metric_history"("patientId", "metricType");
