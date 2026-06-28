import { describe, it, expect } from "vitest";
import {
  getStatusVariant,
  getStatusLabel,
  getTeleconsultationStatusLabel,
  getTeleconsultationStatusBadgeVariant,
  getPaymentStatusVariant,
  getPaymentStatusLabel,
} from "../status";

describe("status utils", () => {
  describe("getStatusVariant", () => {
    it("retourne 'warning' pour PENDING", () => {
      expect(getStatusVariant("PENDING")).toBe("warning");
    });

    it("retourne 'primary' pour CONFIRMED", () => {
      expect(getStatusVariant("CONFIRMED")).toBe("primary");
    });

    it("retourne 'success' pour COMPLETED", () => {
      expect(getStatusVariant("COMPLETED")).toBe("success");
    });

    it("retourne 'danger' pour CANCELLED", () => {
      expect(getStatusVariant("CANCELLED")).toBe("danger");
    });

    it("retourne 'danger' pour NO_SHOW", () => {
      expect(getStatusVariant("NO_SHOW")).toBe("danger");
    });

    it("retourne 'default' pour RESCHEDULED", () => {
      expect(getStatusVariant("RESCHEDULED")).toBe("default");
    });

    it("retourne 'default' pour un statut inconnu", () => {
      expect(getStatusVariant("UNKNOWN_STATUS")).toBe("default");
    });
  });

  describe("getStatusLabel", () => {
    it("retourne 'En attente' pour PENDING", () => {
      expect(getStatusLabel("PENDING")).toBe("En attente");
    });

    it("retourne 'Confirmé' pour CONFIRMED", () => {
      expect(getStatusLabel("CONFIRMED")).toBe("Confirmé");
    });

    it("retourne 'Terminé' pour COMPLETED", () => {
      expect(getStatusLabel("COMPLETED")).toBe("Terminé");
    });

    it("retourne 'Annulé' pour CANCELLED", () => {
      expect(getStatusLabel("CANCELLED")).toBe("Annulé");
    });

    it("retourne 'Absent' pour NO_SHOW", () => {
      expect(getStatusLabel("NO_SHOW")).toBe("Absent");
    });

    it("retourne 'Reporté' pour RESCHEDULED", () => {
      expect(getStatusLabel("RESCHEDULED")).toBe("Reporté");
    });

    it("retourne le statut brut pour un statut inconnu", () => {
      expect(getStatusLabel("CUSTOM_STATUS")).toBe("CUSTOM_STATUS");
    });
  });

  describe("getTeleconsultationStatusLabel", () => {
    it("retourne 'Planifiée' pour SCHEDULED", () => {
      expect(getTeleconsultationStatusLabel("SCHEDULED")).toBe("Planifiée");
    });

    it("retourne 'En attente' pour WAITING", () => {
      expect(getTeleconsultationStatusLabel("WAITING")).toBe("En attente");
    });

    it("retourne 'En cours' pour IN_PROGRESS", () => {
      expect(getTeleconsultationStatusLabel("IN_PROGRESS")).toBe("En cours");
    });

    it("retourne 'Terminée' pour COMPLETED", () => {
      expect(getTeleconsultationStatusLabel("COMPLETED")).toBe("Terminée");
    });

    it("retourne 'Annulée' pour CANCELLED", () => {
      expect(getTeleconsultationStatusLabel("CANCELLED")).toBe("Annulée");
    });

    it("retourne 'Échouée' pour FAILED", () => {
      expect(getTeleconsultationStatusLabel("FAILED")).toBe("Échouée");
    });

    it("retourne 'Non présenté' pour NO_SHOW", () => {
      expect(getTeleconsultationStatusLabel("NO_SHOW")).toBe("Non présenté");
    });

    it("retourne le statut brut pour un statut inconnu", () => {
      expect(getTeleconsultationStatusLabel("UNKNOWN")).toBe("UNKNOWN");
    });
  });

  describe("getTeleconsultationStatusBadgeVariant", () => {
    it("retourne 'success' pour IN_PROGRESS", () => {
      expect(getTeleconsultationStatusBadgeVariant("IN_PROGRESS")).toBe(
        "success",
      );
    });

    it("retourne 'warning' pour WAITING", () => {
      expect(getTeleconsultationStatusBadgeVariant("WAITING")).toBe("warning");
    });

    it("retourne 'warning' pour SCHEDULED", () => {
      expect(getTeleconsultationStatusBadgeVariant("SCHEDULED")).toBe(
        "warning",
      );
    });

    it("retourne 'primary' pour COMPLETED", () => {
      expect(getTeleconsultationStatusBadgeVariant("COMPLETED")).toBe(
        "primary",
      );
    });

    it("retourne 'danger' pour FAILED, CANCELLED, NO_SHOW", () => {
      expect(getTeleconsultationStatusBadgeVariant("FAILED")).toBe("danger");
      expect(getTeleconsultationStatusBadgeVariant("CANCELLED")).toBe("danger");
      expect(getTeleconsultationStatusBadgeVariant("NO_SHOW")).toBe("danger");
    });

    it("retourne 'default' pour un statut inconnu", () => {
      expect(getTeleconsultationStatusBadgeVariant("UNKNOWN")).toBe("default");
    });
  });

  describe("getPaymentStatusVariant", () => {
    it("retourne 'success' pour COMPLETED", () => {
      expect(getPaymentStatusVariant("COMPLETED")).toBe("success");
    });

    it("retourne 'warning' pour PENDING et REFUNDED", () => {
      expect(getPaymentStatusVariant("PENDING")).toBe("warning");
      expect(getPaymentStatusVariant("REFUNDED")).toBe("warning");
    });

    it("retourne 'danger' pour FAILED et CANCELLED", () => {
      expect(getPaymentStatusVariant("FAILED")).toBe("danger");
      expect(getPaymentStatusVariant("CANCELLED")).toBe("danger");
    });

    it("retourne 'default' pour un statut inconnu", () => {
      expect(getPaymentStatusVariant("UNKNOWN")).toBe("default");
    });
  });

  describe("getPaymentStatusLabel", () => {
    it("retourne 'Payé' pour COMPLETED", () => {
      expect(getPaymentStatusLabel("COMPLETED")).toBe("Payé");
    });

    it("retourne 'En attente' pour PENDING", () => {
      expect(getPaymentStatusLabel("PENDING")).toBe("En attente");
    });

    it("retourne 'Remboursé' pour REFUNDED", () => {
      expect(getPaymentStatusLabel("REFUNDED")).toBe("Remboursé");
    });

    it("retourne 'Échoué' pour FAILED", () => {
      expect(getPaymentStatusLabel("FAILED")).toBe("Échoué");
    });

    it("retourne 'Annulé' pour CANCELLED", () => {
      expect(getPaymentStatusLabel("CANCELLED")).toBe("Annulé");
    });

    it("retourne le statut brut pour un statut inconnu", () => {
      expect(getPaymentStatusLabel("UNKNOWN")).toBe("UNKNOWN");
    });
  });
});
