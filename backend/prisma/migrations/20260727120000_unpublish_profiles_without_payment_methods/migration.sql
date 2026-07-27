UPDATE "practitioners"
SET "isProfilePublic" = false
WHERE "isProfilePublic" = true
  AND (
    cardinality("acceptedPaymentMethods") = 0
    OR "baseConsultationFee" IS NULL
    OR "baseConsultationFee" <= 0
  );
