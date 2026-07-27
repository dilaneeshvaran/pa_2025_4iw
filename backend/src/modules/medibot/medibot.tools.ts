import { FunctionDeclaration, Type } from '@google/genai'
import prisma from '../../config/database'
import { practitionersService } from '../practitioners/practitioners.service'
import { appointmentsService } from '../appointments/appointments.service'
import { reserveSlot } from '../../config/redis'

export interface ToolContext {
  patientId: string | null
  isAuthenticated: boolean
  timezoneOffset?: string
}

export type MedibotAction =
  | { type: 'practitioners'; practitioners: unknown[] }
  | {
      type: 'slots'
      practitionerId: string
      practitionerName: string
      days: unknown[]
    }
  | { type: 'booking_confirm'; booking: Record<string, unknown> }
  | { type: 'auth'; mode: 'login' | 'signup' | 'reset' }
  | { type: 'logout' }
  | { type: 'navigate'; path: string; label: string }
  | { type: 'quick_replies'; options: string[] }

export interface ToolExecutionResult {
  result: Record<string, unknown>
  action?: MedibotAction
}

const NAVIGATION_TARGETS: Record<string, { path: string; label: string }> = {
  search: { path: '/search', label: 'Rechercher un praticien' },
  home: { path: '/', label: "Page d'accueil" },
  appointments: { path: '/patient/appointments', label: 'Mes rendez-vous' },
  teleconsultations: {
    path: '/patient/teleconsultations',
    label: 'Mes téléconsultations',
  },
  documents: { path: '/patient/documents', label: 'Mes documents' },
  medical_record: {
    path: '/patient/medical-record',
    label: 'Mon dossier médical',
  },
  billing: { path: '/patient/billing', label: 'Ma facturation' },
  messages: { path: '/patient/messages', label: 'Ma messagerie' },
  settings: { path: '/patient/settings', label: 'Mes paramètres' },
  dashboard: { path: '/patient/dashboard', label: 'Mon tableau de bord' },
}

export const medibotToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'list_specialties',
    description:
      'Liste les spécialités médicales disponibles sur Medicote. À utiliser pour associer des symptômes à la bonne spécialité avant de chercher un praticien.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'search_practitioners',
    description:
      "Recherche des praticiens sur Medicote par spécialité, ville et/ou nom. Renvoie une liste que l'interface affiche sous forme de cartes.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        specialty: {
          type: Type.STRING,
          description:
            "Nom de la spécialité recherchée (ex: 'Cardiologie', 'Dermatologie').",
        },
        city: {
          type: Type.STRING,
          description: 'Ville où chercher (ex: Abidjan).',
        },
        query: {
          type: Type.STRING,
          description: 'Nom du praticien ou du cabinet.',
        },
        teleconsultationOnly: {
          type: Type.BOOLEAN,
          description:
            'Ne garder que les praticiens proposant la téléconsultation.',
        },
      },
    },
  },
  {
    name: 'get_available_slots',
    description:
      "Récupère les créneaux disponibles d'un praticien sur les prochains jours. Nécessite l'identifiant du praticien (obtenu via search_practitioners).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        practitionerId: {
          type: Type.STRING,
          description: 'Identifiant du praticien.',
        },
        days: {
          type: Type.NUMBER,
          description:
            'Nombre de jours à regarder en avant (1 à 30, défaut 14).',
        },
      },
      required: ['practitionerId'],
    },
  },
  {
    name: 'prepare_booking',
    description:
      'Prépare (mais NE confirme PAS) une réservation après que le patient a choisi praticien, date, heure et type. Vérifie les règles du praticien côté serveur et affiche une carte de confirmation que le patient valide lui-même. Réservé aux patients connectés.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        practitionerId: {
          type: Type.STRING,
          description: 'Identifiant du praticien.',
        },
        appointmentDate: {
          type: Type.STRING,
          description: 'Date au format AAAA-MM-JJ.',
        },
        startTime: {
          type: Type.STRING,
          description: 'Heure de début au format HH:mm.',
        },
        type: {
          type: Type.STRING,
          enum: ['IN_PERSON', 'TELECONSULTATION'],
          description:
            'IN_PERSON pour un rendez-vous au cabinet, TELECONSULTATION pour une téléconsultation.',
        },
        reason: {
          type: Type.STRING,
          description: 'Motif de consultation (optionnel).',
        },
      },
      required: ['practitionerId', 'appointmentDate', 'startTime', 'type'],
    },
  },
  {
    name: 'request_authentication',
    description:
      "Affiche un formulaire sécurisé pour que le visiteur se connecte, crée un compte patient, ou réinitialise son mot de passe. À utiliser quand une action nécessite d'être connecté. Tu ne collectes JAMAIS toi-même le mot de passe.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        mode: {
          type: Type.STRING,
          enum: ['login', 'signup', 'reset'],
          description:
            'login = se connecter, signup = créer un compte, reset = mot de passe oublié.',
        },
      },
      required: ['mode'],
    },
  },
  {
    name: 'logout',
    description: 'Déconnecte le patient connecté de son compte Medicote.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'navigate_to_page',
    description:
      'Redirige le patient vers une page de Medicote. Valeurs possibles: search, home, appointments, teleconsultations, documents, medical_record, billing, messages, settings, dashboard.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        page: { type: Type.STRING, description: 'Clé de la page cible.' },
      },
      required: ['page'],
    },
  },
]

function needsAuth(): ToolExecutionResult {
  return {
    result: {
      status: 'needs_auth',
      message:
        "Cette action nécessite d'être connecté en tant que patient. Invite le visiteur à se connecter ou à créer un compte.",
    },
    action: { type: 'auth', mode: 'login' },
  }
}

async function runSearchPractitioners(
  args: Record<string, unknown>,
): Promise<ToolExecutionResult> {
  const specialtyName =
    typeof args.specialty === 'string' ? args.specialty.trim() : undefined
  const city = typeof args.city === 'string' ? args.city.trim() : undefined
  const query = typeof args.query === 'string' ? args.query.trim() : undefined
  const teleOnly = args.teleconsultationOnly === true

  let specialtyId: string | undefined
  if (specialtyName) {
    const specialty = await prisma.specialty.findFirst({
      where: { name: { contains: specialtyName, mode: 'insensitive' } },
      select: { id: true },
    })
    specialtyId = specialty?.id
  }

  const { data } = await practitionersService.searchPractitioners({
    search: query,
    specialtyId,
    city,
    teleconsultationEnabled: teleOnly ? true : undefined,
    page: 1,
    limit: 6,
  })

  const cards = data.map((p) => ({
    id: p.id,
    name: `${p.title ? p.title + ' ' : ''}${p.firstName} ${p.lastName}`,
    firstName: p.firstName,
    lastName: p.lastName,
    title: p.title,
    specialty:
      p.specialties.find((s) => s.isPrimary)?.name ||
      p.specialties[0]?.name ||
      null,
    city: p.city,
    address: p.address,
    clinicName: p.clinicName,
    baseConsultationFee: p.baseConsultationFee,
    teleconsultationFee: p.teleconsultationFee,
    teleconsultationEnabled: p.teleconsultationEnabled,
    averageRating: p.averageRating,
    totalReviews: p.totalReviews,
  }))

  const summaryForModel = cards.map((c) => ({
    id: c.id,
    name: c.name,
    specialty: c.specialty,
    city: c.city,
    teleconsultation: c.teleconsultationEnabled,
    fee: c.baseConsultationFee,
  }))

  return {
    result: {
      status: 'ok',
      count: cards.length,
      practitioners: summaryForModel,
      note:
        cards.length === 0
          ? "Aucun praticien trouvé pour ces critères. Propose d'élargir la recherche."
          : 'Les cartes détaillées sont affichées au patient. Résume et invite à choisir.',
    },
    action:
      cards.length > 0
        ? { type: 'practitioners', practitioners: cards }
        : undefined,
  }
}

async function runGetAvailableSlots(
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolExecutionResult> {
  const practitionerId = String(args.practitionerId || '')
  if (!practitionerId) {
    return { result: { status: 'error', message: 'practitionerId manquant.' } }
  }
  const days = Math.min(Math.max(Number(args.days) || 14, 1), 30)

  const practitioner = await prisma.practitioner.findUnique({
    where: { id: practitionerId },
    select: { firstName: true, lastName: true, title: true },
  })
  if (!practitioner) {
    return { result: { status: 'error', message: 'Praticien introuvable.' } }
  }

  const slots = await practitionersService.getAvailableSlots(
    practitionerId,
    undefined,
    undefined,
    days,
    ctx.timezoneOffset,
  )

  const daysWithSlots = slots.filter((d) => d.slots.length > 0).slice(0, 10)
  const practitionerName = `${practitioner.title ? practitioner.title + ' ' : ''}${practitioner.firstName} ${practitioner.lastName}`

  return {
    result: {
      status: 'ok',
      practitionerName,
      availableDays: daysWithSlots.map((d) => ({
        date: d.date,
        times: d.slots.slice(0, 12),
      })),
      note:
        daysWithSlots.length === 0
          ? 'Aucun créneau disponible sur la période. Propose une autre période ou un autre praticien.'
          : 'Les créneaux sont affichés au patient. Demande-lui quelle date et quelle heure lui conviennent.',
    },
    action:
      daysWithSlots.length > 0
        ? {
            type: 'slots',
            practitionerId,
            practitionerName,
            days: daysWithSlots,
          }
        : undefined,
  }
}

async function runPrepareBooking(
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolExecutionResult> {
  if (!ctx.patientId) return needsAuth()

  const practitionerId = String(args.practitionerId || '')
  const appointmentDate = String(args.appointmentDate || '')
  const startTime = String(args.startTime || '')
  const type =
    args.type === 'TELECONSULTATION' ? 'TELECONSULTATION' : 'IN_PERSON'
  const reason = typeof args.reason === 'string' ? args.reason : undefined

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate) ||
    !/^\d{2}:\d{2}$/.test(startTime)
  ) {
    return {
      result: {
        status: 'invalid',
        message: 'Date (AAAA-MM-JJ) ou heure (HH:mm) invalide.',
      },
    }
  }

  const practitioner = await prisma.practitioner.findUnique({
    where: { id: practitionerId },
    select: {
      firstName: true,
      lastName: true,
      title: true,
      baseConsultationFee: true,
      teleconsultationFee: true,
      teleconsultationEnabled: true,
    },
  })
  if (!practitioner) {
    return { result: { status: 'invalid', message: 'Praticien introuvable.' } }
  }
  if (type === 'TELECONSULTATION' && !practitioner.teleconsultationEnabled) {
    return {
      result: {
        status: 'invalid',
        message:
          'Ce praticien ne propose pas la téléconsultation. Propose un rendez-vous au cabinet.',
      },
    }
  }

  try {
    await appointmentsService.validateSlotBooking({
      practitionerId,
      appointmentDate,
      startTime,
      patientId: ctx.patientId,
      timezoneOffset: ctx.timezoneOffset,
    })
  } catch (err) {
    return {
      result: {
        status: 'invalid',
        message:
          err instanceof Error
            ? err.message
            : 'Ce créneau ne peut pas être réservé.',
      },
    }
  }

  try {
    await reserveSlot(practitionerId, appointmentDate, startTime, ctx.patientId)
  } catch {}

  const fee =
    type === 'TELECONSULTATION' && practitioner.teleconsultationFee != null
      ? Number(practitioner.teleconsultationFee)
      : Number(practitioner.baseConsultationFee)
  const requiresPayment = type === 'TELECONSULTATION'
  const practitionerName = `${practitioner.title ? practitioner.title + ' ' : ''}${practitioner.firstName} ${practitioner.lastName}`

  const booking = {
    practitionerId,
    practitionerName,
    appointmentDate,
    startTime,
    type,
    reason: reason || null,
    fee,
    currency: 'FCFA',
    requiresPayment,
  }

  return {
    result: {
      status: 'ready',
      booking: {
        practitionerName,
        appointmentDate,
        startTime,
        type,
        fee,
        currency: 'FCFA',
        requiresPayment,
      },
      note: requiresPayment
        ? "Une carte de confirmation puis de paiement (téléconsultation) est affichée. C'est le patient qui confirme et paie."
        : "Une carte de confirmation est affichée. C'est le patient qui confirme.",
    },
    action: { type: 'booking_confirm', booking },
  }
}

function runNavigate(args: Record<string, unknown>): ToolExecutionResult {
  const page = String(args.page || '')
  const target = NAVIGATION_TARGETS[page]
  if (!target) {
    return {
      result: {
        status: 'error',
        message: `Page inconnue. Pages valides: ${Object.keys(NAVIGATION_TARGETS).join(', ')}.`,
      },
    }
  }
  return {
    result: { status: 'ok', path: target.path, label: target.label },
    action: { type: 'navigate', path: target.path, label: target.label },
  }
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolExecutionResult> {
  switch (name) {
    case 'list_specialties': {
      const specialties = await prisma.specialty.findMany({
        orderBy: { name: 'asc' },
        select: { name: true },
      })
      return {
        result: { status: 'ok', specialties: specialties.map((s) => s.name) },
      }
    }
    case 'search_practitioners':
      return runSearchPractitioners(args)
    case 'get_available_slots':
      return runGetAvailableSlots(args, ctx)
    case 'prepare_booking':
      return runPrepareBooking(args, ctx)
    case 'request_authentication': {
      const mode =
        args.mode === 'signup' || args.mode === 'reset'
          ? (args.mode as 'signup' | 'reset')
          : 'login'
      return {
        result: {
          status: 'ok',
          message: `Formulaire ${mode} affiché au patient.`,
        },
        action: { type: 'auth', mode },
      }
    }
    case 'logout': {
      if (!ctx.isAuthenticated) {
        return {
          result: {
            status: 'noop',
            message: "Le visiteur n'est pas connecté.",
          },
        }
      }
      return {
        result: { status: 'ok', message: 'Déconnexion demandée.' },
        action: { type: 'logout' },
      }
    }
    case 'navigate_to_page':
      return runNavigate(args)
    default:
      return { result: { status: 'error', message: `Outil inconnu: ${name}` } }
  }
}
