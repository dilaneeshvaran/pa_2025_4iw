<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="mb-1 text-2xl font-bold text-gray-900">Agenda</h1>
        <p class="text-gray-600">Gérez vos rendez-vous et disponibilités</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <!-- Cabinet Selector styled beautifully -->
        <div class="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
          <span class="pl-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Planning :</span>
          <div class="relative">
            <select
              id="cabinet-select"
              v-model="selectedCabinetId"
              @change="handleCabinetChange"
              class="appearance-none rounded-lg bg-orange-50/50 hover:bg-orange-50 px-3.5 pr-8 py-1.5 text-sm font-semibold text-orange-700 transition-colors focus:outline-none cursor-pointer"
            >
              <option :value="null">À titre personnel (Privé)</option>
              <option
                v-for="item in cabinets"
                :key="item.cabinet.id"
                :value="item.cabinet.id"
              >
                {{ item.cabinet.name }}
              </option>
            </select>
            <ChevronDown class="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-600" />
          </div>
        </div>

        <UiButton size="sm" @click="openNewAppointmentModal">
          <Plus class="mr-1.5 h-4 w-4" />
          Ajouter un rdv
        </UiButton>
        <UiButton variant="outline" size="sm" @click="openBlockSlotModal">
          <Ban class="mr-1.5 h-4 w-4" />
          Bloquer un créneau
        </UiButton>
      </div>
    </div>

    <div class="flex gap-1 rounded-lg border bg-gray-50 p-1">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
          activeTab === tab.id
            ? 'bg-white text-orange-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
        ]"
      >
        <component :is="tab.icon" class="mr-1.5 inline h-4 w-4" />
        {{ tab.label }}
      </button>
    </div>

    <!--calendar -->
    <template v-if="activeTab === 'calendar'">
      <!-- view switch -->
      <UiCard>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex gap-1 rounded-lg border p-0.5">
            <button
              v-for="v in viewOptions"
              :key="v.value"
              @click="calendarView = v.value"
              :class="[
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                calendarView === v.value
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100',
              ]"
            >
              {{ v.label }}
            </button>
          </div>

          <!-- date navigation -->
          <div class="flex items-center gap-3">
            <button
              @click="navigateDate(-1)"
              class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            >
              <ChevronLeft class="h-5 w-5" />
            </button>
            <h3
              class="min-w-[200px] text-center text-lg font-semibold text-gray-900"
            >
              {{ periodLabel }}
            </h3>
            <button
              @click="navigateDate(1)"
              class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            >
              <ChevronRight class="h-5 w-5" />
            </button>
            <button
              @click="goToToday"
              class="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Aujourd'hui
            </button>
          </div>

          <!-- day summary -->
          <div class="flex items-center gap-4 text-sm">
            <div
              class="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1"
            >
              <Calendar class="h-3.5 w-3.5 text-orange-600" />
              <span class="font-medium text-orange-700">
                {{ daySummary.total }} rdv
              </span>
            </div>
            <div
              class="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1"
            >
              <Building2 class="h-3.5 w-3.5 text-gray-600" />
              <span class="text-gray-600">{{ daySummary.cabinet }}</span>
            </div>
            <div
              class="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1"
            >
              <Video class="h-3.5 w-3.5 text-green-600" />
              <span class="text-green-600">{{
                daySummary.teleconsultation
              }}</span>
            </div>
          </div>
        </div>
      </UiCard>

      <!-- calendar content -->
      <div v-if="loadingAppointments" class="space-y-3">
        <div
          v-for="i in 5"
          :key="i"
          class="h-16 animate-pulse rounded-lg bg-gray-100"
        ></div>
      </div>

      <!-- day -->
      <template v-else-if="calendarView === 'day'">
        <UiCard v-if="filteredAppointments.length === 0">
          <div class="py-10 text-center">
            <CalendarX2 class="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p class="text-gray-500">Aucun rendez-vous pour cette journée</p>
          </div>
        </UiCard>
        <div v-else class="space-y-2">
          <div
            v-for="apt in filteredAppointments"
            :key="apt.id"
            :class="[
              'flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50',
              apt.status === 'COMPLETED'
                ? 'border-green-200 bg-green-50/50'
                : apt.status === 'NO_SHOW'
                  ? 'border-red-200 bg-red-50/50'
                  : 'border-gray-200',
            ]"
          >
            <div class="text-center">
              <p class="text-lg font-bold text-orange-600">{{ apt.startTime }}</p>
              <p class="text-xs text-gray-400">{{ apt.endTime }}</p>
            </div>
            <div class="h-10 w-px bg-gray-200"></div>
            <div class="min-w-0 flex-1">
              <p class="font-medium text-gray-900">
                {{ apt.patient.firstName }} {{ apt.patient.lastName }}
              </p>
              <p v-if="apt.reason" class="text-sm text-gray-500">
                {{ apt.reason }}
              </p>
            </div>
            <UiBadge
              :variant="apt.type === 'TELECONSULTATION' ? 'success' : 'default'"
            >
              {{ apt.type === "TELECONSULTATION" ? "Télé" : "Cabinet" }}
            </UiBadge>
            <UiBadge :variant="getStatusVariant(apt.status)">
              {{ getStatusLabel(apt.status) }}
            </UiBadge>
            <UiButton
              v-if="apt.status === 'COMPLETED' && apt.type === 'CABINET'"
              size="sm"
              variant="outline"
              class="ml-2 h-7 px-2 py-0 text-xs"
              @click.stop="openInvoiceModal(apt)"
            >
              Facturer
            </UiButton>
            <!-- before appointment time: modifier / annuler -->
            <template v-if="isBeforeAppointmentTime(apt)">
              <UiButton
                size="sm"
                variant="outline"
                class="ml-1 h-7 px-2 py-0 text-xs"
                @click.stop="openAgendaModifyModal(apt)"
              >
                Modifier
              </UiButton>
              <UiButton
                size="sm"
                variant="danger"
                class="ml-1 h-7 px-2 py-0 text-xs"
                @click.stop="openAgendaCancelModal(apt)"
              >
                Annuler
              </UiButton>
            </template>
            <!-- at or after appointment time: presenté / no show (cabinet) -->
            <template
              v-if="
                isAtOrAfterAppointmentTime(apt) &&
                apt.type !== 'TELECONSULTATION' &&
                apt.status !== 'COMPLETED' &&
                apt.status !== 'NO_SHOW' &&
                apt.status !== 'CANCELLED'
              "
            >
              <UiButton
                size="sm"
                class="ml-1 h-7 bg-green-600 px-2 py-0 text-xs hover:bg-green-700"
                @click.stop="agendaMarkAttended(apt)"
              >
                Présentée
              </UiButton>
              <UiButton
                size="sm"
                variant="danger"
                class="ml-1 h-7 px-2 py-0 text-xs"
                @click.stop="agendaMarkNoShow(apt)"
              >
                No Show
              </UiButton>
            </template>
            <span
              v-if="
                isAtOrAfterAppointmentTime(apt) &&
                apt.type === 'TELECONSULTATION' &&
                apt.status !== 'COMPLETED' &&
                apt.status !== 'NO_SHOW' &&
                apt.status !== 'CANCELLED'
              "
              class="ml-1 text-xs italic text-gray-400"
            >
              Absence détectée automatiquement
            </span>
          </div>
        </div>
      </template>

      <!-- week -->
      <template v-else-if="calendarView === 'week'">
        <div class="grid grid-cols-7 gap-2">
          <div v-for="day in weekDays" :key="day.dateStr" class="min-h-[200px]">
            <div
              :class="[
                'mb-2 rounded-t-lg px-2 py-1.5 text-center text-xs font-semibold',
                day.isToday
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700',
              ]"
            >
              <div>{{ day.dayName }}</div>
              <div class="text-lg">{{ day.dayNum }}</div>
            </div>
            <div class="space-y-1">
              <div
                v-for="apt in getAppointmentsForDate(day.dateStr)"
                :key="apt.id"
                :class="[
                  'cursor-pointer rounded px-2 py-1 text-xs transition-opacity hover:opacity-80',
                  apt.type === 'TELECONSULTATION'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-700',
                ]"
                :title="`${apt.patient.firstName} ${apt.patient.lastName} – ${apt.reason || ''}`"
                @click="openAppointmentDetailsModal(apt)"
              >
                <span class="font-medium">{{ apt.startTime }}</span>
                {{ apt.patient.lastName }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- month -->
      <template v-else-if="calendarView === 'month'">
        <div
          class="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-gray-200"
        >
          <div
            v-for="dayName in ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']"
            :key="dayName"
            class="bg-gray-50 px-2 py-2 text-center text-xs font-semibold text-gray-600"
          >
            {{ dayName }}
          </div>
          <div
            v-for="(day, i) in monthDays"
            :key="i"
            :class="[
              'min-h-[90px] bg-white p-1.5',
              !day.inMonth && 'bg-gray-50/70',
            ]"
          >
            <p
              :class="[
                'mb-1 text-xs font-medium',
                day.isToday
                  ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white'
                  : day.inMonth
                    ? 'text-gray-900'
                    : 'text-gray-300',
              ]"
            >
              {{ day.num }}
            </p>
            <div class="space-y-0.5">
              <div
                v-for="apt in getAppointmentsForDate(day.dateStr).slice(0, 3)"
                :key="apt.id"
                :class="[
                  'cursor-pointer truncate rounded px-1 py-0.5 text-[10px] transition-opacity hover:opacity-80',
                  apt.type === 'TELECONSULTATION'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700',
                ]"
                @click="openAppointmentDetailsModal(apt)"
              >
                {{ apt.startTime }} {{ apt.patient.lastName }}
              </div>
              <p
                v-if="getAppointmentsForDate(day.dateStr).length > 3"
                class="text-[10px] text-gray-400"
              >
                +{{ getAppointmentsForDate(day.dateStr).length - 3 }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- absences-->
    <template v-if="activeTab === 'absences'">
      <UiCard>
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">
            Gérer mes absences
          </h3>
        </div>

        <!-- absence form -->
        <form
          @submit.prevent="addAbsence"
          class="mb-6 grid gap-3 rounded-lg border bg-gray-50 p-4 sm:grid-cols-4"
        >
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-700"
              >Date début</label
            >
            <input
              v-model="newAbsence.startDate"
              type="date"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-700"
              >Date fin</label
            >
            <input
              v-model="newAbsence.endDate"
              type="date"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-700"
              >Motif (optionnel)</label
            >
            <input
              v-model="newAbsence.reason"
              type="text"
              placeholder="Ex: Congés, Formation..."
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div class="flex items-end">
            <UiButton
              type="submit"
              size="sm"
              :disabled="savingAbsence"
              class="w-full"
            >
              <Plus class="mr-1 h-4 w-4" />
              Ajouter
            </UiButton>
          </div>
        </form>

        <!-- asbsences list -->
        <div v-if="loadingAbsences" class="space-y-2">
          <div
            v-for="i in 3"
            :key="i"
            class="h-14 animate-pulse rounded bg-gray-100"
          ></div>
        </div>
        <div v-else-if="absences.length === 0" class="py-8 text-center">
          <CalendarX2 class="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p class="text-gray-500">Aucune absence planifiée</p>
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="absence in absences"
            :key="absence.id"
            class="flex items-center gap-4 rounded-lg border border-gray-200 p-4"
          >
            <div class="flex-1">
              <p class="font-medium text-gray-900">
                {{ formatShortDate(absence.startDate) }} →
                {{ formatShortDate(absence.endDate) }}
              </p>
              <p v-if="absence.reason" class="text-sm text-gray-500">
                {{ absence.reason }}
              </p>
            </div>
            <UiBadge v-if="absence.notifiedPatients" variant="success"
              >Patients notifiés</UiBadge
            >
            <button
              v-if="!absence.notifiedPatients"
              @click="notifyPatients(absence.id)"
              :disabled="notifyingId === absence.id"
              class="flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100"
            >
              <Mail class="h-3.5 w-3.5" />
              {{
                notifyingId === absence.id
                  ? "Envoi..."
                  : "Notifier tous les patients"
              }}
            </button>
            <button
              @click="removeAbsence(absence.id)"
              class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </UiCard>

      <!-- blocked slots -->
      <UiCard>
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Créneaux bloqués</h3>
          <p class="text-sm text-gray-500">
            Bloquages ponctuels de courte durée
          </p>
        </div>

        <div
          v-if="blockedSlots.length === 0 && !loadingBlockedSlots"
          class="py-6 text-center"
        >
          <Ban class="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p class="text-sm text-gray-500">Aucun créneau bloqué</p>
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="slot in blockedSlots"
            :key="slot.id"
            class="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3"
          >
            <Ban class="h-4 w-4 flex-shrink-0 text-orange-600" />
            <div class="flex-1">
              <span class="text-sm font-medium text-gray-900">
                {{ formatShortDate(slot.date) }}
              </span>
              <span class="text-sm text-gray-500">
                {{ slot.startTime }} – {{ slot.endTime }}
              </span>
              <span v-if="slot.reason" class="ml-2 text-sm text-gray-400">
                ({{ slot.reason }})
              </span>
            </div>
            <button
              @click="removeBlockedSlot(slot.id)"
              class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </UiCard>
    </template>

    <!--settings -->
    <template v-if="activeTab === 'settings'">
      <UiCard>
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            Horaires de travail
          </h3>
          <p class="text-sm text-gray-500">
            Définissez vos heures de travail pour chaque jour
          </p>
        </div>

        <div v-if="loadingAvailabilities" class="space-y-2">
          <div
            v-for="i in 7"
            :key="i"
            class="h-12 animate-pulse rounded bg-gray-100"
          ></div>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="day in daysOfWeek"
            :key="day.value"
            class="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 px-4 py-3"
          >
            <div class="w-24">
              <span class="text-sm font-medium text-gray-900">{{
                day.label
              }}</span>
            </div>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                :checked="isDayActive(day.value)"
                @change="toggleDayActive(day.value, $event)"
                class="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span class="text-xs text-gray-500">Actif</span>
            </label>
            <template v-if="isDayActive(day.value)">
              <select
                :value="getDaySchedule(day.value)?.startTime || '09:00'"
                @change="
                  updateDayTime(
                    day.value,
                    'startTime',
                    ($event.target as HTMLSelectElement).value,
                  )
                "
                class="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option
                  v-for="slot in getStartTimeOptions(day.value)"
                  :key="slot"
                  :value="slot"
                >
                  {{ slot }}
                </option>
              </select>
              <span class="text-gray-400">–</span>
              <select
                :value="getDaySchedule(day.value)?.endTime || '17:00'"
                @change="
                  updateDayTime(
                    day.value,
                    'endTime',
                    ($event.target as HTMLSelectElement).value,
                  )
                "
                class="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option
                  v-for="slot in getEndTimeOptions(day.value)"
                  :key="slot"
                  :value="slot"
                >
                  {{ slot }}
                </option>
              </select>
            </template>
            <span v-else class="text-sm text-gray-400">Repos</span>
          </div>
        </div>
      </UiCard>

      <UiCard>
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            Paramètres des consultations
          </h3>
        </div>

        <div v-if="loadingSettings" class="space-y-3">
          <div
            v-for="i in 4"
            :key="i"
            class="h-10 animate-pulse rounded bg-gray-100"
          ></div>
        </div>
        <div v-else class="space-y-5">
          <!-- Slot duration -->
          <div class="grid items-center gap-2 sm:grid-cols-3">
            <label class="text-sm font-medium text-gray-700"
              >Durée des créneaux</label
            >
            <div class="flex items-center gap-2 sm:col-span-2">
              <input
                v-model.number="settingsForm.consultationDuration"
                type="number"
                min="5"
                max="120"
                step="5"
                class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <span class="text-sm text-gray-500">minutes</span>
            </div>
          </div>

          <div class="grid items-center gap-2 sm:grid-cols-3">
            <label class="text-sm font-medium text-gray-700"
              >Rendez-vous dos-à-dos</label
            >
            <div class="sm:col-span-2">
              <label class="flex items-center gap-2">
                <input
                  v-model="settingsForm.backToBack"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span class="text-sm text-gray-600"
                  >Sans pause entre les consultations</span
                >
              </label>
              <div
                v-if="!settingsForm.backToBack"
                class="mt-2 flex items-center gap-2"
              >
                <label class="text-sm text-gray-500"
                  >Pause entre rendez-vous :</label
                >
                <input
                  v-model.number="settingsForm.breakBetweenSlots"
                  type="number"
                  min="0"
                  max="60"
                  step="5"
                  class="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                />
                <span class="text-sm text-gray-500">min</span>
              </div>
            </div>
          </div>

          <div class="grid gap-2 sm:grid-cols-3">
            <label class="text-sm font-medium text-gray-700"
              >Types de consultation proposés</label
            >
            <div class="space-y-2 sm:col-span-2">
              <label
                class="flex items-center gap-3 rounded-lg border px-4 py-3"
              >
                <Building2 class="h-5 w-5 text-gray-500" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">Cabinet</p>
                  <p class="text-xs text-gray-500">
                    Consultations en présentiel
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  class="h-4 w-4 rounded border-gray-300 text-orange-600"
                />
              </label>
              <label
                class="flex items-center gap-3 rounded-lg border px-4 py-3"
              >
                <Video class="h-5 w-5 text-green-500" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">
                    Téléconsultation
                  </p>
                  <p class="text-xs text-gray-500">Consultations en vidéo</p>
                </div>
                <input
                  v-model="settingsForm.teleconsultationEnabled"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              </label>
              <label
                class="flex items-center gap-3 rounded-lg border px-4 py-3"
              >
                <Home class="h-5 w-5 text-purple-500" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">
                    Visites à domicile
                  </p>
                  <p class="text-xs text-gray-500">
                    Consultations au domicile du patient
                  </p>
                </div>
                <input
                  v-model="settingsForm.homeVisitEnabled"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              </label>
              <label
                class="flex items-center gap-3 rounded-lg border px-4 py-3"
              >
                <Siren class="h-5 w-5 text-red-500" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">
                    Créneaux urgences
                  </p>
                  <p class="text-xs text-gray-500">
                    Réserver des créneaux pour les urgences
                  </p>
                </div>
                <input
                  v-model="settingsForm.emergencySlotsEnabled"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              </label>
            </div>
          </div>

          <div class="border-t pt-5">
            <h4 class="mb-4 text-sm font-semibold text-gray-800">
              Règles de réservation
            </h4>
            <div class="space-y-4">
              <div class="grid items-center gap-2 sm:grid-cols-3">
                <label class="text-sm text-gray-700"
                  >Délai minimum de réservation</label
                >
                <div class="flex items-center gap-2 sm:col-span-2">
                  <input
                    v-model.number="settingsForm.minBookingNotice"
                    type="number"
                    min="0"
                    class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <span class="text-sm text-gray-500"
                    >minutes avant le RDV</span
                  >
                </div>
              </div>
              <div class="grid items-center gap-2 sm:grid-cols-3">
                <label class="text-sm text-gray-700"
                  >Délai maximum de réservation</label
                >
                <div class="flex items-center gap-2 sm:col-span-2">
                  <input
                    v-model.number="settingsForm.maxBookingAdvance"
                    type="number"
                    min="1"
                    max="365"
                    class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <span class="text-sm text-gray-500">jours à l'avance</span>
                </div>
              </div>
              <div class="grid items-center gap-2 sm:grid-cols-3">
                <label class="text-sm text-gray-700"
                  >Annulation possible jusqu'à</label
                >
                <div class="flex items-center gap-2 sm:col-span-2">
                  <input
                    v-model.number="settingsForm.cancellationNotice"
                    type="number"
                    min="0"
                    class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <span class="text-sm text-gray-500">heures avant le RDV</span>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t pt-5">
            <h4 class="mb-4 text-sm font-semibold text-gray-800">
              Nouveaux patients
            </h4>
            <div class="space-y-3">
              <label class="flex items-center gap-2">
                <input
                  v-model="settingsForm.acceptsNewPatients"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span class="text-sm text-gray-700"
                  >Autoriser les nouveaux patients</span
                >
              </label>
              <div
                v-if="settingsForm.acceptsNewPatients"
                class="grid items-center gap-2 sm:grid-cols-3"
              >
                <label class="text-sm text-gray-700"
                  >Limite de nouveaux patients par jour</label
                >
                <div class="flex items-center gap-2 sm:col-span-2">
                  <input
                    v-model.number="settingsForm.newPatientMaxPerDay"
                    type="number"
                    min="0"
                    class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <span class="text-sm text-gray-500">0 = illimité</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Noshow configuration -->
          <div class="space-y-4">
            <h4 class="font-medium text-gray-900">
              Gestion des absences (No Show)
            </h4>
            <div class="grid items-center gap-2 sm:grid-cols-3">
              <label class="text-sm text-gray-700"
                >Seuil de no-show (avant blocage)</label
              >
              <div class="flex items-center gap-2 sm:col-span-2">
                <input
                  v-model.number="settingsForm.noShowThreshold"
                  type="number"
                  min="1"
                  max="20"
                  class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <span class="text-sm text-gray-500">absences</span>
              </div>
            </div>
            <div class="grid items-center gap-2 sm:grid-cols-3">
              <label class="text-sm text-gray-700">Durée du blocage</label>
              <div class="flex items-center gap-2 sm:col-span-2">
                <input
                  v-model.number="settingsForm.noShowPenaltyDays"
                  type="number"
                  min="1"
                  max="365"
                  class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <span class="text-sm text-gray-500">jours</span>
              </div>
            </div>
            <label class="flex items-center gap-2">
              <input
                v-model="settingsForm.noShowAutoBlock"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span class="text-sm text-gray-700"
                >Bloquer automatiquement les patients après le seuil de
                no-show</span
              >
            </label>
          </div>

          <div class="border-t pt-4">
            <UiButton @click="saveSettings" :disabled="savingSettings">
              {{
                savingSettings
                  ? "Enregistrement..."
                  : "Enregistrer les paramètres"
              }}
            </UiButton>
          </div>
        </div>
      </UiCard>
    </template>

    <!-- modals -->
    <Teleport to="body">
      <div
        v-if="showNewAppointmentModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showNewAppointmentModal = false"
      >
        <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Ajouter un rendez-vous
            </h3>
            <button
              @click="showNewAppointmentModal = false"
              class="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <form @submit.prevent="createAppointment" class="space-y-4">
            <!-- patient search -->
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Patient</label
              >
              <div class="relative">
                <input
                  v-model="patientSearch"
                  @input="searchPatients"
                  type="text"
                  placeholder="Rechercher un patient..."
                  class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <div
                  v-if="patientResults.length > 0 && patientSearch.length >= 2"
                  class="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border bg-white shadow-lg"
                >
                  <button
                    v-for="p in patientResults"
                    :key="p.id"
                    type="button"
                    @click="selectPatient(p)"
                    class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <User class="h-4 w-4 text-gray-400" />
                    {{ p.firstName }} {{ p.lastName }}
                    <span class="text-xs text-gray-400">{{ p.phone }}</span>
                  </button>
                </div>
              </div>
              <p v-if="selectedPatient" class="mt-1 text-sm text-green-600">
                Sélectionné : {{ selectedPatient.firstName }}
                {{ selectedPatient.lastName }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Date</label
                >
                <input
                  v-model="newAppointment.appointmentDate"
                  type="date"
                  required
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Heure</label
                >
                <input
                  v-model="newAppointment.startTime"
                  type="time"
                  required
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Type</label
              >
              <select
                v-model="newAppointment.type"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="IN_PERSON">Cabinet</option>
                <option value="TELECONSULTATION">Téléconsultation</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Motif (optionnel)</label
              >
              <input
                v-model="newAppointment.reason"
                type="text"
                placeholder="Motif de la consultation..."
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <p v-if="appointmentError" class="text-sm text-red-600">
              {{ appointmentError }}
            </p>

            <div class="flex justify-end gap-2">
              <UiButton
                variant="secondary"
                @click="showNewAppointmentModal = false"
              >
                Annuler
              </UiButton>
              <UiButton
                type="submit"
                :disabled="creatingAppointment || !selectedPatient"
              >
                {{
                  creatingAppointment ? "Création..." : "Créer le rendez-vous"
                }}
              </UiButton>
            </div>
          </form>
        </div>
      </div>

      <div
        v-if="showBlockSlotModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showBlockSlotModal = false"
      >
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Bloquer un créneau
            </h3>
            <button
              @click="showBlockSlotModal = false"
              class="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <form @submit.prevent="blockSlot" class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Date</label
              >
              <input
                v-model="newBlockedSlot.date"
                type="date"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >De</label
                >
                <input
                  v-model="newBlockedSlot.startTime"
                  type="time"
                  required
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >À</label
                >
                <input
                  v-model="newBlockedSlot.endTime"
                  type="time"
                  required
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Motif (optionnel)</label
              >
              <input
                v-model="newBlockedSlot.reason"
                type="text"
                placeholder="Ex: Réunion, Formation..."
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div class="flex justify-end gap-2">
              <UiButton variant="secondary" @click="showBlockSlotModal = false">
                Annuler
              </UiButton>
              <UiButton type="submit" :disabled="blockingSlot">
                {{ blockingSlot ? "Blocage..." : "Bloquer" }}
              </UiButton>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- delete absence confirmation modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteAbsenceConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showDeleteAbsenceConfirm = false"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"
            >
              <Trash2 class="h-5 w-5 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              Supprimer l'absence
            </h3>
          </div>
          <p class="mb-2 text-sm text-gray-600">
            Êtes-vous sûr de vouloir supprimer cette absence ?
          </p>
          <div
            v-if="absenceToDeleteInfo"
            class="mb-4 rounded-lg bg-gray-50 p-3"
          >
            <p class="text-sm font-medium text-gray-900">
              {{ formatShortDate(absenceToDeleteInfo.startDate) }} →
              {{ formatShortDate(absenceToDeleteInfo.endDate) }}
            </p>
            <p
              v-if="absenceToDeleteInfo.reason"
              class="mt-1 text-sm text-gray-500"
            >
              {{ absenceToDeleteInfo.reason }}
            </p>
          </div>
          <p class="mb-4 text-xs text-gray-500">
            Cette action est irréversible. Les rendez-vous déjà annulés ne
            seront pas restaurés.
          </p>
          <div class="flex justify-end gap-2">
            <UiButton
              variant="secondary"
              size="sm"
              @click="showDeleteAbsenceConfirm = false"
            >
              Annuler
            </UiButton>
            <UiButton variant="danger" size="sm" @click="confirmDeleteAbsence">
              Supprimer
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- toast notifications -->
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'rounded-lg px-4 py-3 shadow-lg transition-all duration-300',
          toast.type === 'success' ? 'bg-green-600 text-white' : '',
          toast.type === 'error' ? 'bg-red-600 text-white' : '',
          toast.type === 'info' ? 'bg-orange-500 text-white' : '',
        ]"
      >
        <div class="flex items-start gap-2">
          <div class="flex-1">
            <p class="text-sm font-medium">{{ toast.message }}</p>
          </div>
          <button
            @click="removeToast(toast.id)"
            class="text-white/80 hover:text-white"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    <!-- invoice modal -->
    <CreateInvoiceModal
      :is-open="isInvoiceModalOpen"
      :appointment="selectedAppointmentForInvoice"
      @close="isInvoiceModalOpen = false"
      @success="handleInvoiceSuccess"
    />

    <!-- cancel modal -->
    <Teleport to="body">
      <div
        v-if="showAgendaCancelModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showAgendaCancelModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"
            >
              <Ban class="h-5 w-5 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              Annuler le rendez-vous
            </h3>
          </div>
          <p class="mb-4 text-sm text-gray-600">
            Êtes-vous sûr de vouloir annuler le rendez-vous de
            <strong
              >{{ agendaSelectedAppointment?.patient.firstName }}
              {{ agendaSelectedAppointment?.patient.lastName }}</strong
            >
            à <strong>{{ agendaSelectedAppointment?.startTime }}</strong> ?
          </p>
          <p class="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
            Un email sera envoyé au patient pour l'informer de l'annulation.
          </p>
          <div class="mb-4">
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >Raison (optionnel)</label
            >
            <textarea
              v-model="agendaCancelReason"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              rows="3"
              placeholder="Raison de l'annulation..."
            />
          </div>
          <div class="flex justify-end gap-3">
            <UiButton variant="secondary" @click="showAgendaCancelModal = false"
              >Retour</UiButton
            >
            <UiButton
              variant="danger"
              :disabled="agendaCancelLoading"
              @click="confirmAgendaCancel"
            >
              {{
                agendaCancelLoading ? "Annulation..." : "Confirmer l'annulation"
              }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- modify modal -->
    <Teleport to="body">
      <div
        v-if="showAgendaModifyModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showAgendaModifyModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100"
            >
              <CalendarDays class="h-5 w-5 text-orange-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              Modifier le rendez-vous
            </h3>
          </div>
          <div
            class="mb-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3"
          >
            <Ban class="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
            <p class="text-sm text-yellow-700">
              Pensez à prévenir le patient avant la modification du rendez-vous.
              Un email sera envoyé automatiquement avec les nouvelles
              informations.
            </p>
          </div>
          <p class="mb-4 text-sm text-gray-600">
            Modifier le rendez-vous de
            <strong
              >{{ agendaSelectedAppointment?.patient.firstName }}
              {{ agendaSelectedAppointment?.patient.lastName }}</strong
            >
          </p>
          <div class="mb-4 space-y-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Nouvelle date</label
              >
              <input
                v-model="agendaModifyDate"
                type="date"
                :class="[
                  'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1',
                  modifyDateError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500',
                ]"
              />
              <p v-if="modifyDateError" class="mt-1 text-xs text-red-600">
                {{ modifyDateError }}
              </p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Nouvelle heure</label
              >
              <input
                v-model="agendaModifyTime"
                type="time"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
          <div class="flex justify-end gap-3">
            <UiButton variant="secondary" @click="showAgendaModifyModal = false"
              >Retour</UiButton
            >
            <UiButton
              :disabled="
                agendaModifyLoading ||
                !agendaModifyDate ||
                !agendaModifyTime ||
                !!modifyDateError
              "
              @click="confirmAgendaModify"
            >
              {{
                agendaModifyLoading
                  ? "Modification..."
                  : "Confirmer la modification"
              }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- attended confirmation modal -->
    <Teleport to="body">
      <div
        v-if="showAgendaAttendedModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showAgendaAttendedModal = false"
      >
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100"
            >
              <CheckCircle2 class="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900">
                Confirmer la présence
              </h2>
              <p v-if="agendaAttendedApt" class="text-sm text-gray-500">
                {{ agendaAttendedApt.patient.firstName }}
                {{ agendaAttendedApt.patient.lastName }}
              </p>
            </div>
          </div>
          <div class="mb-5 rounded-lg bg-orange-50 p-4 text-sm text-orange-700">
            <p class="mb-1 font-medium">Veuillez confirmer :</p>
            <ul class="list-inside list-disc space-y-1 text-orange-700">
              <li>Le patient s'est bien présenté</li>
              <li v-if="agendaAttendedApt?.type === 'IN_PERSON'">
                Le paiement a été effectué à la réception
              </li>
            </ul>
          </div>
          <div class="flex justify-end gap-3">
            <UiButton
              variant="secondary"
              @click="showAgendaAttendedModal = false"
              >Annuler</UiButton
            >
            <UiButton
              class="bg-green-600 hover:bg-green-700"
              :disabled="agendaAttendedLoading"
              @click="confirmAgendaAttended"
            >
              {{
                agendaAttendedLoading
                  ? "Enregistrement..."
                  : "Confirmer la présence"
              }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- noshow confirmation modal -->
    <Teleport to="body">
      <div
        v-if="showAgendaNoShowModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showAgendaNoShowModal = false"
      >
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"
            >
              <AlertTriangle class="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900">
                Confirmer l'absence
              </h2>
              <p v-if="agendaNoShowApt" class="text-sm text-gray-500">
                {{ agendaNoShowApt.patient.firstName }}
                {{ agendaNoShowApt.patient.lastName }}
              </p>
            </div>
          </div>
          <p class="mb-5 text-sm text-gray-600">
            Le patient sera marqué comme
            <strong class="text-red-600">absent (No Show)</strong>. Un email de
            notification lui sera automatiquement envoyé. Les absences répétées
            peuvent entraîner des restrictions de réservation.
          </p>
          <div class="flex justify-end gap-3">
            <UiButton variant="secondary" @click="showAgendaNoShowModal = false"
              >Annuler</UiButton
            >
            <UiButton
              variant="danger"
              :disabled="agendaNoShowLoading"
              @click="confirmAgendaNoShow"
            >
              {{
                agendaNoShowLoading
                  ? "Enregistrement..."
                  : "Confirmer l'absence"
              }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- appointment details modal (for week/month view) -->
    <Teleport to="body">
      <div
        v-if="showAppointmentDetailsModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showAppointmentDetailsModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Détails du rendez-vous
            </h3>
            <button
              @click="showAppointmentDetailsModal = false"
              class="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <template v-if="appointmentDetailsSelected">
            <div class="mb-4 space-y-3 rounded-lg bg-gray-50 p-4">
              <div class="flex items-center gap-3">
                <User class="h-5 w-5 text-gray-400" />
                <div>
                  <p class="font-medium text-gray-900">
                    {{ appointmentDetailsSelected.patient.firstName }}
                    {{ appointmentDetailsSelected.patient.lastName }}
                  </p>
                  <p
                    v-if="appointmentDetailsSelected.patient.phone"
                    class="text-sm text-gray-500"
                  >
                    {{ appointmentDetailsSelected.patient.phone }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <CalendarDays class="h-5 w-5 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-900">
                    {{
                      new Date(
                        appointmentDetailsSelected.appointmentDate,
                      ).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ appointmentDetailsSelected.startTime }} –
                    {{ appointmentDetailsSelected.endTime }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <component
                  :is="
                    appointmentDetailsSelected.type === 'TELECONSULTATION'
                      ? Video
                      : Building2
                  "
                  :class="[
                    'h-5 w-5',
                    appointmentDetailsSelected.type === 'TELECONSULTATION'
                      ? 'text-green-500'
                      : 'text-orange-500',
                  ]"
                />
                <p class="text-sm text-gray-900">
                  {{
                    appointmentDetailsSelected.type === "TELECONSULTATION"
                      ? "Téléconsultation"
                      : "Cabinet"
                  }}
                </p>
              </div>
              <div v-if="appointmentDetailsSelected.reason" class="pt-2">
                <p class="text-xs font-medium uppercase text-gray-500">Motif</p>
                <p class="text-sm text-gray-700">
                  {{ appointmentDetailsSelected.reason }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <UiBadge
                  :variant="getStatusVariant(appointmentDetailsSelected.status)"
                >
                  {{ getStatusLabel(appointmentDetailsSelected.status) }}
                </UiBadge>
              </div>
            </div>

            <!-- actions -->
            <div class="flex flex-wrap justify-end gap-2">
              <UiButton
                variant="secondary"
                size="sm"
                @click="showAppointmentDetailsModal = false"
              >
                Fermer
              </UiButton>
              <!-- before appointment time: modify / cancel -->
              <template
                v-if="isBeforeAppointmentTime(appointmentDetailsSelected)"
              >
                <UiButton
                  size="sm"
                  variant="outline"
                  @click="
                    openAgendaModifyModal(appointmentDetailsSelected);
                    showAppointmentDetailsModal = false;
                  "
                >
                  Modifier
                </UiButton>
                <UiButton
                  size="sm"
                  variant="danger"
                  @click="
                    openAgendaCancelModal(appointmentDetailsSelected);
                    showAppointmentDetailsModal = false;
                  "
                >
                  Annuler
                </UiButton>
              </template>
              <!-- at or after: attended / noshow (cabinet only) -->
              <template
                v-else-if="
                  isAtOrAfterAppointmentTime(appointmentDetailsSelected) &&
                  appointmentDetailsSelected.type !== 'TELECONSULTATION' &&
                  appointmentDetailsSelected.status !== 'COMPLETED' &&
                  appointmentDetailsSelected.status !== 'NO_SHOW' &&
                  appointmentDetailsSelected.status !== 'CANCELLED'
                "
              >
                <UiButton
                  size="sm"
                  class="bg-green-600 hover:bg-green-700"
                  @click="
                    agendaMarkAttended(appointmentDetailsSelected);
                    showAppointmentDetailsModal = false;
                  "
                >
                  Présenté
                </UiButton>
                <UiButton
                  size="sm"
                  variant="danger"
                  @click="
                    agendaMarkNoShow(appointmentDetailsSelected);
                    showAppointmentDetailsModal = false;
                  "
                >
                  No Show
                </UiButton>
              </template>
              <!-- completed appointments: invoice -->
              <UiButton
                v-if="
                  appointmentDetailsSelected.status === 'COMPLETED' &&
                  appointmentDetailsSelected.type === 'CABINET'
                "
                size="sm"
                variant="outline"
                @click="
                  openInvoiceModal(appointmentDetailsSelected);
                  showAppointmentDetailsModal = false;
                "
              >
                Facturer
              </UiButton>
            </div>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  Calendar,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Ban,
  X,
  Video,
  Building2,
  Home,
  Siren,
  Settings,
  CalendarDays,
  User,
  Mail,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-vue-next";
import CreateInvoiceModal from "~/components/practitioner/CreateInvoiceModal.vue";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "practitioner",
  middleware: "practitioner-only",
});

const authStore = useAuthStore();

const selectedCabinetId = ref<string | null>(null);
const cabinets = ref<any[]>([]);

const cabinetQueryParam = computed(() => {
  return selectedCabinetId.value === null ? "null" : selectedCabinetId.value;
});

interface PatientInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface AgendaAppointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  status: string;
  reason: string | null;
  consultationFee: number;
  patient: PatientInfo;
}

interface AvailabilitySlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  breakStartTime: string | null;
  breakEndTime: string | null;
  isEmergencySlot: boolean;
  isActive: boolean;
}

interface AbsenceInfo {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  notifiedPatients: boolean;
  createdAt: string;
}

interface BlockedSlotInfo {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
}

interface DaySummary {
  total: number;
  cabinet: number;
  teleconsultation: number;
}

interface SettingsData {
  consultationDuration: number;
  teleconsultationEnabled: boolean;
  homeVisitEnabled: boolean;
  emergencySlotsEnabled: boolean;
  backToBack: boolean;
  breakBetweenSlots: number;
  minBookingNotice: number;
  maxBookingAdvance: number;
  cancellationNotice: number;
  acceptsNewPatients: boolean;
  newPatientMaxPerDay: number;
  baseConsultationFee: number;
  teleconsultationFee?: number;
  noShowThreshold: number;
  noShowPenaltyDays: number;
  noShowAutoBlock: boolean;
}

const tabs = [
  { id: "calendar", label: "Calendrier", icon: CalendarDays },
  { id: "absences", label: "Absences", icon: CalendarX2 },
  { id: "settings", label: "Paramètres", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];
const activeTab = ref<TabId>("calendar");

type CalendarViewType = "day" | "week" | "month";
const viewOptions = [
  { value: "day" as const, label: "Jour" },
  { value: "week" as const, label: "Semaine" },
  { value: "month" as const, label: "Mois" },
];
const calendarView = ref<CalendarViewType>("day");
const currentDate = ref(new Date());
const appointments = ref<AgendaAppointment[]>([]);
const loadingAppointments = ref(true);
const daySummary = ref<DaySummary>({
  total: 0,
  cabinet: 0,
  teleconsultation: 0,
});

const availabilities = ref<AvailabilitySlot[]>([]);
const loadingAvailabilities = ref(true);

const absences = ref<AbsenceInfo[]>([]);
const loadingAbsences = ref(true);
const savingAbsence = ref(false);
const notifyingId = ref<string | null>(null);
const newAbsence = ref({ startDate: "", endDate: "", reason: "" });

const blockedSlots = ref<BlockedSlotInfo[]>([]);
const loadingBlockedSlots = ref(true);

const loadingSettings = ref(true);
const savingSettings = ref(false);
const settingsForm = ref<SettingsData>({
  consultationDuration: 30,
  teleconsultationEnabled: false,
  homeVisitEnabled: false,
  emergencySlotsEnabled: false,
  backToBack: false,
  breakBetweenSlots: 0,
  minBookingNotice: 60,
  maxBookingAdvance: 60,
  cancellationNotice: 24,
  acceptsNewPatients: true,
  newPatientMaxPerDay: 0,
  baseConsultationFee: 0,
  teleconsultationFee: undefined,
  noShowThreshold: 3,
  noShowPenaltyDays: 30,
  noShowAutoBlock: false,
});

const showNewAppointmentModal = ref(false);
const showBlockSlotModal = ref(false);
const showDeleteAbsenceConfirm = ref(false);
const absenceToDelete = ref<string | null>(null);
const absenceToDeleteInfo = ref<AbsenceInfo | null>(null);

const patientSearch = ref("");
const patientResults = ref<PatientInfo[]>([]);
const selectedPatient = ref<PatientInfo | null>(null);
const creatingAppointment = ref(false);
const appointmentError = ref("");
const newAppointment = ref({
  appointmentDate: "",
  startTime: "",
  type: "IN_PERSON" as "IN_PERSON" | "TELECONSULTATION",
  reason: "",
});

const blockingSlot = ref(false);
const newBlockedSlot = ref({
  date: "",
  startTime: "",
  endTime: "",
  reason: "",
});

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

const toasts = ref<Toast[]>([]);
let toastIdCounter = 0;

function showToast(
  message: string,
  type: "success" | "error" | "info" = "info",
) {
  const id = ++toastIdCounter;
  toasts.value.push({ id, message, type });
  setTimeout(() => removeToast(id), 5000);
}

function removeToast(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

const daysOfWeek = [
  { value: "MONDAY", label: "Lundi" },
  { value: "TUESDAY", label: "Mardi" },
  { value: "WEDNESDAY", label: "Mercredi" },
  { value: "THURSDAY", label: "Jeudi" },
  { value: "FRIDAY", label: "Vendredi" },
  { value: "SATURDAY", label: "Samedi" },
  { value: "SUNDAY", label: "Dimanche" },
];

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const periodLabel = computed(() => {
  const d = currentDate.value;
  if (calendarView.value === "day") {
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (calendarView.value === "week") {
    const start = getWeekStart(d);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
});

const dateRange = computed(() => {
  const d = currentDate.value;
  if (calendarView.value === "day") {
    const s = toDateStr(d);
    return { startDate: s, endDate: s };
  }
  if (calendarView.value === "week") {
    const start = getWeekStart(d);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { startDate: toDateStr(start), endDate: toDateStr(end) };
  }
  // month
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { startDate: toDateStr(start), endDate: toDateStr(end) };
});

const filteredAppointments = computed(() => {
  const dateStr = toDateStr(currentDate.value);
  return appointments.value.filter(
    (a) => toDateStr(new Date(a.appointmentDate)) === dateStr,
  );
});

const weekDays = computed(() => {
  const start = getWeekStart(currentDate.value);
  const today = toDateStr(new Date());
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push({
      dateStr: toDateStr(d),
      dayName: d.toLocaleDateString("fr-FR", { weekday: "short" }),
      dayNum: d.getDate(),
      isToday: toDateStr(d) === today,
    });
  }
  return days;
});

const monthDays = computed(() => {
  const d = currentDate.value;
  const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  const lastOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const today = toDateStr(new Date());

  // day of week (0=Sun) -> mon based (0=Mon)
  let startDow = firstOfMonth.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: {
    num: number;
    dateStr: string;
    inMonth: boolean;
    isToday: boolean;
  }[] = [];

  // leading days from previous month
  const prevMonth = new Date(d.getFullYear(), d.getMonth(), 0);
  for (let i = startDow - 1; i >= 0; i--) {
    const dd = new Date(prevMonth);
    dd.setDate(prevMonth.getDate() - i);
    days.push({
      num: dd.getDate(),
      dateStr: toDateStr(dd),
      inMonth: false,
      isToday: false,
    });
  }

  // current month days
  for (let i = 1; i <= lastOfMonth.getDate(); i++) {
    const dd = new Date(d.getFullYear(), d.getMonth(), i);
    const ds = toDateStr(dd);
    days.push({
      num: i,
      dateStr: ds,
      inMonth: true,
      isToday: ds === today,
    });
  }

  // trailing days
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const dd = new Date(d.getFullYear(), d.getMonth() + 1, i);
    days.push({
      num: i,
      dateStr: toDateStr(dd),
      inMonth: false,
      isToday: false,
    });
  }

  return days;
});

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekStart(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getAppointmentsForDate(dateStr: string): AgendaAppointment[] {
  return appointments.value.filter(
    (a) => toDateStr(new Date(a.appointmentDate)) === dateStr,
  );
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "En attente",
    CONFIRMED: "Confirmé",
    COMPLETED: "Terminé",
    CANCELLED: "Annulé",
    NO_SHOW: "Absent",
    RESCHEDULED: "Reporté",
  };
  return map[status] || status;
}

function getStatusVariant(
  status: string,
): "success" | "warning" | "danger" | "default" | "primary" {
  const map: Record<
    string,
    "success" | "warning" | "danger" | "default" | "primary"
  > = {
    PENDING: "warning",
    CONFIRMED: "primary",
    COMPLETED: "success",
    CANCELLED: "danger",
    NO_SHOW: "danger",
  };
  return map[status] || "default";
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isDayActive(dayValue: string): boolean {
  const slot = availabilities.value.find(
    (a) => a.dayOfWeek === dayValue && !a.isEmergencySlot,
  );
  return slot ? slot.isActive : false;
}

function getDaySchedule(dayValue: string): AvailabilitySlot | undefined {
  return availabilities.value.find(
    (a) => a.dayOfWeek === dayValue && !a.isEmergencySlot,
  );
}

// generate all time slots from 00:00 to 23:45 in 15 minute increments
function generateAllTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
      );
    }
  }
  return slots;
}

const allTimeSlots = generateAllTimeSlots();

// get start time options: all slots from 00:00 to 23:30 (so theres room for atleast one 15min slot after)
function getStartTimeOptions(_dayValue: string): string[] {
  // start time can be from 00:00 to 23:30 (must leave room for end time to be > start)
  return allTimeSlots.filter((slot) => {
    const parts = slot.split(":").map(Number);
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    const totalMinutes = h * 60 + m;
    return totalMinutes <= 23 * 60 + 30; // max 23:30
  });
}

// get end time options: only times strictly after the selected start time, up to 23:45
function getEndTimeOptions(dayValue: string): string[] {
  const schedule = getDaySchedule(dayValue);
  const startTime = schedule?.startTime || "09:00";
  const startParts = startTime.split(":").map(Number);
  const startH = startParts[0] ?? 9;
  const startM = startParts[1] ?? 0;
  const startMinutes = startH * 60 + startM;

  return allTimeSlots.filter((slot) => {
    const parts = slot.split(":").map(Number);
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    const totalMinutes = h * 60 + m;
    // end time must be strictly greater than start time and at most 23:45
    return totalMinutes > startMinutes && totalMinutes <= 23 * 60 + 45;
  });
}

function navigateDate(direction: number) {
  const d = new Date(currentDate.value);
  if (calendarView.value === "day") {
    d.setDate(d.getDate() + direction);
  } else if (calendarView.value === "week") {
    d.setDate(d.getDate() + direction * 7);
  } else {
    d.setMonth(d.getMonth() + direction);
  }
  currentDate.value = d;
}

function goToToday() {
  currentDate.value = new Date();
}

async function fetchAppointments() {
  loadingAppointments.value = true;
  try {
    const { startDate, endDate } = dateRange.value;
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: AgendaAppointment[];
    }>(
      `/practitioner/agenda/appointments?startDate=${startDate}&endDate=${endDate}&cabinetId=${cabinetQueryParam.value}`,
    );
    if (response.success) {
      appointments.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching appointments:", error);
  } finally {
    loadingAppointments.value = false;
  }
}

async function fetchDaySummary() {
  try {
    const dateStr = toDateStr(currentDate.value);
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: DaySummary;
    }>(`/practitioner/agenda/day-summary?date=${dateStr}&cabinetId=${cabinetQueryParam.value}`);
    if (response.success) {
      daySummary.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching day summary:", error);
  }
}

async function fetchAvailabilities() {
  loadingAvailabilities.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: AvailabilitySlot[];
    }>(`/practitioner/agenda/availabilities?cabinetId=${cabinetQueryParam.value}`);
    if (response.success) {
      availabilities.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching availabilities:", error);
  } finally {
    loadingAvailabilities.value = false;
  }
}

async function fetchAbsences() {
  loadingAbsences.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: AbsenceInfo[];
    }>(`/practitioner/agenda/absences?cabinetId=${cabinetQueryParam.value}`);
    if (response.success) {
      absences.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching absences:", error);
  } finally {
    loadingAbsences.value = false;
  }
}

async function fetchBlockedSlots() {
  loadingBlockedSlots.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: BlockedSlotInfo[];
    }>(`/practitioner/agenda/blocked-slots?cabinetId=${cabinetQueryParam.value}`);
    if (response.success) {
      blockedSlots.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching blocked slots:", error);
  } finally {
    loadingBlockedSlots.value = false;
  }
}

async function fetchSettings() {
  loadingSettings.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: SettingsData;
    }>("/practitioner/agenda/settings");
    if (response.success) {
      settingsForm.value = { ...response.data };
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
  } finally {
    loadingSettings.value = false;
  }
}

async function toggleDayActive(dayValue: string, event: Event) {
  const target = event.target as HTMLInputElement;
  const isActive = target.checked;
  const existing = getDaySchedule(dayValue);
  try {
    await useAuthenticatedFetch("/practitioner/agenda/availabilities", {
      method: "POST",
      body: {
        dayOfWeek: dayValue,
        startTime: existing?.startTime || "09:00",
        endTime: existing?.endTime || "17:00",
        isActive,
        isEmergencySlot: false,
        cabinetId: selectedCabinetId.value,
      },
    });
    await fetchAvailabilities();
  } catch (error) {
    console.error("Error toggling day:", error);
    const errorMsg =
      (error as { data?: { message?: string } })?.data?.message ||
      "Erreur lors de la modification des disponibilités";
    showToast(errorMsg, "error");
    target.checked = !isActive;
  }
}

async function updateDayTime(dayValue: string, field: string, value: string) {
  const existing = getDaySchedule(dayValue);
  const startTime =
    field === "startTime" ? value : existing?.startTime || "09:00";
  let endTime = field === "endTime" ? value : existing?.endTime || "17:00";

  // convert times to minutes for comparison
  const startParts = startTime.split(":").map(Number);
  const endParts = endTime.split(":").map(Number);
  const startH = startParts[0] ?? 9;
  const startM = startParts[1] ?? 0;
  const endH = endParts[0] ?? 17;
  const endM = endParts[1] ?? 0;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // if updating start time and it makes end time invalid, autoadjust end time
  if (field === "startTime" && endMinutes <= startMinutes) {
    // set end time to start time + 15 minutes, capped at 23:45
    const newEndMinutes = Math.min(startMinutes + 15, 23 * 60 + 45);
    const newEndH = Math.floor(newEndMinutes / 60);
    const newEndM = newEndMinutes % 60;
    endTime = `${newEndH.toString().padStart(2, "0")}:${newEndM.toString().padStart(2, "0")}`;
  }

  try {
    await useAuthenticatedFetch("/practitioner/agenda/availabilities", {
      method: "POST",
      body: {
        dayOfWeek: dayValue,
        startTime,
        endTime,
        isActive: true,
        isEmergencySlot: false,
        cabinetId: selectedCabinetId.value,
      },
    });
    await fetchAvailabilities();
  } catch (error) {
    console.error("Error updating day time:", error);
    const errorMsg =
      (error as { data?: { message?: string } })?.data?.message ||
      "Erreur lors de la modification des disponibilités";
    showToast(errorMsg, "error");
    await fetchAvailabilities();
  }
}

async function addAbsence() {
  if (!newAbsence.value.startDate || !newAbsence.value.endDate) return;
  savingAbsence.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: {
        absence: AbsenceInfo;
        cancelledAppointmentsCount: number;
      };
    }>("/practitioner/agenda/absences", {
      method: "POST",
      body: {
        ...newAbsence.value,
        cabinetId: selectedCabinetId.value,
      },
    });
    if (response.success) {
      absences.value.push(response.data.absence);
      newAbsence.value = { startDate: "", endDate: "", reason: "" };

      // show feedback about cancelled appointments
      if (response.data.cancelledAppointmentsCount > 0) {
        showToast(
          `Absence créée. ${response.data.cancelledAppointmentsCount} rendez-vous ${response.data.cancelledAppointmentsCount > 1 ? "ont été annulés" : "a été annulé"} et les patients ont été notifiés par email.`,
          "success",
        );
      } else {
        showToast("Absence créée avec succès", "success");
      }
    }
  } catch (error) {
    console.error("Error adding absence:", error);
    const errorMsg =
      (error as { data?: { message?: string } })?.data?.message ||
      "Erreur lors de la création de l'absence";
    showToast(errorMsg, "error");
  } finally {
    savingAbsence.value = false;
  }
}

async function removeAbsence(id: string) {
  absenceToDelete.value = id;
  absenceToDeleteInfo.value = absences.value.find((a) => a.id === id) || null;
  showDeleteAbsenceConfirm.value = true;
}

async function confirmDeleteAbsence() {
  const id = absenceToDelete.value;
  if (!id) return;
  try {
    await useAuthenticatedFetch(`/practitioner/agenda/absences/${id}`, {
      method: "DELETE",
    });
    absences.value = absences.value.filter((a) => a.id !== id);
    showToast("Absence supprimée", "success");
  } catch (error) {
    console.error("Error removing absence:", error);
    showToast("Erreur lors de la suppression de l'absence", "error");
  } finally {
    showDeleteAbsenceConfirm.value = false;
    absenceToDelete.value = null;
    absenceToDeleteInfo.value = null;
  }
}

async function notifyPatients(absenceId: string) {
  notifyingId.value = absenceId;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: { notifiedCount: number };
    }>(`/practitioner/agenda/absences/${absenceId}/notify`, { method: "POST" });
    if (response.success) {
      const a = absences.value.find((ab) => ab.id === absenceId);
      if (a) a.notifiedPatients = true;
      showToast(
        `${response.data.notifiedCount} patient(s) ont été notifiés par email`,
        "success",
      );
    }
  } catch (error) {
    console.error("Error notifying patients:", error);
    showToast("Erreur lors de la notification des patients", "error");
  } finally {
    notifyingId.value = null;
  }
}

function openBlockSlotModal() {
  newBlockedSlot.value = {
    date: toDateStr(currentDate.value),
    startTime: "12:00",
    endTime: "14:00",
    reason: "",
  };
  showBlockSlotModal.value = true;
}

async function blockSlot() {
  blockingSlot.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: {
        blockedSlot: BlockedSlotInfo;
        cancelledAppointmentsCount: number;
      };
    }>("/practitioner/agenda/blocked-slots", {
      method: "POST",
      body: {
        ...newBlockedSlot.value,
        cabinetId: selectedCabinetId.value,
      },
    });
    if (response.success) {
      blockedSlots.value.push(response.data.blockedSlot);
      showBlockSlotModal.value = false;

      // show feedback about cancelled appointments
      if (response.data.cancelledAppointmentsCount > 0) {
        showToast(
          `Créneau bloqué. ${response.data.cancelledAppointmentsCount} rendez-vous ${response.data.cancelledAppointmentsCount > 1 ? "ont été annulés" : "a été annulé"} et les patients ont été notifiés par email.`,
          "success",
        );
      } else {
        showToast("Créneau bloqué avec succès", "success");
      }
    }
  } catch (error) {
    console.error("Error blocking slot:", error);
    showToast("Erreur lors du blocage du créneau", "error");
  } finally {
    blockingSlot.value = false;
  }
}

async function removeBlockedSlot(id: string) {
  try {
    await useAuthenticatedFetch(`/practitioner/agenda/blocked-slots/${id}`, {
      method: "DELETE",
    });
    blockedSlots.value = blockedSlots.value.filter((s) => s.id !== id);
  } catch (error) {
    console.error("Error removing blocked slot:", error);
  }
}

function openNewAppointmentModal() {
  selectedPatient.value = null;
  patientSearch.value = "";
  patientResults.value = [];
  appointmentError.value = "";
  newAppointment.value = {
    appointmentDate: toDateStr(currentDate.value),
    startTime: "09:00",
    type: "IN_PERSON",
    reason: "",
  };
  showNewAppointmentModal.value = true;
}

function searchPatients() {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (patientSearch.value.length < 2) {
    patientResults.value = [];
    return;
  }
  searchTimeout = setTimeout(async () => {
    try {
      const response = await useAuthenticatedFetch<{
        success: boolean;
        data: PatientInfo[];
      }>(
        `/practitioner/agenda/patients/search?q=${encodeURIComponent(patientSearch.value)}`,
      );
      if (response.success) {
        patientResults.value = response.data;
      }
    } catch (error) {
      console.error("Error searching patients:", error);
    }
  }, 300);
}

function selectPatient(p: PatientInfo) {
  selectedPatient.value = p;
  patientSearch.value = `${p.firstName} ${p.lastName}`;
  patientResults.value = [];
}

async function createAppointment() {
  if (!selectedPatient.value) return;
  creatingAppointment.value = true;
  appointmentError.value = "";
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: AgendaAppointment;
    }>("/practitioner/agenda/appointments", {
      method: "POST",
      body: {
        patientId: selectedPatient.value.id,
        cabinetId: selectedCabinetId.value,
        ...newAppointment.value,
      },
    });
    if (response.success) {
      appointments.value.push(response.data);
      showNewAppointmentModal.value = false;
      await fetchDaySummary();
    }
  } catch (error: unknown) {
    appointmentError.value =
      (error as { data?: { message?: string } })?.data?.message ||
      "Erreur lors de la création du rendez-vous";
  } finally {
    creatingAppointment.value = false;
  }
}

async function saveSettings() {
  savingSettings.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: SettingsData;
    }>("/practitioner/agenda/settings", {
      method: "PATCH",
      body: settingsForm.value,
    });
    if (response.success) {
      settingsForm.value = { ...response.data };
      showToast("Paramètres enregistrés avec succès", "success");
    }
  } catch (error) {
    console.error("Error saving settings:", error);
    showToast("Erreur lors de l'enregistrement des paramètres", "error");
  } finally {
    savingSettings.value = false;
  }
}

watch([currentDate, calendarView, selectedCabinetId], () => {
  fetchAppointments();
  fetchDaySummary();
});

const isInvoiceModalOpen = ref(false);
const selectedAppointmentForInvoice = ref<AgendaAppointment | null>(null);

const openInvoiceModal = (apt: AgendaAppointment) => {
  selectedAppointmentForInvoice.value = apt;
  isInvoiceModalOpen.value = true;
};

const handleInvoiceSuccess = () => {
  isInvoiceModalOpen.value = false;
  showToast("Facture créée avec succès", "success");
  navigateTo("/practitioner/billing");
};

watch(activeTab, (tab) => {
  if (tab === "absences") {
    fetchAbsences();
    fetchBlockedSlots();
  } else if (tab === "settings") {
    fetchAvailabilities();
    fetchSettings();
  }
});

async function fetchCabinets() {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: {
        activeCabinets: any[];
        invitations: any[];
      };
    }>("/practitioner/cabinets");
    if (response.success) {
      cabinets.value = response.data.activeCabinets;
    }
  } catch (error) {
    console.error("Error fetching cabinets:", error);
  }
}

async function handleCabinetChange() {
  if (activeTab.value === "calendar") {
    await fetchAvailabilities();
  } else if (activeTab.value === "absences") {
    await Promise.all([fetchAbsences(), fetchBlockedSlots()]);
  } else if (activeTab.value === "settings") {
    await Promise.all([fetchAvailabilities(), fetchSettings()]);
  }
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }
  if (authStore.accessToken) {
    await fetchCabinets();
    fetchAppointments();
    fetchDaySummary();
  } else {
    loadingAppointments.value = false;
  }
});

const showAgendaCancelModal = ref(false);
const showAgendaModifyModal = ref(false);
const agendaSelectedAppointment = ref<AgendaAppointment | null>(null);
const agendaCancelReason = ref("");
const agendaCancelLoading = ref(false);
const agendaModifyDate = ref("");
const agendaModifyTime = ref("");
const agendaModifyLoading = ref(false);

const showAgendaAttendedModal = ref(false);
const showAgendaNoShowModal = ref(false);
const agendaAttendedApt = ref<AgendaAppointment | null>(null);
const agendaNoShowApt = ref<AgendaAppointment | null>(null);
const agendaAttendedLoading = ref(false);
const agendaNoShowLoading = ref(false);

// appointment details modal (for week/month view click)
const showAppointmentDetailsModal = ref(false);
const appointmentDetailsSelected = ref<AgendaAppointment | null>(null);

function openAppointmentDetailsModal(apt: AgendaAppointment) {
  appointmentDetailsSelected.value = apt;
  showAppointmentDetailsModal.value = true;
}

function isBeforeAppointmentTime(apt: AgendaAppointment): boolean {
  if (
    apt.status === "CANCELLED" ||
    apt.status === "COMPLETED" ||
    apt.status === "NO_SHOW"
  )
    return false;
  const now = new Date();
  const timeParts = apt.startTime.split(":").map(Number);
  const h = timeParts[0] ?? 0;
  const m = timeParts[1] ?? 0;
  const aptTime = new Date(apt.appointmentDate);
  aptTime.setHours(h, m, 0, 0);
  return now < aptTime;
}

function isAtOrAfterAppointmentTime(apt: AgendaAppointment): boolean {
  const now = new Date();
  const timeParts = apt.startTime.split(":").map(Number);
  const h = timeParts[0] ?? 0;
  const m = timeParts[1] ?? 0;
  const aptTime = new Date(apt.appointmentDate);
  aptTime.setHours(h, m, 0, 0);
  return now >= aptTime;
}

function openAgendaCancelModal(apt: AgendaAppointment) {
  agendaSelectedAppointment.value = apt;
  agendaCancelReason.value = "";
  showAgendaCancelModal.value = true;
}

async function confirmAgendaCancel() {
  if (!agendaSelectedAppointment.value) return;
  agendaCancelLoading.value = true;
  try {
    await useAuthenticatedFetch(
      `/practitioner/agenda/appointments/${agendaSelectedAppointment.value.id}/cancel`,
      {
        method: "PATCH",
        body: { reason: agendaCancelReason.value || undefined },
      },
    );
    showAgendaCancelModal.value = false;
    showToast("Rendez-vous annulé", "success");
    await fetchAppointments();
    await fetchDaySummary();
  } catch (e: unknown) {
    const apiError = e as { data?: { message?: string } };
    showToast(
      apiError?.data?.message || "Erreur lors de l'annulation",
      "error",
    );
  } finally {
    agendaCancelLoading.value = false;
  }
}

// map of js day numbers (0=sunday) to dayOfWeek values
const dayOfWeekNames = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

// computed property to validate if the selected modify date is a working day
const modifyDateError = computed(() => {
  if (!agendaModifyDate.value) return null;

  const selectedDate = new Date(agendaModifyDate.value);
  const dayOfWeek = dayOfWeekNames[selectedDate.getDay()];

  // check if theres an active availability for this day of week
  const hasAvailability = availabilities.value.some(
    (a) => a.dayOfWeek === dayOfWeek && a.isActive && !a.isEmergencySlot,
  );

  if (!hasAvailability) {
    return "Ce jour ne fait pas partie de vos jours de travail";
  }

  return null;
});

async function openAgendaModifyModal(apt: AgendaAppointment) {
  agendaSelectedAppointment.value = apt;
  const d = new Date(apt.appointmentDate);
  agendaModifyDate.value = d.toISOString().slice(0, 10);
  agendaModifyTime.value = apt.startTime;
  showAgendaModifyModal.value = true;

  // fetch availabilities if not already loaded (needed for date validation)
  if (availabilities.value.length === 0 && !loadingAvailabilities.value) {
    await fetchAvailabilities();
  }
}

async function confirmAgendaModify() {
  if (
    !agendaSelectedAppointment.value ||
    !agendaModifyDate.value ||
    !agendaModifyTime.value
  )
    return;
  agendaModifyLoading.value = true;
  try {
    await useAuthenticatedFetch(
      `/practitioner/agenda/appointments/${agendaSelectedAppointment.value.id}/modify`,
      {
        method: "PATCH",
        body: {
          appointmentDate: agendaModifyDate.value,
          startTime: agendaModifyTime.value,
        },
      },
    );
    showAgendaModifyModal.value = false;
    showToast("Rendez-vous modifié", "success");
    await fetchAppointments();
    await fetchDaySummary();
  } catch (e: unknown) {
    const apiError = e as { data?: { message?: string } };
    showToast(
      apiError?.data?.message || "Erreur lors de la modification",
      "error",
    );
  } finally {
    agendaModifyLoading.value = false;
  }
}

async function agendaMarkAttended(apt: AgendaAppointment) {
  agendaAttendedApt.value = apt;
  showAgendaAttendedModal.value = true;
}

async function confirmAgendaAttended() {
  if (!agendaAttendedApt.value) return;
  agendaAttendedLoading.value = true;
  try {
    await useAuthenticatedFetch(
      `/practitioner/agenda/appointments/${agendaAttendedApt.value.id}/attended`,
      { method: "PATCH" },
    );
    showAgendaAttendedModal.value = false;
    showToast("Patient marqué comme présent", "success");
    await fetchAppointments();
    await fetchDaySummary();
  } catch (e: unknown) {
    const apiError = e as { data?: { message?: string } };
    showToast(apiError?.data?.message || "Erreur", "error");
  } finally {
    agendaAttendedLoading.value = false;
  }
}

async function agendaMarkNoShow(apt: AgendaAppointment) {
  agendaNoShowApt.value = apt;
  showAgendaNoShowModal.value = true;
}

async function confirmAgendaNoShow() {
  if (!agendaNoShowApt.value) return;
  agendaNoShowLoading.value = true;
  try {
    await useAuthenticatedFetch(
      `/practitioner/agenda/appointments/${agendaNoShowApt.value.id}/no-show`,
      { method: "PATCH" },
    );
    showAgendaNoShowModal.value = false;
    showToast("Patient marqué comme absent", "success");
    await fetchAppointments();
    await fetchDaySummary();
  } catch (e) {
    const apiError = e as { data?: { message?: string } };
    showToast(apiError?.data?.message || "Erreur", "error");
  } finally {
    agendaNoShowLoading.value = false;
  }
}
</script>
