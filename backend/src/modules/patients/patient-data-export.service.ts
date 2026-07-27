import prisma from '../../config/database'
import {
  escapeHtml,
  formatPdfAmount,
  formatPdfDate,
  formatPdfDateTime,
  pdfBadge,
  pdfChips,
  pdfEmpty,
  pdfKeyValues,
  pdfProse,
  pdfRecord,
  pdfSection,
  pdfStatGrid,
  pdfTable,
  renderThemedPdf,
  type PdfTone,
} from '../../utils/pdf'

// egpd article 15 : the patient can ask for a copy of everything we hold about

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Homme',
  FEMALE: 'Femme',
  OTHER: 'Autre',
  PREFER_NOT_TO_SAY: 'Non précisé',
}

const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  SUSPENDED: 'Suspendu',
  PENDING_VERIFICATION: 'En attente de vérification',
}

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  CANCELLED: 'Annulé',
  COMPLETED: 'Terminé',
  NO_SHOW: 'Absence',
  RESCHEDULED: 'Reporté',
}

const APPOINTMENT_STATUS_TONES: Record<string, PdfTone> = {
  PENDING: 'neutral',
  CONFIRMED: 'orange',
  CANCELLED: 'danger',
  COMPLETED: 'green',
  NO_SHOW: 'danger',
  RESCHEDULED: 'neutral',
}

const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  IN_PERSON: 'En cabinet',
  TELECONSULTATION: 'Téléconsultation',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: 'Carte bancaire',
  MOBILE_MONEY: 'Mobile Money',
  PAYPAL: 'PayPal',
  CASH: 'Espèces',
  CHECK: 'Chèque',
  TRANSFER: 'Virement',
  ONLINE: 'En ligne',
  OTHER: 'Autre',
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  COMPLETED: 'Payé',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé',
  CANCELLED: 'Annulé',
}

const PAYMENT_STATUS_TONES: Record<string, PdfTone> = {
  PENDING: 'neutral',
  COMPLETED: 'green',
  FAILED: 'danger',
  REFUNDED: 'orange',
  CANCELLED: 'danger',
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  PRESCRIPTION: 'Ordonnance',
  LAB_RESULT: 'Résultat de laboratoire',
  RADIOLOGY: 'Imagerie',
  MEDICAL_REPORT: 'Compte rendu médical',
  CONSENT_FORM: 'Formulaire de consentement',
  INSURANCE: 'Assurance',
  CERTIFICATE: 'Certificat',
  OTHER: 'Autre',
}

const CONSENT_TYPE_LABELS: Record<string, string> = {
  TERMS_OF_SERVICE: "Conditions générales d'utilisation",
  PRIVACY_POLICY: 'Politique de confidentialité',
  DATA_PROCESSING: 'Traitement des données personnelles',
  MEDICAL_DATA: 'Traitement des données médicales',
  MARKETING: 'Communications marketing',
  COOKIES: 'Cookies et traceurs',
}

const HEALTH_REMINDER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
}

const METRIC_LABELS: Record<string, string> = {
  weight: 'Poids',
  height: 'Taille',
  bloodPressure: 'Tension artérielle',
  heartRate: 'Fréquence cardiaque',
  temperature: 'Température',
  bloodSugar: 'Glycémie',
  oxygenSaturation: 'Saturation en oxygène',
  steps: 'Pas quotidiens',
}

function label(
  dictionary: Record<string, string>,
  key?: string | null,
): string {
  if (!key) return '—'
  return dictionary[key] ?? key
}

function yesNo(value: boolean | null | undefined): string {
  return value ? 'Oui' : 'Non'
}

function decimalToString(value: unknown, unit = ''): string {
  if (value === null || value === undefined) return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  return `${num}${unit ? ` ${unit}` : ''}`
}

function maskAccountRef(value?: string | null): string {
  if (!value) return '—'
  if (value.length <= 4) return `••••${value}`
  return `••••${value.slice(-4)}`
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function practitionerName(
  p?: {
    title?: string | null
    firstName: string
    lastName: string
  } | null,
): string {
  if (!p) return '—'
  return `${p.title ? `${p.title} ` : ''}${p.firstName} ${p.lastName}`.trim()
}

function medicationsToText(medications: unknown): string {
  if (!medications) return '—'
  if (typeof medications === 'string') return medications
  if (!Array.isArray(medications)) return JSON.stringify(medications)
  return medications
    .map((raw) => {
      const med = raw as Record<string, unknown>
      const parts = [
        med.name,
        med.dosage,
        med.frequency,
        med.duration,
        med.instructions,
      ]
        .filter((part) => typeof part === 'string' && part.trim().length > 0)
        .map(String)
      return parts.length ? `• ${parts.join(' — ')}` : ''
    })
    .filter(Boolean)
    .join('\n')
}

export class PatientDataExportService {
  private async collect(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        role: true,
        status: true,
        twoFactorEnabled: true,
        googleId: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
        notificationPreference: true,
        consents: { orderBy: { acceptedAt: 'desc' } },
        patient: true,
      },
    })

    if (!user) {
      throw new Error('Utilisateur introuvable')
    }
    if (!user.patient) {
      throw new Error('Profil patient introuvable')
    }

    const patientId = user.patient.id

    const [
      appointments,
      medicalRecords,
      prescriptions,
      documents,
      vaccinations,
      payments,
      reviews,
      savedPaymentMethods,
      healthReminders,
      metrics,
      metricHistory,
      sharedRecords,
      deletionRequests,
      exportRequests,
    ] = await Promise.all([
      prisma.appointment.findMany({
        where: { patientId },
        orderBy: { appointmentDate: 'desc' },
        include: {
          practitioner: {
            select: { title: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.medicalRecord.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        include: {
          practitioner: {
            select: { title: true, firstName: true, lastName: true },
          },
          appointment: { select: { appointmentDate: true } },
        },
      }),
      prisma.prescription.findMany({
        where: { patientId },
        orderBy: { issuedDate: 'desc' },
        include: {
          practitioner: {
            select: { title: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.document.findMany({
        where: { patientId },
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.vaccinationRecord.findMany({
        where: { patientId },
        orderBy: { administeredAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: { select: { invoiceNumber: true, total: true } },
          practitioner: {
            select: { title: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.review.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        include: {
          practitioner: {
            select: { title: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.savedPaymentMethod.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.healthReminder.findMany({
        where: { patientId },
        orderBy: { startDate: 'desc' },
        include: {
          practitioner: {
            select: { title: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.patientMetric.findMany({ where: { patientId } }),
      prisma.patientMetricHistory.findMany({
        where: { patientId },
        orderBy: { recordedAt: 'desc' },
        take: 200,
      }),
      prisma.sharedMedicalRecord.findMany({
        where: { patientId },
        orderBy: { sharedAt: 'desc' },
        include: {
          practitioner: {
            select: { title: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.dataDeletionRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dataExportRequest.findMany({
        where: { userId },
        orderBy: { requestedAt: 'desc' },
        take: 20,
      }),
    ])

    return {
      user,
      patient: user.patient,
      appointments,
      medicalRecords,
      prescriptions,
      documents,
      vaccinations,
      payments,
      reviews,
      savedPaymentMethods,
      healthReminders,
      metrics,
      metricHistory,
      sharedRecords,
      deletionRequests,
      exportRequests,
    }
  }

  async buildExportPdf(userId: string): Promise<{
    buffer: Buffer
    fileName: string
    patientName: string
    email: string
    generatedAt: Date
    counts: Record<string, number>
  }> {
    const data = await this.collect(userId)
    const { user, patient } = data
    const patientName = `${patient.firstName} ${patient.lastName}`
    const generatedAt = new Date()

    const counts = {
      appointments: data.appointments.length,
      medicalRecords: data.medicalRecords.length,
      prescriptions: data.prescriptions.length,
      documents: data.documents.length,
      vaccinations: data.vaccinations.length,
      payments: data.payments.length,
      reviews: data.reviews.length,
      consents: user.consents.length,
      healthReminders: data.healthReminders.length,
      metrics: data.metrics.length,
    }

    const sections: string[] = []

    sections.push(
      pdfSection({
        title: 'Résumé de vos données',
        subtitle: 'Volumétrie par catégorie',
        tone: 'green',
        bodyHtml: pdfStatGrid(
          [
            {
              label: 'Rendez-vous',
              value: String(counts.appointments),
              tone: 'orange',
            },
            {
              label: 'Consultations',
              value: String(counts.medicalRecords),
              hint: 'Dossiers médicaux',
              tone: 'green',
            },
            {
              label: 'Ordonnances',
              value: String(counts.prescriptions),
              tone: 'orange',
            },
            {
              label: 'Documents',
              value: String(counts.documents),
              tone: 'green',
            },
            {
              label: 'Paiements',
              value: String(counts.payments),
              tone: 'orange',
            },
            {
              label: 'Vaccinations',
              value: String(counts.vaccinations),
              tone: 'green',
            },
            {
              label: 'Avis publiés',
              value: String(counts.reviews),
              tone: 'orange',
            },
            {
              label: 'Consentements',
              value: String(counts.consents),
              tone: 'green',
            },
          ],
          { columns: 4 },
        ),
      }),
    )

    sections.push(
      pdfSection({
        title: 'Compte utilisateur',
        subtitle: 'Données de connexion',
        tone: 'orange',
        bodyHtml: pdfKeyValues([
          { label: 'Adresse e-mail', value: user.email },
          {
            label: 'E-mail vérifié le',
            value: formatPdfDateTime(user.emailVerified),
          },
          {
            label: 'Statut du compte',
            value: label(USER_STATUS_LABELS, user.status),
          },
          { label: 'Rôle', value: 'Patient' },
          {
            label: 'Double authentification',
            value: yesNo(user.twoFactorEnabled),
          },
          {
            label: 'Connexion Google liée',
            value: yesNo(Boolean(user.googleId)),
          },
          {
            label: 'Dernière connexion',
            value: formatPdfDateTime(user.lastLoginAt),
          },
          { label: 'Dernière IP connue', value: user.lastLoginIp || '—' },
          { label: 'Compte créé le', value: formatPdfDateTime(user.createdAt) },
          {
            label: 'Dernière mise à jour',
            value: formatPdfDateTime(user.updatedAt),
          },
        ]),
      }),
    )

    sections.push(
      pdfSection({
        title: 'Identité et coordonnées',
        tone: 'green',
        bodyHtml: pdfKeyValues([
          { label: 'Prénom', value: patient.firstName },
          { label: 'Nom', value: patient.lastName },
          {
            label: 'Date de naissance',
            value: formatPdfDate(patient.dateOfBirth),
          },
          { label: 'Genre', value: label(GENDER_LABELS, patient.gender) },
          { label: 'Téléphone', value: patient.phone },
          { label: 'Adresse', value: patient.address || '—' },
          { label: 'Ville', value: patient.city || '—' },
          { label: 'Code postal', value: patient.postalCode || '—' },
          { label: 'Pays', value: patient.country },
          {
            label: 'Contact d’urgence',
            value: patient.emergencyContactName || '—',
          },
          {
            label: 'Téléphone d’urgence',
            value: patient.emergencyContactPhone || '—',
          },
          {
            label: 'Assurance',
            value: patient.insuranceProvider || '—',
          },
          {
            label: 'N° d’assuré',
            value: patient.insuranceNumber || '—',
          },
          {
            label: 'Profil créé le',
            value: formatPdfDateTime(patient.createdAt),
          },
        ]),
      }),
    )

    sections.push(
      pdfSection({
        title: 'Profil médical',
        subtitle: 'Informations déclarées',
        tone: 'orange',
        bodyHtml: [
          pdfKeyValues([
            { label: 'Groupe sanguin', value: patient.bloodType || '—' },
            { label: 'Taille', value: decimalToString(patient.height, 'cm') },
            { label: 'Poids', value: decimalToString(patient.weight, 'kg') },
          ]),
          `<div style="margin-top:12px"><span class="kv-label">Allergies</span>${pdfChips(
            patient.allergies,
            'danger',
          )}</div>`,
          `<div style="margin-top:10px"><span class="kv-label">Maladies chroniques</span>${pdfChips(
            patient.chronicConditions,
            'orange',
          )}</div>`,
          `<div style="margin-top:10px"><span class="kv-label">Opérations chirurgicales</span>${pdfChips(
            patient.surgicalOperations,
            'neutral',
          )}</div>`,
        ].join(''),
      }),
    )

    sections.push(
      pdfSection({
        title: 'Rendez-vous',
        subtitle: `${counts.appointments} enregistrement${counts.appointments > 1 ? 's' : ''}`,
        tone: 'green',
        bodyHtml: pdfTable({
          rawCells: true,
          columns: [
            { header: 'Date', strong: true, width: '16%' },
            { header: 'Heure', width: '10%' },
            { header: 'Praticien', width: '22%' },
            { header: 'Type', width: '14%' },
            { header: 'Statut', width: '14%' },
            { header: 'Motif' },
            { header: 'Tarif', numeric: true, width: '13%' },
          ],
          rows: data.appointments.map((apt) => [
            escapeHtml(formatPdfDate(apt.appointmentDate)),
            escapeHtml(`${apt.startTime} - ${apt.endTime}`),
            escapeHtml(practitionerName(apt.practitioner)),
            escapeHtml(label(APPOINTMENT_TYPE_LABELS, apt.type)),
            pdfBadge(
              label(APPOINTMENT_STATUS_LABELS, apt.status),
              APPOINTMENT_STATUS_TONES[apt.status] ?? 'neutral',
            ),
            escapeHtml(apt.reason || '—'),
            escapeHtml(formatPdfAmount(Number(apt.consultationFee))),
          ]),
          emptyText: 'Aucun rendez-vous enregistré',
        }),
      }),
    )

    const recordsHtml = data.medicalRecords.length
      ? data.medicalRecords
          .map((record) => {
            const vitals = [
              record.bloodPressure ? `TA ${record.bloodPressure}` : '',
              record.heartRate ? `FC ${record.heartRate} bpm` : '',
              record.temperature
                ? `T° ${decimalToString(record.temperature, '°C')}`
                : '',
              record.weight ? `${decimalToString(record.weight, 'kg')}` : '',
              record.height ? `${decimalToString(record.height, 'cm')}` : '',
            ].filter(Boolean)

            return pdfRecord({
              title: formatPdfDate(
                record.appointment?.appointmentDate ?? record.createdAt,
              ),
              aside: practitionerName(record.practitioner),
              chipsHtml: vitals.length ? pdfChips(vitals, 'green') : undefined,
              bodyHtml: pdfProse([
                {
                  label: 'Motif de consultation',
                  text: record.chiefComplaint ?? '',
                },
                {
                  label: 'Histoire de la maladie',
                  text: record.historyOfIllness ?? '',
                },
                { label: 'Examen clinique', text: record.examination ?? '' },
                { label: 'Diagnostic', text: record.diagnosis ?? '' },
                {
                  label: 'Plan de traitement',
                  text: record.treatmentPlan ?? '',
                },
              ]),
            })
          })
          .join('')
      : pdfEmpty('Aucun dossier médical enregistré')

    sections.push(
      pdfSection({
        title: 'Dossiers médicaux',
        subtitle: `${counts.medicalRecords} consultation${counts.medicalRecords > 1 ? 's' : ''}`,
        tone: 'orange',
        bodyHtml: recordsHtml,
      }),
    )

    sections.push(
      pdfSection({
        title: 'Ordonnances',
        subtitle: `${counts.prescriptions} ordonnance${counts.prescriptions > 1 ? 's' : ''}`,
        tone: 'green',
        bodyHtml: pdfTable({
          columns: [
            { header: 'Émise le', strong: true, width: '16%' },
            { header: 'Praticien', width: '22%' },
            { header: 'Valide jusqu’au', width: '16%' },
            { header: 'Médicaments' },
          ],
          rows: data.prescriptions.map((p) => [
            formatPdfDate(p.issuedDate),
            practitionerName(p.practitioner),
            formatPdfDate(p.validUntil),
            medicationsToText(p.medications),
          ]),
          emptyText: 'Aucune ordonnance enregistrée',
        }),
      }),
    )

    sections.push(
      pdfSection({
        title: 'Documents',
        subtitle: 'Fichiers stockés dans votre espace',
        tone: 'orange',
        bodyHtml: pdfTable({
          columns: [
            { header: 'Titre', strong: true },
            { header: 'Type', width: '20%' },
            { header: 'Fichier', width: '22%' },
            { header: 'Taille', numeric: true, width: '12%' },
            { header: 'Ajouté le', width: '18%' },
          ],
          rows: data.documents.map((doc) => [
            doc.title,
            label(DOCUMENT_TYPE_LABELS, doc.type),
            doc.fileName,
            formatBytes(doc.fileSize),
            formatPdfDate(doc.uploadedAt),
          ]),
          emptyText: 'Aucun document stocké',
        }),
      }),
    )

    sections.push(
      pdfSection({
        title: 'Carnet de vaccination',
        tone: 'green',
        bodyHtml: pdfTable({
          columns: [
            { header: 'Vaccin', strong: true },
            { header: 'Dose', numeric: true, width: '8%' },
            { header: 'Administré le', width: '16%' },
            { header: 'Par', width: '18%' },
            { header: 'Prochaine dose', width: '16%' },
            { header: 'Effets secondaires' },
          ],
          rows: data.vaccinations.map((v) => [
            v.vaccineName,
            String(v.doseNumber),
            formatPdfDate(v.administeredAt),
            v.administeredBy || '—',
            formatPdfDate(v.nextDoseDate),
            v.sideEffects || '—',
          ]),
          emptyText: 'Aucune vaccination enregistrée',
        }),
      }),
    )

    sections.push(
      pdfSection({
        title: 'Constantes de santé',
        subtitle: 'Dernières valeurs enregistrées',
        tone: 'orange',
        bodyHtml: [
          pdfTable({
            columns: [
              { header: 'Constante', strong: true },
              { header: 'Valeur', numeric: true, width: '18%' },
              { header: 'Unité', width: '14%' },
              { header: 'Relevé le', width: '24%' },
            ],
            rows: data.metrics.map((m) => [
              label(METRIC_LABELS, m.metricType),
              String(m.value),
              m.unit,
              formatPdfDateTime(m.recordedAt),
            ]),
            emptyText: 'Aucune constante enregistrée',
          }),
          data.metricHistory.length
            ? `<p style="margin-top:10px;font-size:9.5px;color:#6b7280">Historique : ${data.metricHistory.length} relevé${
                data.metricHistory.length > 1 ? 's' : ''
              } conservé${data.metricHistory.length > 1 ? 's' : ''} (${escapeHtml(
                formatPdfDate(
                  data.metricHistory[data.metricHistory.length - 1]?.recordedAt,
                ),
              )} → ${escapeHtml(formatPdfDate(data.metricHistory[0]?.recordedAt))}).</p>`
            : '',
        ].join(''),
      }),
    )

    sections.push(
      pdfSection({
        title: 'Rappels santé',
        tone: 'green',
        bodyHtml: pdfTable({
          rawCells: true,
          columns: [
            { header: 'Message', strong: true },
            { header: 'Praticien', width: '20%' },
            { header: 'Du', width: '14%' },
            { header: 'Au', width: '14%' },
            { header: 'Horaires', width: '16%' },
            { header: 'Statut', width: '12%' },
          ],
          rows: data.healthReminders.map((r) => [
            escapeHtml(r.message),
            escapeHtml(practitionerName(r.practitioner)),
            escapeHtml(formatPdfDate(r.startDate)),
            escapeHtml(formatPdfDate(r.endDate)),
            escapeHtml(r.times.join(', ') || '—'),
            pdfBadge(
              label(HEALTH_REMINDER_STATUS_LABELS, r.status),
              r.status === 'ACTIVE'
                ? 'green'
                : r.status === 'CANCELLED'
                  ? 'danger'
                  : 'neutral',
            ),
          ]),
          emptyText: 'Aucun rappel santé',
        }),
      }),
    )

    const totalPaid = data.payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    sections.push(
      pdfSection({
        title: 'Paiements et factures',
        subtitle: `Total réglé : ${formatPdfAmount(totalPaid)}`,
        tone: 'orange',
        bodyHtml: pdfTable({
          rawCells: true,
          columns: [
            { header: 'Facture', strong: true, width: '18%' },
            { header: 'Praticien', width: '20%' },
            { header: 'Montant', numeric: true, width: '16%' },
            { header: 'Moyen', width: '16%' },
            { header: 'Statut', width: '14%' },
            { header: 'Payé le' },
          ],
          rows: data.payments.map((p) => [
            escapeHtml(p.invoice?.invoiceNumber || p.invoiceNumber),
            escapeHtml(practitionerName(p.practitioner)),
            escapeHtml(formatPdfAmount(Number(p.amount), p.currency)),
            escapeHtml(label(PAYMENT_METHOD_LABELS, p.method)),
            pdfBadge(
              label(PAYMENT_STATUS_LABELS, p.status),
              PAYMENT_STATUS_TONES[p.status] ?? 'neutral',
            ),
            escapeHtml(formatPdfDate(p.paidAt)),
          ]),
          emptyText: 'Aucun paiement enregistré',
        }),
      }),
    )

    sections.push(
      pdfSection({
        title: 'Moyens de paiement enregistrés',
        subtitle: 'Références partiellement masquées',
        tone: 'green',
        bodyHtml: pdfTable({
          columns: [
            { header: 'Libellé', strong: true },
            { header: 'Type', width: '20%' },
            { header: 'Référence', width: '20%' },
            { header: 'Par défaut', width: '14%' },
            { header: 'Ajouté le', width: '20%' },
          ],
          rows: data.savedPaymentMethods.map((m) => [
            m.label,
            label(PAYMENT_METHOD_LABELS, m.type),
            m.cardLast4
              ? `${m.cardBrand ?? 'Carte'} ${maskAccountRef(m.cardLast4)}`
              : maskAccountRef(m.mobileNumber),
            yesNo(m.isDefault),
            formatPdfDate(m.createdAt),
          ]),
          emptyText: 'Aucun moyen de paiement enregistré',
        }),
      }),
    )

    sections.push(
      pdfSection({
        title: 'Avis que vous avez publiés',
        tone: 'orange',
        bodyHtml: pdfTable({
          columns: [
            { header: 'Praticien', strong: true, width: '24%' },
            { header: 'Note', numeric: true, width: '10%' },
            { header: 'Publié le', width: '16%' },
            { header: 'Commentaire' },
          ],
          rows: data.reviews.map((r) => [
            practitionerName(r.practitioner),
            `${r.rating} / 5`,
            formatPdfDate(r.createdAt),
            r.comment || '—',
          ]),
          emptyText: 'Aucun avis publié',
        }),
      }),
    )

    sections.push(
      pdfSection({
        title: 'Partages de dossier médical',
        subtitle: 'Praticiens autorisés par vous',
        tone: 'green',
        bodyHtml: pdfTable({
          columns: [
            { header: 'Praticien', strong: true },
            { header: 'Consultation', width: '14%' },
            { header: 'Modification', width: '14%' },
            { header: 'Partagé le', width: '18%' },
            { header: 'Révoqué le', width: '18%' },
          ],
          rows: data.sharedRecords.map((s) => [
            practitionerName(s.practitioner),
            yesNo(s.canView),
            yesNo(s.canEdit),
            formatPdfDate(s.sharedAt),
            formatPdfDate(s.revokedAt),
          ]),
          emptyText: 'Aucun partage de dossier',
        }),
      }),
    )

    const prefs = user.notificationPreference
    sections.push(
      pdfSection({
        title: 'Préférences de notification',
        tone: 'orange',
        bodyHtml: prefs
          ? pdfKeyValues([
              {
                label: 'Notifications e-mail',
                value: yesNo(prefs.emailNotifications),
              },
              {
                label: 'Notifications SMS',
                value: yesNo(prefs.smsNotifications),
              },
              {
                label: 'Rappels de rendez-vous',
                value: yesNo(prefs.appointmentReminders),
              },
              { label: 'Nouveaux messages', value: yesNo(prefs.newMessages) },
              {
                label: 'Conseils santé et actualités',
                value: yesNo(prefs.healthTipsAndNews),
              },
            ])
          : pdfEmpty('Préférences par défaut (aucune personnalisation)'),
      }),
    )

    sections.push(
      pdfSection({
        title: 'Consentements',
        subtitle: 'Historique RGPD',
        tone: 'green',
        bodyHtml: pdfTable({
          rawCells: true,
          columns: [
            { header: 'Consentement', strong: true },
            { header: 'Version', width: '12%' },
            { header: 'État', width: '14%' },
            { header: 'Accepté le', width: '20%' },
            { header: 'Révoqué le', width: '20%' },
          ],
          rows: user.consents.map((c) => [
            escapeHtml(label(CONSENT_TYPE_LABELS, c.consentType)),
            escapeHtml(c.version),
            pdfBadge(
              c.revokedAt ? 'Révoqué' : c.accepted ? 'Accepté' : 'Refusé',
              c.revokedAt ? 'neutral' : c.accepted ? 'green' : 'danger',
            ),
            escapeHtml(formatPdfDateTime(c.acceptedAt)),
            escapeHtml(formatPdfDateTime(c.revokedAt)),
          ]),
          emptyText: 'Aucun consentement enregistré',
        }),
      }),
    )

    const rgpdRows: string[][] = [
      ...data.exportRequests.map((r) => [
        'Export de données',
        r.status,
        formatPdfDateTime(r.requestedAt),
        formatPdfDateTime(r.completedAt),
      ]),
      ...data.deletionRequests.map((r) => [
        'Suppression de compte',
        r.status,
        formatPdfDateTime(r.createdAt),
        formatPdfDateTime(r.scheduledDeletionAt),
      ]),
    ]

    sections.push(
      pdfSection({
        title: 'Demandes RGPD',
        subtitle: 'Exports et suppressions',
        tone: 'orange',
        bodyHtml: pdfTable({
          columns: [
            { header: 'Type', strong: true },
            { header: 'Statut', width: '18%' },
            { header: 'Demandé le', width: '26%' },
            { header: 'Traité / prévu le', width: '26%' },
          ],
          rows: rgpdRows,
          emptyText: 'Aucune demande enregistrée',
        }),
      }),
    )

    const buffer = await renderThemedPdf({
      title: `Export de données - ${patientName}`,
      documentLabel: 'Export de données personnelles',
      headline: 'Copie de vos données personnelles',
      subline: `${patientName} — export réalisé au titre de l’article 15 du RGPD (droit d’accès).`,
      meta: [
        { label: 'Patient', value: patientName },
        { label: 'Adresse e-mail', value: user.email },
        { label: 'Identifiant patient', value: patient.id },
        { label: 'Généré le', value: formatPdfDateTime(generatedAt) },
      ],
      bodyHtml: sections.join(''),
      footerNote:
        'Ce document contient des données de santé à caractère personnel : conservez-le en lieu sûr et ne le partagez qu’avec des personnes de confiance. Pour toute question ou rectification, contactez-nous depuis votre espace MediCôte.',
    })

    const stamp = generatedAt.toISOString().substring(0, 10)
    const slug = patientName
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()

    return {
      buffer,
      fileName: `mes-donnees-medicote-${slug || 'patient'}-${stamp}.pdf`,
      patientName,
      email: user.email,
      generatedAt,
      counts,
    }
  }
}

export const patientDataExportService = new PatientDataExportService()
