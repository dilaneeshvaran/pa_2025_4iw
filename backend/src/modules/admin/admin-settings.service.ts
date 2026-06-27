import prisma from '../../config/database'
import { Prisma } from '@prisma/client'

type SettingType = 'number' | 'boolean' | 'stringList'

interface SettingDefinition {
  key: string
  label: string
  description?: string
  group: string
  type: SettingType
  // the inner JSON property the scalar value is stored under, e.g. { minutes: 30 }
  field: string
  default: number | boolean | string[]
  min?: number
  max?: number
}

// Single source of truth for the platform settings the admin can edit. The DB
// stores them as { [field]: value } JSON blobs (see seed); this registry maps
// each key to a flat, typed value the UI can render and validate.
export const SETTINGS_REGISTRY: SettingDefinition[] = [
  {
    key: 'appointment_slot_duration',
    label: "Durée d'un créneau",
    description: 'Durée par défaut des créneaux de rendez-vous (minutes).',
    group: 'Rendez-vous',
    type: 'number',
    field: 'minutes',
    default: 30,
    min: 5,
    max: 240,
  },
  {
    key: 'appointment_reservation_timeout',
    label: 'Délai de réservation',
    description:
      "Temps avant l'expiration d'une réservation non confirmée (minutes).",
    group: 'Rendez-vous',
    type: 'number',
    field: 'minutes',
    default: 10,
    min: 1,
    max: 120,
  },
  {
    key: 'max_no_show_before_penalty',
    label: 'No-shows avant sanction',
    description: "Nombre d'absences avant l'application d'une sanction.",
    group: 'Sanctions',
    type: 'number',
    field: 'count',
    default: 3,
    min: 1,
    max: 20,
  },
  {
    key: 'penalty_duration_days',
    label: 'Durée de la sanction',
    description: "Durée d'un bannissement automatique (jours).",
    group: 'Sanctions',
    type: 'number',
    field: 'days',
    default: 30,
    min: 1,
    max: 365,
  },
  {
    key: 'reminder_24h_enabled',
    label: 'Rappel 24h avant',
    description: 'Envoyer un rappel 24h avant le rendez-vous.',
    group: 'Rappels',
    type: 'boolean',
    field: 'enabled',
    default: true,
  },
  {
    key: 'reminder_1h_enabled',
    label: 'Rappel 1h avant',
    description: 'Envoyer un rappel 1h avant le rendez-vous.',
    group: 'Rappels',
    type: 'boolean',
    field: 'enabled',
    default: true,
  },
  {
    key: 'teleconsultation_enabled',
    label: 'Téléconsultation',
    description: 'Activer la téléconsultation sur la plateforme.',
    group: 'Fonctionnalités',
    type: 'boolean',
    field: 'enabled',
    default: true,
  },
  {
    key: 'mobile_money_providers',
    label: 'Fournisseurs Mobile Money',
    description: 'Liste des fournisseurs Mobile Money acceptés.',
    group: 'Paiements',
    type: 'stringList',
    field: 'providers',
    default: [],
  },
]

const REGISTRY_BY_KEY = new Map(SETTINGS_REGISTRY.map((d) => [d.key, d]))

export interface SettingDto {
  key: string
  label: string
  description?: string
  group: string
  type: SettingType
  value: number | boolean | string[]
  min?: number
  max?: number
}

function extractValue(
  def: SettingDefinition,
  stored: unknown,
): number | boolean | string[] {
  if (stored && typeof stored === 'object' && def.field in (stored as object)) {
    return (stored as Record<string, unknown>)[def.field] as never
  }
  return def.default
}

export class AdminSettingsService {
  async getSettings(): Promise<SettingDto[]> {
    const rows = await prisma.systemSetting.findMany()
    const byKey = new Map(rows.map((r) => [r.key, r.value]))

    return SETTINGS_REGISTRY.map((def) => ({
      key: def.key,
      label: def.label,
      description: def.description,
      group: def.group,
      type: def.type,
      value: extractValue(def, byKey.get(def.key)),
      min: def.min,
      max: def.max,
    }))
  }

  // validate a single (key, value) pair against the registry; throws on error
  private validate(key: string, value: unknown): SettingDefinition {
    const def = REGISTRY_BY_KEY.get(key)
    if (!def) {
      throw new Error(`Unknown setting: ${key}`)
    }

    if (def.type === 'number') {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new Error(`Invalid number for ${key}`)
      }
      if (def.min !== undefined && value < def.min) {
        throw new Error(`${key} must be >= ${def.min}`)
      }
      if (def.max !== undefined && value > def.max) {
        throw new Error(`${key} must be <= ${def.max}`)
      }
    } else if (def.type === 'boolean') {
      if (typeof value !== 'boolean') {
        throw new Error(`Invalid boolean for ${key}`)
      }
    } else if (def.type === 'stringList') {
      if (
        !Array.isArray(value) ||
        value.some((v) => typeof v !== 'string')
      ) {
        throw new Error(`Invalid list for ${key}`)
      }
    }

    return def
  }

  async updateSettings(
    updates: { key: string; value: unknown }[],
  ): Promise<SettingDto[]> {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('No settings provided')
    }

    // validate everything first so the update is all-or-nothing
    const validated = updates.map((u) => ({
      def: this.validate(u.key, u.value),
      value: u.value,
    }))

    await prisma.$transaction(
      validated.map(({ def, value }) => {
        const json = { [def.field]: value } as Prisma.InputJsonValue
        return prisma.systemSetting.upsert({
          where: { key: def.key },
          update: { value: json },
          create: { key: def.key, value: json },
        })
      }),
    )

    return this.getSettings()
  }
}

export const adminSettingsService = new AdminSettingsService()
