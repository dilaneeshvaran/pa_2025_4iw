<template>
  <div class="space-y-6">
    <!-- Header/Back button -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          @click="navigateTo('/cabinet/practitioners')"
          class="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft class="h-5 w-5" />
        </button>
        <div v-if="practitioner">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ practitioner.title }} {{ practitioner.firstName }} {{ practitioner.lastName }}
          </h1>
          <p class="text-sm text-gray-500">
            {{ practitioner.email }} · {{ practitioner.phone }} · {{ practitioner.specialties.join(', ') }}
          </p>
        </div>
      </div>
      <button
        @click="showBookingModal = true"
        class="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        <CalendarPlus class="h-4 w-4" />
        Nouveau rendez-vous
      </button>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            activeTab === tab.id
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors'
          ]"
        >
          <component :is="tab.icon" class="mr-2 inline-block h-4 w-4 align-text-bottom" />
          {{ tab.name }}
        </button>
      </nav>
    </div>

    <!-- Tab Contents -->
    <div class="mt-6">
      <!-- Planning Tab -->
      <div v-if="activeTab === 'planning'" class="space-y-6">
        <div class="grid gap-6 md:grid-cols-2">
          <!-- Availabilities -->
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 class="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock class="h-5 w-5 text-orange-500" />
              Horaires de travail dans ce cabinet
            </h3>
            <div v-if="schedule?.availabilities?.length" class="space-y-3">
              <div
                v-for="avail in schedule.availabilities"
                :key="avail.id"
                class="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div>
                  <span class="font-medium text-gray-900">{{ translateDay(avail.dayOfWeek) }}</span>
                  <span v-if="avail.isEmergencySlot" class="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Urgences</span>
                </div>
                <div class="text-sm text-gray-600 font-mono">
                  {{ avail.startTime }} - {{ avail.endTime }}
                </div>
              </div>
            </div>
            <div v-else class="text-center py-6 text-gray-500">
              Aucune disponibilité configurée pour ce cabinet.
            </div>
          </div>

          <!-- Absences & Blocked slots -->
          <div class="space-y-6">
            <!-- Absences -->
            <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 class="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CalendarX class="h-5 w-5 text-orange-500" />
                Absences programmées
              </h3>
              <div v-if="schedule?.absences?.length" class="space-y-3">
                <div
                  v-for="abs in schedule.absences"
                  :key="abs.id"
                  class="rounded-lg bg-gray-50 p-3"
                >
                  <div class="flex justify-between font-medium text-gray-900">
                    <span>{{ formatDateRange(abs.startDate, abs.endDate) }}</span>
                  </div>
                  <p v-if="abs.reason" class="text-sm text-gray-500 mt-1">
                    Raison : {{ abs.reason }}
                  </p>
                </div>
              </div>
              <div v-else class="text-center py-6 text-gray-500">
                Aucune absence programmée.
              </div>
            </div>

            <!-- Blocked slots -->
            <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 class="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ShieldAlert class="h-5 w-5 text-orange-500" />
                Créneaux bloqués
              </h3>
              <div v-if="schedule?.blockedSlots?.length" class="space-y-3">
                <div
                  v-for="slot in schedule.blockedSlots"
                  :key="slot.id"
                  class="flex justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div>
                    <span class="font-medium text-gray-900">{{ formatDate(slot.date) }}</span>
                    <p v-if="slot.reason" class="text-sm text-gray-500 mt-0.5">{{ slot.reason }}</p>
                  </div>
                  <span class="text-sm text-gray-600 font-mono self-start">
                    {{ slot.startTime }} - {{ slot.endTime }}
                  </span>
                </div>
              </div>
              <div v-else class="text-center py-6 text-gray-500">
                Aucun créneau bloqué.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Appointments Tab -->
      <div v-if="activeTab === 'appointments'" class="space-y-4">
        <!-- Date filter -->
        <div class="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label class="text-sm font-medium text-gray-700">Filtrer par date :</label>
          <input
            v-model="filterDate"
            type="date"
            class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none"
          />
          <button
            v-if="filterDate"
            @click="filterDate = ''"
            class="text-xs text-orange-600 hover:text-orange-700 font-medium"
          >
            Effacer le filtre
          </button>
        </div>

        <!-- Appointments list -->
        <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div v-if="loadingApts" class="animate-pulse space-y-3 p-6">
            <div v-for="i in 3" :key="i" class="h-16 rounded bg-gray-100"></div>
          </div>
          <div v-else-if="!appointments.length" class="py-12 text-center text-gray-500">
            <Calendar class="mx-auto mb-3 h-12 w-12 text-gray-300" />
            Aucun rendez-vous planifié.
          </div>
          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="apt in appointments"
              :key="apt.id"
              class="flex items-center justify-between p-4 transition-colors hover:bg-gray-50"
            >
              <div>
                <p class="font-semibold text-gray-900">
                  {{ apt.patient.firstName }} {{ apt.patient.lastName }}
                </p>
                <p class="text-sm text-gray-500 font-mono">
                  {{ formatDate(apt.appointmentDate) }} @ {{ apt.startTime }} - {{ apt.endTime }}
                </p>
                <p v-if="apt.reason" class="text-xs text-gray-400 mt-1 italic">
                  Motif: {{ apt.reason }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <span
                  :class="[
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    apt.type === 'IN_PERSON' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  ]"
                >
                  {{ apt.type === 'IN_PERSON' ? 'Présentiel' : 'Téléconsultation' }}
                </span>
                <span
                  :class="[
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  ]"
                >
                  {{ apt.status === 'CONFIRMED' ? 'Confirmé' : 'Annulé' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Patients Tab -->
      <div v-if="activeTab === 'patients'" class="space-y-4">
        <!-- Search bar -->
        <div class="relative">
          <Search class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            v-model="patientSearch"
            type="text"
            placeholder="Rechercher un patient par nom ou téléphone..."
            class="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-orange-500 focus:outline-none"
          />
        </div>

        <!-- Patients list -->
        <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div v-if="loadingPatients" class="animate-pulse space-y-3 p-6">
            <div v-for="i in 3" :key="i" class="h-16 rounded bg-gray-100"></div>
          </div>
          <div v-else-if="!patients.length" class="py-12 text-center text-gray-500">
            <Users class="mx-auto mb-3 h-12 w-12 text-gray-300" />
            Aucun patient trouvé.
          </div>
          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="pat in patients"
              :key="pat.id"
              class="p-4 flex items-center justify-between"
            >
              <div>
                <p class="font-semibold text-gray-900">{{ pat.firstName }} {{ pat.lastName }}</p>
                <p class="text-sm text-gray-500">{{ pat.email || 'Aucun email' }} · {{ pat.phone }}</p>
              </div>
              <div class="text-right text-xs text-gray-400">
                <p>Visites: {{ pat.visitCount }}</p>
                <p class="mt-0.5">Dernière visite: {{ formatDate(pat.lastVisit) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Booking Modal -->
    <div
      v-if="showBookingModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="showBookingModal = false"
    >
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900">Prendre rendez-vous</h2>
          <button
            @click="showBookingModal = false"
            class="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <form @submit.prevent="handleBookAppointment" class="space-y-4">
          <!-- Patient Search -->
          <div class="relative">
            <label class="mb-1 block text-sm font-medium text-gray-700">Patient</label>
            <div class="relative">
              <Search class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                v-model="bookingSearch"
                @input="debouncedPatientSearch"
                type="text"
                required
                placeholder="Entrez le nom ou email d'un patient..."
                class="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>

            <!-- Search Results Dropdown -->
            <div
              v-if="bookingSearchResults.length"
              class="absolute z-50 w-full mt-1 rounded-lg border border-gray-200 bg-white shadow-lg divide-y divide-gray-100 max-h-60 overflow-y-auto"
            >
              <button
                v-for="pat in bookingSearchResults"
                :key="pat.id"
                type="button"
                @click="selectPatientForBooking(pat)"
                class="w-full text-left p-3 hover:bg-orange-50 transition-colors flex justify-between items-center"
              >
                <div>
                  <span class="font-medium text-gray-900">{{ pat.firstName }} {{ pat.lastName }}</span>
                  <p class="text-xs text-gray-500">{{ pat.email }} · {{ pat.phone }}</p>
                </div>
                <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                  {{ pat.source === 'cabinet' ? 'Déjà venu' : 'Compte plateforme' }}
                </span>
              </button>
            </div>
          </div>

          <!-- Selected Patient Alert -->
          <div v-if="selectedPatient" class="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800 flex justify-between items-center">
            <div>
              <strong>Patient sélectionné :</strong>
              <p class="mt-0.5">{{ selectedPatient.firstName }} {{ selectedPatient.lastName }} ({{ selectedPatient.phone }})</p>
            </div>
            <button type="button" @click="selectedPatient = null" class="text-orange-600 hover:text-orange-800 font-semibold">
              Modifier
            </button>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">Date</label>
              <input
                v-model="bookingForm.date"
                type="date"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">Type</label>
              <select
                v-model="bookingForm.type"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none bg-white"
              >
                <option value="IN_PERSON">Présentiel</option>
                <option value="TELECONSULTATION">Téléconsultation</option>
              </select>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">Heure de début</label>
              <input
                v-model="bookingForm.startTime"
                type="time"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">Heure de fin</label>
              <input
                v-model="bookingForm.endTime"
                type="time"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Motif du rendez-vous</label>
            <textarea
              v-model="bookingForm.reason"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
              placeholder="Saisissez le motif..."
            ></textarea>
          </div>

          <div v-if="bookingError" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {{ bookingError }}
          </div>

          <div v-if="bookingSuccess" class="rounded-lg bg-green-50 p-3 text-sm text-green-600">
            Rendez-vous réservé avec succès !
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              @click="showBookingModal = false"
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="booking || !selectedPatient"
              class="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {{ booking ? "Réservation..." : "Confirmer la réservation" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  Clock,
  CalendarX,
  ShieldAlert,
  Users,
  Search,
  X
} from 'lucide-vue-next'
import { navigateTo } from '#imports'

definePageMeta({
  layout: 'cabinet',
  middleware: 'cabinet-admin-only',
})

const route = useRoute()
const practitionerId = route.params.id as string

const tabs = [
  { id: 'planning', name: 'Planning', icon: Clock },
  { id: 'appointments', name: 'Rendez-vous', icon: Calendar },
  { id: 'patients', name: 'Patients', icon: Users },
]

const activeTab = ref('planning')
const practitioner = ref<any>(null)
const schedule = ref<any>(null)
const appointments = ref<any[]>([])
const patients = ref<any[]>([])

const loadingApts = ref(false)
const loadingPatients = ref(false)

const filterDate = ref('')
const patientSearch = ref('')

// Booking modal state
const showBookingModal = ref(false)
const bookingSearch = ref('')
const bookingSearchResults = ref<any[]>([])
const selectedPatient = ref<any>(null)
const bookingError = ref('')
const bookingSuccess = ref(false)
const booking = ref(false)

const bookingForm = ref({
  date: '',
  startTime: '',
  endTime: '',
  type: 'IN_PERSON',
  reason: ''
})

const fetchPractitionerInfo = async () => {
  try {
    const res = await useAuthenticatedFetch<{ success: boolean; data: any[] }>('/cabinet/practitioners')
    if (res.success) {
      practitioner.value = res.data.find((p: any) => p.id === practitionerId)
    }
  } catch (err) {
    console.error('Error fetching practitioner info:', err)
  }
}

const fetchSchedule = async () => {
  try {
    const res = await useAuthenticatedFetch<{ success: boolean; data: any }>(`/cabinet/practitioners/${practitionerId}/schedule`)
    if (res.success) {
      schedule.value = res.data
    }
  } catch (err) {
    console.error('Error fetching practitioner schedule:', err)
  }
}

const fetchAppointments = async () => {
  loadingApts.value = true
  try {
    const url = filterDate.value
      ? `/cabinet/practitioners/${practitionerId}/appointments?date=${filterDate.value}`
      : `/cabinet/practitioners/${practitionerId}/appointments`
    const res = await useAuthenticatedFetch<{ success: boolean; data: any[] }>(url)
    if (res.success) {
      appointments.value = res.data
    }
  } catch (err) {
    console.error('Error fetching practitioner appointments:', err)
  } finally {
    loadingApts.value = false
  }
}

const fetchPatients = async () => {
  loadingPatients.value = true
  try {
    const url = patientSearch.value
      ? `/cabinet/practitioners/${practitionerId}/patients?search=${encodeURIComponent(patientSearch.value)}`
      : `/cabinet/practitioners/${practitionerId}/patients`
    const res = await useAuthenticatedFetch<{ success: boolean; data: any[] }>(url)
    if (res.success) {
      patients.value = res.data
    }
  } catch (err) {
    console.error('Error fetching practitioner patients:', err)
  } finally {
    loadingPatients.value = false
  }
}

// Watch filters
watch(filterDate, () => {
  fetchAppointments()
})

let searchTimeout: any = null
watch(patientSearch, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchPatients()
  }, 300)
})

// Patient search in booking modal
const debouncedPatientSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (bookingSearch.value.length < 2) {
    bookingSearchResults.value = []
    return
  }
  searchTimeout = setTimeout(async () => {
    try {
      const res = await useAuthenticatedFetch<{ success: boolean; data: any[] }>(
        `/cabinet/practitioners/${practitionerId}/patients/search?q=${encodeURIComponent(bookingSearch.value)}`
      )
      if (res.success) {
        bookingSearchResults.value = res.data
      }
    } catch (err) {
      console.error('Error searching patients:', err)
    }
  }, 300)
}

const selectPatientForBooking = (pat: any) => {
  selectedPatient.value = pat
  bookingSearch.value = `${pat.firstName} ${pat.lastName}`
  bookingSearchResults.value = []
}

const handleBookAppointment = async () => {
  if (!selectedPatient.value) return
  booking.value = true
  bookingError.value = ''
  bookingSuccess.value = false

  try {
    const res = await useAuthenticatedFetch<{ success: boolean }>(
      `/cabinet/practitioners/${practitionerId}/appointments`,
      {
        method: 'POST',
        body: {
          patientId: selectedPatient.value.id,
          appointmentDate: bookingForm.value.date,
          startTime: bookingForm.value.startTime,
          endTime: bookingForm.value.endTime,
          type: bookingForm.value.type,
          reason: bookingForm.value.reason
        }
      }
    )

    if (res.success) {
      bookingSuccess.value = true
      fetchAppointments()
      setTimeout(() => {
        showBookingModal.value = false
        bookingSuccess.value = false
        selectedPatient.value = null
        bookingSearch.value = ''
        bookingForm.value = {
          date: '',
          startTime: '',
          endTime: '',
          type: 'IN_PERSON',
          reason: ''
        }
      }, 1500)
    }
  } catch (err: any) {
    bookingError.value = err?.data?.message || 'Erreur lors de la réservation'
  } finally {
    booking.value = false
  }
}

// Helpers
const translateDay = (day: string) => {
  const days: Record<string, string> = {
    MONDAY: 'Lundi',
    TUESDAY: 'Mardi',
    WEDNESDAY: 'Mercredi',
    THURSDAY: 'Jeudi',
    FRIDAY: 'Vendredi',
    SATURDAY: 'Samedi',
    SUNDAY: 'Dimanche',
  }
  return days[day] || day
}

const formatDate = (dateStr: string | Date) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatDateRange = (start: string | Date, end: string | Date) => {
  const s = new Date(start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const e = new Date(end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  return `Du ${s} au ${e}`
}

onMounted(() => {
  fetchPractitionerInfo()
  fetchSchedule()
  fetchAppointments()
  fetchPatients()
})
</script>
