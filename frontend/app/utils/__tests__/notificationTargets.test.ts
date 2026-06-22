import { describe, expect, it } from "vitest";
import { getNotificationTarget } from "../notificationTargets";

describe("notificationTargets", () => {
  it("redirige un patient vers la conversation concernée", () => {
    expect(
      getNotificationTarget(
        {
          type: "MESSAGE_RECEIVED",
          metadata: { conversationId: "conv-1" },
        },
        "PATIENT",
      ),
    ).toBe("/patient/messages?conversationId=conv-1");
  });

  it("redirige un praticien vers la conversation concernée", () => {
    expect(
      getNotificationTarget(
        {
          type: "MESSAGE_RECEIVED",
          metadata: { conversationId: "conv-2" },
        },
        "PRACTITIONER",
      ),
    ).toBe("/practitioner/messages?conversationId=conv-2");
  });

  it("redirige un rappel de téléconsultation patient vers la section téléconsultation", () => {
    expect(
      getNotificationTarget(
        {
          type: "APPOINTMENT_REMINDER",
          metadata: {
            appointmentId: "apt-1",
            appointmentType: "TELECONSULTATION",
          },
        },
        "PATIENT",
      ),
    ).toBe("/patient/teleconsultations?appointmentId=apt-1");
  });

  it("redirige un document partagé vers les documents du patient", () => {
    expect(
      getNotificationTarget(
        {
          type: "DOCUMENT_SHARED",
          metadata: { documentId: "doc-1" },
        },
        "PATIENT",
      ),
    ).toBe("/patient/documents?documentId=doc-1");
  });

  it("ignore une cible explicite externe", () => {
    expect(
      getNotificationTarget(
        {
          type: "SYSTEM_ALERT",
          metadata: { targetPath: "https://example.com" },
        },
        "ADMIN",
      ),
    ).toBe("/admin/dashboard");
  });

  it("accepte une cible explicite interne", () => {
    expect(
      getNotificationTarget(
        {
          type: "SYSTEM_ALERT",
          metadata: { targetPath: "/admin/settings#security" },
        },
        "ADMIN",
      ),
    ).toBe("/admin/settings#security");
  });
});
