<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">
        Consultations au cabinet
      </h1>
      <p class="text-gray-600">
        Gérez vos rendez-vous en cabinet du jour et passés
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiCard>
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-green-100"
          >
            <Building2 class="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Aujourd'hui</p>
            <p
              v-if="loading"
              class="h-7 w-10 animate-pulse rounded bg-gray-200"
            />
            <p v-else class="text-2xl font-bold text-gray-900">
              {{ stats.today }}
            </p>
          </div>
        </div>
      </UiCard>
      <UiCard>
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-100"
          >
            <Clock class="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">En attente</p>
            <p
              v-if="loading"
              class="h-7 w-10 animate-pulse rounded bg-gray-200"
            />
            <p v-else class="text-2xl font-bold text-gray-900">
              {{ stats.pending }}
            </p>
          </div>
        </div>
      </UiCard>
      <UiCard>
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100"
          >
            <CheckCircle class="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Terminées (semaine)</p>
            <p
              v-if="loading"
              class="h-7 w-10 animate-pulse rounded bg-gray-200"
            />
            <p v-else class="text-2xl font-bold text-gray-900">
              {{ stats.completedThisWeek }}
            </p>
          </div>
        </div>
      </UiCard>
      <UiCard>
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-red-100"
          >
            <AlertTriangle class="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Non présentés</p>
            <p
              v-if="loading"
              class="h-7 w-10 animate-pulse rounded bg-gray-200"
            />
            <p v-else class="text-2xl font-bold text-gray-900">
              {{ stats.noShowsThisWeek }}
            </p>
          </div>
        </div>
      </UiCard>
    </div>

    <div class="border-b border-gray-200">
      <nav class="-mb-px flex gap-6">
        <button
          :class="[
            'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'today'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
          ]"
          @click="activeTab = 'today'"
        >
          Consultations du jour
          <span
            :class="[
              'ml-2 rounded-full px-2 py-0.5 text-xs',
              activeTab === 'today'
                ? 'bg-orange-100 text-orange-600'
                : 'bg-gray-100 text-gray-500',
            ]"
          >
            {{ todayAppointments.length }}
          </span>
        </button>
        <button
          :class="[
            'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'past'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
          ]"
          @click="activeTab = 'past'"
        >
          Consultations passées
          <span
            :class="[
              'ml-2 rounded-full px-2 py-0.5 text-xs',
              activeTab === 'past'
                ? 'bg-orange-100 text-orange-600'
                : 'bg-gray-100 text-gray-500',
            ]"
          >
            {{ pastAppointments.length }}
          </span>
        </button>
      </nav>
    </div>

    <UiCard v-if="activeTab === 'today'">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">
          Consultations du jour
        </h3>
        <div class="flex items-center gap-2">
          <div class="inline-flex rounded-lg border border-gray-300 bg-white">
            <button
              :class="[
                'rounded-l-lg px-3 py-1.5 text-xs font-medium transition-colors',
                todaySortOrder === 'asc'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50',
              ]"
              @click="todaySortOrder = 'asc'"
            >
              Plus proche
            </button>
            <button
              :class="[
                'rounded-r-lg px-3 py-1.5 text-xs font-medium transition-colors',
                todaySortOrder === 'desc'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50',
              ]"
              @click="todaySortOrder = 'desc'"
            >
              Plus tard
            </button>
          </div>
          <UiButton variant="outline" size="sm" @click="refreshData">
            <RefreshCw class="mr-1.5 h-4 w-4" />
            Actualiser
          </UiButton>
        </div>
      </div>

      <div v-if="loading" class="space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="animate-pulse rounded-lg border p-4"
        >
          <div class="flex gap-4">
            <div class="h-10 w-10 rounded-full bg-gray-200" />
            <div class="flex-1 space-y-2">
              <div class="h-4 w-1/3 rounded bg-gray-200" />
              <div class="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="todayAppointments.length === 0" class="py-8 text-center">
        <Building2 class="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p class="text-gray-500">Aucune consultation prévue aujourd'hui</p>
      </div>

      <div v-else>
        <div class="space-y-3">
          <div
            v-for="apt in paginatedTodayAppointments"
            :key="apt.id"
            class="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
          >
            <div class="flex items-center gap-4">
              <div
                :class="[
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  getStatusBgColor(apt.status),
                ]"
              >
                <User :class="['h-5 w-5', getStatusIconColor(apt.status)]" />
              </div>
              <div>
                <p class="font-medium text-gray-900">
                  {{ apt.patient.lastName }} {{ apt.patient.firstName }}
                </p>
                <div class="flex items-center gap-3 text-sm text-gray-500">
                  <span class="flex items-center gap-1">
                    <Clock class="h-3.5 w-3.5" />
                    {{ apt.startTime }} - {{ apt.endTime }}
                  </span>
                  <span v-if="apt.reason" class="truncate">{{
                    apt.reason
                  }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UiBadge :variant="getStatusVariant(apt.status)">
                {{ getStatusLabel(apt.status) }}
              </UiBadge>

              <!-- before appointment time: modifier / annuler -->
              <template v-if="isBeforeAppointmentTime(apt)">
                <UiButton
                  variant="outline"
                  size="sm"
                  @click="openModifyModal(apt)"
                >
                  <Pencil class="mr-1.5 h-4 w-4" />
                  Modifier
                </UiButton>
                <UiButton
                  variant="danger"
                  size="sm"
                  @click="openCancelModal(apt)"
                >
                  <XCircle class="mr-1.5 h-4 w-4" />
                  Annuler
                </UiButton>
              </template>

              <!-- at or after appointment time: presenté / no show -->
              <template
                v-if="
                  isAtOrAfterAppointmentTime(apt) &&
                  apt.status !== 'COMPLETED' &&
                  apt.status !== 'NO_SHOW' &&
                  apt.status !== 'CANCELLED'
                "
              >
                <UiButton
                  size="sm"
                  class="bg-green-600 hover:bg-green-700"
                  @click="markAttended(apt)"
                >
                  <CheckCircle class="mr-1.5 h-4 w-4" />
                  Présentée
                </UiButton>
                <UiButton variant="danger" size="sm" @click="markNoShow(apt)">
                  <AlertTriangle class="mr-1.5 h-4 w-4" />
                  No Show
                </UiButton>
              </template>

              <!-- no show button always visible until presente is selected  -->
              <template v-if="apt.status === 'COMPLETED'">
                <UiBadge variant="success">Présentée</UiBadge>
              </template>
              <template v-if="apt.status === 'NO_SHOW'">
                <UiBadge variant="danger">No-Show</UiBadge>
              </template>
            </div>
          </div>
        </div>

        <div
          v-if="todayTotalPages > 1"
          class="mt-4 flex items-center justify-center gap-2 border-t pt-4"
        >
          <UiButton
            variant="outline"
            size="sm"
            :disabled="todayPage <= 1"
            @click="todayPage--"
          >
            Précédent
          </UiButton>
          <span class="text-sm text-gray-600">
            Page {{ todayPage }} / {{ todayTotalPages }}
          </span>
          <UiButton
            variant="outline"
            size="sm"
            :disabled="todayPage >= todayTotalPages"
            @click="todayPage++"
          >
            Suivant
          </UiButton>
        </div>
      </div>
    </UiCard>

    <!-- past appointments -->
    <UiCard v-if="activeTab === 'past'">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">
          Consultations passées
        </h3>
        <div class="flex items-center gap-2">
          <div class="inline-flex rounded-lg border border-gray-300 bg-white">
            <button
              :class="[
                'rounded-l-lg px-4 py-2 text-sm font-medium transition-colors',
                pastPeriod === 'week'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50',
              ]"
              @click="setPastPeriod('week')"
            >
              Semaine
            </button>
            <button
              :class="[
                'rounded-r-lg px-4 py-2 text-sm font-medium transition-colors',
                pastPeriod === 'month'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50',
              ]"
              @click="setPastPeriod('month')"
            >
              Mois
            </button>
          </div>
          <UiButton
            variant="outline"
            size="sm"
            @click="showHistoryModal = true"
          >
            <Search class="mr-1.5 h-4 w-4" />
            Historique complet
          </UiButton>
        </div>
      </div>

      <div v-if="loading || loadingPast" class="space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="animate-pulse rounded-lg border p-4"
        >
          <div class="flex gap-4">
            <div class="h-10 w-10 rounded-full bg-gray-200" />
            <div class="flex-1 space-y-2">
              <div class="h-4 w-1/3 rounded bg-gray-200" />
              <div class="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="pastAppointments.length === 0" class="py-8 text-center">
        <p class="text-gray-500">
          Aucune consultation passée cette
          {{ pastPeriod === "week" ? "semaine" : "période" }}
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[720px]">
          <thead>
            <tr class="border-b text-left text-sm text-gray-500">
              <th class="pb-3 font-medium">Patient</th>
              <th class="pb-3 font-medium">Date</th>
              <th class="pb-3 font-medium">Heure</th>
              <th class="pb-3 font-medium">Durée</th>
              <th class="pb-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr
              v-for="apt in paginatedPastAppointments"
              :key="apt.id"
              class="hover:bg-gray-50"
            >
              <td class="py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                  >
                    <User class="h-4 w-4 text-gray-500" />
                  </div>
                  <span class="font-medium text-gray-900">
                    {{ apt.patient.lastName }} {{ apt.patient.firstName }}
                  </span>
                </div>
              </td>
              <td class="py-3 text-sm text-gray-600">
                {{ formatAppointmentDate(apt.appointmentDate) }}
              </td>
              <td class="py-3 text-sm text-gray-600">
                {{ apt.startTime }} - {{ apt.endTime }}
              </td>
              <td class="py-3 text-sm text-gray-600">{{ apt.duration }} min</td>
              <td class="py-3">
                <UiBadge :variant="getStatusVariant(apt.status)">
                  {{ getStatusLabel(apt.status) }}
                </UiBadge>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-if="pastTotalPages > 1"
          class="mt-4 flex items-center justify-center gap-2 border-t pt-4"
        >
          <UiButton
            variant="outline"
            size="sm"
            :disabled="pastPage <= 1"
            @click="pastPage--"
          >
            Précédent
          </UiButton>
          <span class="text-sm text-gray-600">
            Page {{ pastPage }} / {{ pastTotalPages }}
          </span>
          <UiButton
            variant="outline"
            size="sm"
            :disabled="pastPage >= pastTotalPages"
            @click="pastPage++"
          >
            Suivant
          </UiButton>
        </div>
      </div>
    </UiCard>

    <!-- history modal -->
    <Teleport to="body">
      <div
        v-if="showHistoryModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showHistoryModal = false"
      >
        <div class="mx-4 w-full max-w-3xl rounded-xl bg-white shadow-2xl">
          <div class="flex items-center justify-between border-b px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900">
              Historique des consultations au cabinet
            </h3>
            <button
              class="rounded-lg p-1 hover:bg-gray-100"
              @click="showHistoryModal = false"
            >
              <X class="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div class="border-b px-6 py-4">
            <div class="flex flex-wrap gap-3">
              <div class="relative flex-1">
                <Search
                  class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                />
                <input
                  v-model="historySearch"
                  type="text"
                  placeholder="Rechercher un patient..."
                  class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  @input="debouncedFetchHistory"
                />
              </div>
              <select
                v-model="historyStatus"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                @change="fetchHistory()"
              >
                <option value="">Tous les statuts</option>
                <option value="COMPLETED">Terminées</option>
                <option value="CANCELLED">Annulées</option>
                <option value="NO_SHOW">Non présentés</option>
              </select>
              <input
                v-model="historyDateFrom"
                type="date"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                @change="fetchHistory()"
              />
              <input
                v-model="historyDateTo"
                type="date"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                @change="fetchHistory()"
              />
            </div>
          </div>

          <div class="max-h-[60vh] overflow-y-auto px-6">
            <div v-if="loadingHistory" class="space-y-3 py-4">
              <div
                v-for="i in 5"
                :key="i"
                class="animate-pulse rounded-lg border p-3"
              >
                <div class="flex gap-3">
                  <div class="h-8 w-8 rounded-full bg-gray-200" />
                  <div class="flex-1 space-y-2">
                    <div class="h-3 w-1/3 rounded bg-gray-200" />
                    <div class="h-3 w-1/2 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            </div>

            <div
              v-else-if="historyItems.length === 0"
              class="py-12 text-center"
            >
              <p class="text-gray-500">Aucun résultat trouvé</p>
            </div>

            <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[720px]">
              <thead>
                <tr class="border-b text-left text-sm text-gray-500">
                  <th class="py-3 font-medium">Patient</th>
                  <th class="py-3 font-medium">Date</th>
                  <th class="py-3 font-medium">Heure</th>
                  <th class="py-3 font-medium">Durée</th>
                  <th class="py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr
                  v-for="item in historyItems"
                  :key="item.id"
                  class="hover:bg-gray-50"
                >
                  <td class="py-3">
                    <span class="font-medium text-gray-900">
                      {{ item.patient.lastName }} {{ item.patient.firstName }}
                    </span>
                  </td>
                  <td class="py-3 text-sm text-gray-600">
                    {{ formatAppointmentDate(item.appointmentDate) }}
                  </td>
                  <td class="py-3 text-sm text-gray-600">
                    {{ item.startTime }} - {{ item.endTime }}
                  </td>
                  <td class="py-3 text-sm text-gray-600">
                    {{ item.duration }} min
                  </td>
                  <td class="py-3">
                    <UiBadge :variant="getStatusVariant(item.status)">
                      {{ getStatusLabel(item.status) }}
                    </UiBadge>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          <div
            v-if="historyPagination.totalPages > 1"
            class="flex items-center justify-center gap-2 border-t px-6 py-4"
          >
            <UiButton
              variant="outline"
              size="sm"
              :disabled="historyPagination.page <= 1"
              @click="fetchHistory(historyPagination.page - 1)"
            >
              Précédent
            </UiButton>
            <span class="text-sm text-gray-600">
              Page {{ historyPagination.page }} /
              {{ historyPagination.totalPages }}
            </span>
            <UiButton
              variant="outline"
              size="sm"
              :disabled="historyPagination.page >= historyPagination.totalPages"
              @click="fetchHistory(historyPagination.page + 1)"
            >
              Suivant
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- cancel modal -->
    <Teleport to="body">
      <div
        v-if="showCancelModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showCancelModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"
            >
              <XCircle class="h-5 w-5 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              Annuler le rendez-vous
            </h3>
          </div>
          <p class="mb-4 text-sm text-gray-600">
            Êtes-vous sûr de vouloir annuler le rendez-vous de
            <strong
              >{{ selectedAppointment?.patient.lastName }}
              {{ selectedAppointment?.patient.firstName }}</strong
            >
            prévu le
            <strong>{{
              selectedAppointment
                ? formatAppointmentDate(selectedAppointment.appointmentDate)
                : ""
            }}</strong>
            à <strong>{{ selectedAppointment?.startTime }}</strong> ?
          </p>
          <p class="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
            Un email sera envoyé au patient pour l'informer de l'annulation.
          </p>
          <div class="mb-4">
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Raison de l'annulation (optionnel)
            </label>
            <textarea
              v-model="cancelReason"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              rows="3"
              placeholder="Raison de l'annulation..."
            />
          </div>
          <div class="flex justify-end gap-3">
            <UiButton variant="secondary" @click="showCancelModal = false">
              Retour
            </UiButton>
            <UiButton
              variant="danger"
              :disabled="cancelLoading"
              @click="confirmCancel"
            >
              {{ cancelLoading ? "Annulation..." : "Confirmer l'annulation" }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- modify modal -->
    <Teleport to="body">
      <div
        v-if="showModifyModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showModifyModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100"
            >
              <Pencil class="h-5 w-5 text-orange-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              Modifier le rendez-vous
            </h3>
          </div>

          <!-- warning before modifying -->
          <div
            class="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3"
          >
            <div class="flex items-start gap-2">
              <AlertTriangle
                class="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600"
              />
              <p class="text-sm text-yellow-700">
                Pensez à prévenir le patient avant la modification du
                rendez-vous. Un email sera envoyé automatiquement avec les
                nouvelles informations.
              </p>
            </div>
          </div>

          <p class="mb-4 text-sm text-gray-600">
            Modifier le rendez-vous de
            <strong
              >{{ selectedAppointment?.patient.lastName }}
              {{ selectedAppointment?.patient.firstName }}</strong
            >
          </p>
          <div class="mb-4 space-y-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Nouvelle date
              </label>
              <input
                v-model="modifyDate"
                type="date"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Nouvelle heure
              </label>
              <input
                v-model="modifyTime"
                type="time"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
          <div class="flex justify-end gap-3">
            <UiButton variant="secondary" @click="showModifyModal = false">
              Retour
            </UiButton>
            <UiButton
              :disabled="modifyLoading || !modifyDate || !modifyTime"
              @click="confirmModify"
            >
              {{
                modifyLoading ? "Modification..." : "Confirmer la modification"
              }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- attended confirmation modal -->
    <Teleport to="body">
      <div
        v-if="showAttendedModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showAttendedModal = false"
      >
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100"
            >
              <CheckCircle class="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900">
                Confirmer la présence
              </h2>
              <p class="text-sm text-gray-500">
                {{ attendedApt?.patient.firstName }}
                {{ attendedApt?.patient.lastName }}
              </p>
            </div>
          </div>
          <div class="mb-5 rounded-lg bg-orange-50 p-4 text-sm text-orange-700">
            <p class="mb-1 font-medium">Veuillez confirmer :</p>
            <ul class="list-inside list-disc space-y-1 text-orange-700">
              <li>Le patient s'est bien présenté au cabinet</li>
              <li>Le paiement a été effectué à la réception</li>
            </ul>
          </div>
          <div class="flex justify-end gap-3">
            <UiButton variant="outline" @click="showAttendedModal = false">
              Annuler
            </UiButton>
            <UiButton
              class="bg-green-600 hover:bg-green-700"
              :disabled="attendedLoading"
              @click="confirmAttended"
            >
              {{
                attendedLoading ? "Enregistrement..." : "Confirmer la présence"
              }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- noshow confirmation modal -->
    <Teleport to="body">
      <div
        v-if="showNoShowModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showNoShowModal = false"
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
              <p class="text-sm text-gray-500">
                {{ noShowApt?.patient.firstName }}
                {{ noShowApt?.patient.lastName }}
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
            <UiButton variant="outline" @click="showNoShowModal = false">
              Annuler
            </UiButton>
            <UiButton
              variant="danger"
              :disabled="noShowLoading"
              @click="confirmNoShow"
            >
              {{ noShowLoading ? "Enregistrement..." : "Confirmer l'absence" }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  Building2,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Pencil,
  XCircle,
  Search,
  X,
} from "lucide-vue-next";
import { getStatusVariant, getStatusLabel } from "~/utils/status";

definePageMeta({
  layout: "practitioner",
  middleware: "practitioner-only",
});

interface CabinetAppointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  status: string;
  reason: string | null;
  consultationFee: number;
  markedAsNoShow?: boolean;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

const loading = ref(true);
const loadingPast = ref(false);
const loadingHistory = ref(false);
const activeTab = ref<"today" | "past">("today");
const todayAppointments = ref<CabinetAppointment[]>([]);
const pastAppointments = ref<CabinetAppointment[]>([]);
const pastPeriod = ref<"week" | "month">("week");
const stats = ref({
  today: 0,
  pending: 0,
  completedThisWeek: 0,
  noShowsThisWeek: 0,
});

// today sort & pagination
const todaySortOrder = ref<"asc" | "desc">("asc");
const TODAY_ITEMS_PER_PAGE = 10;
const todayPage = ref(1);

const sortedTodayAppointments = computed(() => {
  return [...todayAppointments.value].sort((a, b) => {
    return todaySortOrder.value === "asc"
      ? a.startTime.localeCompare(b.startTime)
      : b.startTime.localeCompare(a.startTime);
  });
});
const todayTotalPages = computed(() =>
  Math.ceil(sortedTodayAppointments.value.length / TODAY_ITEMS_PER_PAGE),
);
const paginatedTodayAppointments = computed(() => {
  const start = (todayPage.value - 1) * TODAY_ITEMS_PER_PAGE;
  return sortedTodayAppointments.value.slice(
    start,
    start + TODAY_ITEMS_PER_PAGE,
  );
});

const ITEMS_PER_PAGE = 10;
const pastPage = ref(1);
const pastTotalPages = computed(() =>
  Math.ceil(pastAppointments.value.length / ITEMS_PER_PAGE),
);
const paginatedPastAppointments = computed(() => {
  const start = (pastPage.value - 1) * ITEMS_PER_PAGE;
  return pastAppointments.value.slice(start, start + ITEMS_PER_PAGE);
});

const showHistoryModal = ref(false);
const historySearch = ref("");
const historyStatus = ref("");
const historyDateFrom = ref("");
const historyDateTo = ref("");
const historyItems = ref<CabinetAppointment[]>([]);
const historyPagination = ref({ page: 1, totalPages: 1, total: 0 });

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const showCancelModal = ref(false);
const selectedAppointment = ref<CabinetAppointment | null>(null);
const cancelReason = ref("");
const cancelLoading = ref(false);

const showModifyModal = ref(false);
const modifyDate = ref("");
const modifyTime = ref("");
const modifyLoading = ref(false);

const showAttendedModal = ref(false);
const attendedApt = ref<CabinetAppointment | null>(null);
const attendedLoading = ref(false);

const showNoShowModal = ref(false);
const noShowApt = ref<CabinetAppointment | null>(null);
const noShowLoading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: {
        todayAppointments: CabinetAppointment[];
        pastAppointments: CabinetAppointment[];
        stats: {
          today: number;
          pending: number;
          completedThisWeek: number;
          noShowsThisWeek: number;
        };
      };
    }>(`/practitioner/agenda/cabinet-appointments?period=${pastPeriod.value}`);
    if (res.success) {
      todayAppointments.value = res.data.todayAppointments;
      pastAppointments.value = res.data.pastAppointments;
      stats.value = res.data.stats;
      pastPage.value = 1;
      todayPage.value = 1;
    }
  } catch (e) {
    console.error("Error fetching cabinet appointments:", e);
  } finally {
    loading.value = false;
  }
};

const fetchPastAppointments = async () => {
  loadingPast.value = true;
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: {
        todayAppointments: CabinetAppointment[];
        pastAppointments: CabinetAppointment[];
        stats: typeof stats.value;
      };
    }>(`/practitioner/agenda/cabinet-appointments?period=${pastPeriod.value}`);
    if (res.success) {
      pastAppointments.value = res.data.pastAppointments;
      pastPage.value = 1;
    }
  } catch (e) {
    console.error("Error fetching past appointments:", e);
  } finally {
    loadingPast.value = false;
  }
};

const setPastPeriod = (period: "week" | "month") => {
  pastPeriod.value = period;
  fetchPastAppointments();
};

const fetchHistory = async (page = 1) => {
  loadingHistory.value = true;
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (historySearch.value) params.set("search", historySearch.value);
    if (historyStatus.value) params.set("status", historyStatus.value);
    if (historyDateFrom.value) params.set("dateFrom", historyDateFrom.value);
    if (historyDateTo.value) params.set("dateTo", historyDateTo.value);

    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: CabinetAppointment[];
      pagination: { page: number; totalPages: number; total: number };
    }>(
      `/practitioner/agenda/cabinet-appointments/history?${params.toString()}`,
    );
    if (res.success) {
      historyItems.value = res.data;
      historyPagination.value = res.pagination;
    }
  } catch (e) {
    console.error("Error fetching cabinet history:", e);
  } finally {
    loadingHistory.value = false;
  }
};

const debouncedFetchHistory = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchHistory(), 400);
};

watch(showHistoryModal, (val) => {
  if (val) fetchHistory();
});

const refreshData = () => fetchData();

const formatAppointmentDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const isBeforeAppointmentTime = (apt: CabinetAppointment) => {
  if (
    apt.status === "CANCELLED" ||
    apt.status === "COMPLETED" ||
    apt.status === "NO_SHOW"
  )
    return false;
  const now = Date.now();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  const aptTime = new Date(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    parts[0] ?? 0,
    parts[1] ?? 0,
    0,
    0
  ).getTime();
  return now < aptTime;
};

const isAtOrAfterAppointmentTime = (apt: CabinetAppointment) => {
  const now = Date.now();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  const aptTime = new Date(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    parts[0] ?? 0,
    parts[1] ?? 0,
    0,
    0
  ).getTime();
  return now >= aptTime;
};

const getStatusBgColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100";
    case "CONFIRMED":
      return "bg-orange-100";
    case "COMPLETED":
      return "bg-green-100";
    case "NO_SHOW":
      return "bg-red-100";
    case "CANCELLED":
      return "bg-gray-100";
    default:
      return "bg-gray-100";
  }
};

const getStatusIconColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "text-yellow-600";
    case "CONFIRMED":
      return "text-orange-600";
    case "COMPLETED":
      return "text-green-600";
    case "NO_SHOW":
      return "text-red-600";
    case "CANCELLED":
      return "text-gray-500";
    default:
      return "text-gray-500";
  }
};

const openCancelModal = (apt: CabinetAppointment) => {
  selectedAppointment.value = apt;
  cancelReason.value = "";
  showCancelModal.value = true;
};

const confirmCancel = async () => {
  if (!selectedAppointment.value) return;
  cancelLoading.value = true;
  try {
    await useAuthenticatedFetch(
      `/practitioner/agenda/appointments/${selectedAppointment.value.id}/cancel`,
      {
        method: "PATCH",
        body: { reason: cancelReason.value || undefined },
      },
    );
    showCancelModal.value = false;
    await fetchData();
  } catch (e: unknown) {
    console.error("Error cancelling appointment:", e);
    const err = e as Record<string, unknown>;
    const data = err?.data as Record<string, unknown> | undefined;
    alert(data?.message || "Erreur lors de l'annulation");
  } finally {
    cancelLoading.value = false;
  }
};

const openModifyModal = (apt: CabinetAppointment) => {
  selectedAppointment.value = apt;
  const d = new Date(apt.appointmentDate);
  modifyDate.value = d.toISOString().slice(0, 10);
  modifyTime.value = apt.startTime;
  showModifyModal.value = true;
};

const confirmModify = async () => {
  if (!selectedAppointment.value || !modifyDate.value || !modifyTime.value)
    return;
  modifyLoading.value = true;
  try {
    await useAuthenticatedFetch(
      `/practitioner/agenda/appointments/${selectedAppointment.value.id}/modify`,
      {
        method: "PATCH",
        body: {
          appointmentDate: modifyDate.value,
          startTime: modifyTime.value,
        },
      },
    );
    showModifyModal.value = false;
    await fetchData();
  } catch (e: unknown) {
    console.error("Error modifying appointment:", e);
    const err = e as Record<string, unknown>;
    const data = err?.data as Record<string, unknown> | undefined;
    alert(data?.message || "Erreur lors de la modification");
  } finally {
    modifyLoading.value = false;
  }
};

const markAttended = (apt: CabinetAppointment) => {
  attendedApt.value = apt;
  showAttendedModal.value = true;
};

const confirmAttended = async () => {
  if (!attendedApt.value) return;
  attendedLoading.value = true;
  try {
    await useAuthenticatedFetch(
      `/practitioner/agenda/appointments/${attendedApt.value.id}/attended`,
      { method: "PATCH" },
    );
    showAttendedModal.value = false;
    await fetchData();
  } catch (e: unknown) {
    console.error("Error marking attended:", e);
    const err = e as Record<string, unknown>;
    const data = err?.data as Record<string, unknown> | undefined;
    alert(data?.message || "Erreur");
  } finally {
    attendedLoading.value = false;
  }
};

const markNoShow = (apt: CabinetAppointment) => {
  noShowApt.value = apt;
  showNoShowModal.value = true;
};

const confirmNoShow = async () => {
  if (!noShowApt.value) return;
  noShowLoading.value = true;
  try {
    await useAuthenticatedFetch(
      `/practitioner/agenda/appointments/${noShowApt.value.id}/no-show`,
      { method: "PATCH" },
    );
    showNoShowModal.value = false;
    await fetchData();
  } catch (e: unknown) {
    console.error("Error marking no-show:", e);
    const err = e as Record<string, unknown>;
    const data = err?.data as Record<string, unknown> | undefined;
    alert(data?.message || "Erreur");
  } finally {
    noShowLoading.value = false;
  }
};

onMounted(() => fetchData());
</script>
