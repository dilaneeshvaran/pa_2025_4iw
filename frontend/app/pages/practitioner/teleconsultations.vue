<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="mb-2 text-2xl font-bold text-gray-900">Téléconsultations</h1>
        <p class="text-gray-600">Gérez vos consultations à distance</p>
      </div>
      <UiButton variant="secondary" @click="showPreCallChecks = true">
        <Camera class="mr-1.5 h-4 w-4" />
        Tester caméra et microphone
      </UiButton>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiCard>
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-green-100"
          >
            <Video class="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Aujourd'hui</p>
            <p
              v-if="loading"
              class="h-7 w-10 animate-pulse rounded bg-gray-200"
            />
            <p v-else class="text-2xl font-bold text-gray-900">
              {{ todaySessions.length }}
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
              {{ waitingPatients.length }}
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
            <p class="text-sm text-gray-500">
              Terminées ({{ pastPeriod === "week" ? "semaine" : "mois" }})
            </p>
            <p
              v-if="loading"
              class="h-7 w-10 animate-pulse rounded bg-gray-200"
            />
            <p v-else class="text-2xl font-bold text-gray-900">
              {{ pastSessions.length }}
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
              {{ noShowCount }}
            </p>
          </div>
        </div>
      </UiCard>
    </div>

    <UiCard v-if="waitingPatients.length > 0">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-3 w-3 animate-pulse rounded-full bg-yellow-500" />
          <h3 class="text-lg font-semibold text-gray-900">
            Patients en attente
          </h3>
        </div>
        <UiBadge variant="warning"
          >{{ waitingPatients.length }} en attente</UiBadge
        >
      </div>
      <div class="space-y-3">
        <div
          v-for="wp in waitingPatients"
          :key="wp.id"
          class="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100"
            >
              <User class="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ wp.patientName }}</p>
              <p class="text-sm text-gray-500">
                En attente depuis {{ formatWaitingTime(wp.joinedAt) }}
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <UiButton size="sm" @click="joinSession(wp)">
              <Video class="mr-1.5 h-4 w-4" />
              Rejoindre
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              @click="viewPatientFile(wp)"
            >
              <FileText class="mr-1.5 h-4 w-4" />
              Voir dossier
            </UiButton>
          </div>
        </div>
      </div>
    </UiCard>

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
          Téléconsultations du jour
          <span
            :class="[
              'ml-2 rounded-full px-2 py-0.5 text-xs',
              activeTab === 'today'
                ? 'bg-orange-100 text-orange-600'
                : 'bg-gray-100 text-gray-500',
            ]"
          >
            {{ todaySessions.length }}
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
            {{ pastSessions.length }}
          </span>
        </button>
      </nav>
    </div>

    <UiCard v-if="activeTab === 'today'">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">
          Téléconsultations du jour
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

      <div v-else-if="todaySessions.length === 0" class="py-8 text-center">
        <Video class="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p class="text-gray-500">Aucune téléconsultation prévue aujourd'hui</p>
      </div>

      <div v-else>
        <div class="space-y-3">
          <div
            v-for="session in paginatedTodaySessions"
            :key="session.id"
            class="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
          >
            <div class="flex items-center gap-4">
              <div
                :class="[
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  getSessionBgColor(session.status),
                ]"
              >
                <Video
                  :class="['h-5 w-5', getSessionIconColor(session.status)]"
                />
              </div>
              <div>
                <p class="font-medium text-gray-900">
                  {{ session.patientName }}
                </p>
                <div class="flex items-center gap-3 text-sm text-gray-500">
                  <span class="flex items-center gap-1">
                    <Clock class="h-3.5 w-3.5" />
                    {{ session.startTime }} - {{ session.endTime }}
                  </span>
                  <span v-if="session.reason" class="truncate">{{
                    session.reason
                  }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UiBadge :variant="getStatusBadgeVariant(session.status)">
                {{ getStatusLabel(session.status) }}
              </UiBadge>
              <UiButton
                v-if="canJoinSession(session)"
                size="sm"
                @click="joinSession(session)"
              >
                <Video class="mr-1.5 h-4 w-4" />
                Rejoindre
              </UiButton>

              <UiButton
                variant="secondary"
                size="sm"
                @click="viewPatientFile(session)"
              >
                <FileText class="mr-1.5 h-4 w-4" />
                Dossier
              </UiButton>

              <!-- before appointment time: modifier / annuler -->
              <template v-if="isTeleBeforeTime(session)">
                <UiButton
                  variant="outline"
                  size="sm"
                  @click="openTeleCancelModal(session)"
                >
                  <XCircle class="mr-1.5 h-4 w-4" />
                  Annuler
                </UiButton>
                <UiButton
                  variant="outline"
                  size="sm"
                  @click="openTeleModifyModal(session)"
                >
                  <Pencil class="mr-1.5 h-4 w-4" />
                  Modifier
                </UiButton>
              </template>

              <span
                v-if="
                  isTeleAtOrAfterTime(session) &&
                  session.status !== 'COMPLETED' &&
                  session.status !== 'NO_SHOW' &&
                  session.status !== 'FAILED' &&
                  session.status !== 'CANCELLED'
                "
                class="text-xs italic text-gray-400"
              >
                Absence détectée automatiquement
              </span>
            </div>
          </div>
        </div>

        <!-- today pagination -->
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
              @click="pastPeriod = 'week'"
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
              @click="pastPeriod = 'month'"
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

      <div v-if="loadingPast" class="space-y-3">
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

      <div v-else-if="pastSessions.length === 0" class="py-8 text-center">
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
              <th class="pb-3 font-medium">Durée</th>
              <th class="pb-3 font-medium">Statut</th>
              <th class="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr
              v-for="ps in paginatedPastSessions"
              :key="ps.id"
              class="hover:bg-gray-50"
            >
              <td class="py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                  >
                    <User class="h-4 w-4 text-gray-500" />
                  </div>
                  <span class="font-medium text-gray-900">{{
                    ps.patientName
                  }}</span>
                </div>
              </td>
              <td class="py-3 text-sm text-gray-600">
                {{ formatDate(ps.scheduledAt) }}
              </td>
              <td class="py-3 text-sm text-gray-600">
                {{ ps.duration ? ps.duration + " min" : "-" }}
              </td>
              <td class="py-3">
                <UiBadge :variant="getStatusBadgeVariant(ps.status)">{{
                  getStatusLabel(ps.status)
                }}</UiBadge>
              </td>
              <td class="py-3">
                <UiButton
                  variant="secondary"
                  size="sm"
                  @click="viewPatientFile(ps)"
                >
                  <FileText class="mr-1 h-3.5 w-3.5" />
                  Dossier
                </UiButton>
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

    <Teleport to="body">
      <div
        v-if="showHistoryModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showHistoryModal = false"
      >
        <div class="mx-4 w-full max-w-3xl rounded-xl bg-white shadow-2xl">
          <div class="flex items-center justify-between border-b px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900">
              Historique des téléconsultations
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
                <option value="FAILED">Échouées</option>
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
                  <th class="py-3 font-medium">Durée</th>
                  <th class="py-3 font-medium">Qualité</th>
                  <th class="py-3 font-medium">Statut</th>
                  <th class="py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr
                  v-for="item in historyItems"
                  :key="item.id"
                  class="hover:bg-gray-50"
                >
                  <td class="py-3">
                    <span class="font-medium text-gray-900">{{
                      item.patientName
                    }}</span>
                  </td>
                  <td class="py-3 text-sm text-gray-600">
                    {{ formatDate(item.scheduledAt) }}
                  </td>
                  <td class="py-3 text-sm text-gray-600">
                    {{ item.duration ? item.duration + " min" : "-" }}
                  </td>
                  <td class="py-3">
                    <span
                      v-if="item.connectionQuality"
                      :class="getQualityClass(item.connectionQuality)"
                      class="text-sm"
                    >
                      {{ getQualityLabel(item.connectionQuality) }}
                    </span>
                    <span v-else class="text-sm text-gray-400">-</span>
                  </td>
                  <td class="py-3">
                    <UiBadge :variant="getStatusBadgeVariant(item.status)">{{
                      getStatusLabel(item.status)
                    }}</UiBadge>
                  </td>
                  <td class="py-3">
                    <UiButton
                      variant="secondary"
                      size="sm"
                      @click="viewPatientFile(item)"
                    >
                      <FileText class="mr-1 h-3.5 w-3.5" />
                      Dossier
                    </UiButton>
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

    <Teleport to="body">
      <div
        v-if="showPreCallChecks"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showPreCallChecks = false"
      >
        <div class="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Test caméra et microphone
            </h3>
            <button
              class="rounded-lg p-1 hover:bg-gray-100"
              @click="closePreCallChecks"
            >
              <X class="h-5 w-5 text-gray-400" />
            </button>
          </div>
          <div class="space-y-4">
            <div class="overflow-hidden rounded-lg bg-black">
              <video
                ref="preCallVideoRef"
                autoplay
                muted
                playsinline
                class="h-48 w-full object-cover"
              />
            </div>
            <div class="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div
                  :style="{ width: micLevel + '%' }"
                  class="h-full rounded-full bg-green-500 transition-all"
                />
              </div>
              <span class="text-xs text-gray-500">Volume micro</span>
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                class="flex items-center gap-2 rounded-lg border p-3"
                :class="
                  preCallCamera
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                "
              >
                <Camera
                  :class="preCallCamera ? 'text-green-600' : 'text-red-600'"
                  class="h-5 w-5"
                />
                <span class="text-sm">{{
                  preCallCamera ? "Caméra OK" : "Caméra indisponible"
                }}</span>
              </div>
              <div
                class="flex items-center gap-2 rounded-lg border p-3"
                :class="
                  preCallMic
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                "
              >
                <Mic
                  :class="preCallMic ? 'text-green-600' : 'text-red-600'"
                  class="h-5 w-5"
                />
                <span class="text-sm">{{
                  preCallMic ? "Micro OK" : "Micro indisponible"
                }}</span>
              </div>
            </div>
            <div class="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <p class="text-sm text-orange-700">
                <strong>Conseil :</strong> Utilisez un casque ou des écouteurs
                pour une meilleure qualité audio.
              </p>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <UiButton variant="secondary" @click="closePreCallChecks"
              >Fermer</UiButton
            >
            <UiButton @click="runPreCallTest">Relancer le test</UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- room -->
    <Teleport to="body">
      <div
        v-if="showTeleconsultationRoom"
        class="fixed inset-0 z-50 flex flex-col bg-gray-900"
      >
        <TeleconsultationRoom
          :appointment-id="activeAppointmentId!"
          :session="activeSessionData!"
          @close="closeTeleconsultationRoom"
        />
      </div>
    </Teleport>

    <!-- tele cancel modal -->
    <Teleport to="body">
      <div
        v-if="showTeleCancelModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showTeleCancelModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"
            >
              <XCircle class="h-5 w-5 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              Annuler la téléconsultation
            </h3>
          </div>
          <p class="mb-4 text-sm text-gray-600">
            Êtes-vous sûr de vouloir annuler la téléconsultation de
            <strong>{{ teleSelectedSession?.patientName }}</strong>
            à <strong>{{ teleSelectedSession?.startTime }}</strong> ?
          </p>
          <p class="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
            Un email sera envoyé au patient pour l'informer de l'annulation.
          </p>
          <div class="mb-4">
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >Raison (optionnel)</label
            >
            <textarea
              v-model="teleCancelReason"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              rows="3"
              placeholder="Raison de l'annulation..."
            />
          </div>
          <div class="flex justify-end gap-3">
            <UiButton variant="secondary" @click="showTeleCancelModal = false"
              >Retour</UiButton
            >
            <UiButton
              variant="danger"
              :disabled="teleCancelLoading"
              @click="confirmTeleCancel"
            >
              {{
                teleCancelLoading ? "Annulation..." : "Confirmer l'annulation"
              }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- tele modify modal -->
    <Teleport to="body">
      <div
        v-if="showTeleModifyModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showTeleModifyModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100"
            >
              <Pencil class="h-5 w-5 text-orange-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              Modifier la téléconsultation
            </h3>
          </div>
          <div
            class="mb-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3"
          >
            <AlertTriangle
              class="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600"
            />
            <p class="text-sm text-yellow-700">
              Pensez à prévenir le patient avant la modification du rendez-vous.
              Un email sera envoyé automatiquement avec les nouvelles
              informations.
            </p>
          </div>
          <p class="mb-4 text-sm text-gray-600">
            Modifier la téléconsultation de
            <strong>{{ teleSelectedSession?.patientName }}</strong>
          </p>
          <div class="mb-4 space-y-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Nouvelle date</label
              >
              <input
                v-model="teleModifyDate"
                type="date"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Nouvelle heure</label
              >
              <input
                v-model="teleModifyTime"
                type="time"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
          <div class="flex justify-end gap-3">
            <UiButton variant="secondary" @click="showTeleModifyModal = false"
              >Retour</UiButton
            >
            <UiButton
              :disabled="
                teleModifyLoading || !teleModifyDate || !teleModifyTime
              "
              @click="confirmTeleModify"
            >
              {{
                teleModifyLoading
                  ? "Modification..."
                  : "Confirmer la modification"
              }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  Video,
  Clock,
  User,
  FileText,
  Search,
  X,
  RefreshCw,
  Camera,
  Mic,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Pencil,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";
import { formatDateWithTime as formatDate } from "~/utils/date";
import {
  getTeleconsultationStatusLabel as getStatusLabel,
  getTeleconsultationStatusBadgeVariant as getStatusBadgeVariant,
} from "~/utils/status";

definePageMeta({
  layout: "practitioner",
  middleware: "practitioner-only",
});

const authStore = useAuthStore();
const router = useRouter();

interface SessionItem {
  id: string;
  appointmentId: string;
  patientId?: string;
  patientName: string;
  startTime: string;
  endTime: string;
  scheduledAt: string;
  status: string;
  reason?: string;
  duration?: number | null;
  connectionQuality?: string | null;
  joinedAt?: string;
  roomId?: string;
  roomName?: string;
}

const loading = ref(true);
const loadingPast = ref(false);
const loadingHistory = ref(false);
const todaySessions = ref<SessionItem[]>([]);
const waitingPatients = ref<SessionItem[]>([]);
const pastSessions = ref<SessionItem[]>([]);
const noShowCount = ref(0);
const pastPeriod = ref<"week" | "month">("week");
const activeTab = ref<"today" | "past">("today");

const ITEMS_PER_PAGE = 5;
const todayPage = ref(1);
const pastPage = ref(1);
const todaySortOrder = ref<"asc" | "desc">("asc");

const todayTotalPages = computed(() =>
  Math.ceil(todaySessions.value.length / ITEMS_PER_PAGE),
);
const pastTotalPages = computed(() =>
  Math.ceil(pastSessions.value.length / ITEMS_PER_PAGE),
);

const sortedTodaySessions = computed(() => {
  return [...todaySessions.value].sort((a, b) => {
    const timeA = new Date(a.scheduledAt).getTime();
    const timeB = new Date(b.scheduledAt).getTime();
    return todaySortOrder.value === "asc" ? timeA - timeB : timeB - timeA;
  });
});

const paginatedTodaySessions = computed(() => {
  const start = (todayPage.value - 1) * ITEMS_PER_PAGE;
  return sortedTodaySessions.value.slice(start, start + ITEMS_PER_PAGE);
});
const paginatedPastSessions = computed(() => {
  const start = (pastPage.value - 1) * ITEMS_PER_PAGE;
  return pastSessions.value.slice(start, start + ITEMS_PER_PAGE);
});

const showHistoryModal = ref(false);
const historySearch = ref("");
const historyStatus = ref("");
const historyDateFrom = ref("");
const historyDateTo = ref("");
const historyItems = ref<SessionItem[]>([]);
const historyPagination = ref({ page: 1, totalPages: 1, total: 0 });

const showPreCallChecks = ref(false);
const preCallVideoRef = ref<HTMLVideoElement | null>(null);
const preCallCamera = ref(false);
const preCallMic = ref(false);
const micLevel = ref(0);
let preCallStream: MediaStream | null = null;
let micAnalyserInterval: ReturnType<typeof setInterval> | null = null;

const showTeleconsultationRoom = ref(false);
const activeAppointmentId = ref<string | null>(null);
const activeSessionData = ref<{
  id: string;
  roomId: string;
  roomName: string;
  status: string;
  duration: number | null;
  startedAt: string | null;
  endedAt: string | null;
  connectionQuality: string | null;
  patient?: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
  practitioner?: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
} | null>(null);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const fetchTodaySessions = async () => {
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: SessionItem[];
    }>("/teleconsultations/practitioner/today");
    if (res.success) {
      const now = Date.now();
      // keep SCHEDULED, WAITING, IN_PROGRESS always.
      // keep COMPLETED sessions only if still within the rejoin time window
      // (endTime + 30 min grace period)
      todaySessions.value = res.data.filter((s) => {
        const activeStatuses = ["SCHEDULED", "WAITING", "IN_PROGRESS"];
        if (activeStatuses.includes(s.status)) return true;

        // for COMPLETED sessions, check if the rejoin window is still open
        if (s.status === "COMPLETED") {
          const endParts = s.endTime.split(":").map(Number);
          const endDate = new Date();
          endDate.setHours(endParts[0] || 0, endParts[1] || 0, 0, 0);
          const lateJoinMs = endDate.getTime() + 30 * 60 * 1000;
          return now <= lateJoinMs;
        }

        return false;
      });
    }
  } catch (e) {
    console.error("Error fetching today sessions:", e);
  }
};

const fetchWaitingPatients = async () => {
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: SessionItem[];
    }>("/teleconsultations/practitioner/waiting");
    if (res.success) waitingPatients.value = res.data;
  } catch (e) {
    console.error("Error fetching waiting patients:", e);
  }
};

const fetchPastSessions = async () => {
  loadingPast.value = true;
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: SessionItem[];
    }>(`/teleconsultations/practitioner/past?period=${pastPeriod.value}`);
    if (res.success) {
      pastSessions.value = res.data;
      noShowCount.value = res.data.filter(
        (s) => s.status === "FAILED" || s.status === "NO_SHOW",
      ).length;
    }
  } catch (e) {
    console.error("Error fetching past sessions:", e);
  } finally {
    loadingPast.value = false;
  }
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
      data: SessionItem[];
      pagination: { page: number; totalPages: number; total: number };
    }>(`/teleconsultations/practitioner/history?${params.toString()}`);
    if (res.success) {
      historyItems.value = res.data;
      historyPagination.value = res.pagination;
    }
  } catch (e) {
    console.error("Error fetching history:", e);
  } finally {
    loadingHistory.value = false;
  }
};

const debouncedFetchHistory = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchHistory(), 400);
};

const refreshData = async () => {
  await Promise.all([
    fetchTodaySessions(),
    fetchWaitingPatients(),
    fetchPastSessions(),
  ]);
};

const formatWaitingTime = (joinedAt?: string) => {
  if (!joinedAt) return "quelques instants";
  const diff = Math.floor(
    (Date.now() - new Date(joinedAt).getTime()) / 1000 / 60,
  );
  if (diff < 1) return "moins d'une minute";
  if (diff === 1) return "1 minute";
  return `${diff} minutes`;
};

const getSessionBgColor = (status: string) => {
  switch (status) {
    case "SCHEDULED":
      return "bg-orange-100";
    case "WAITING":
      return "bg-yellow-100";
    case "IN_PROGRESS":
      return "bg-green-100";
    case "COMPLETED":
      return "bg-gray-100";
    case "FAILED":
    case "NO_SHOW":
      return "bg-red-100";
    default:
      return "bg-gray-100";
  }
};

const getSessionIconColor = (status: string) => {
  switch (status) {
    case "SCHEDULED":
      return "text-orange-600";
    case "WAITING":
      return "text-yellow-600";
    case "IN_PROGRESS":
      return "text-green-600";
    case "COMPLETED":
      return "text-gray-500";
    case "FAILED":
    case "NO_SHOW":
      return "text-red-600";
    default:
      return "text-gray-500";
  }
};

const getQualityLabel = (q: string) => {
  switch (q) {
    case "GOOD":
      return "Bonne";
    case "MEDIUM":
      return "Moyenne";
    case "POOR":
      return "Faible";
    default:
      return q;
  }
};

const getQualityClass = (q: string) => {
  switch (q) {
    case "GOOD":
      return "text-green-600";
    case "MEDIUM":
      return "text-yellow-600";
    case "POOR":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};

const canJoinSession = (session: SessionItem) => {
  // IN_PROGRESS can always be joined
  if (session.status === "IN_PROGRESS") return true;

  // Only SCHEDULED, WAITING, and COMPLETED can be joined within time window
  if (
    session.status !== "SCHEDULED" &&
    session.status !== "WAITING" &&
    session.status !== "COMPLETED"
  )
    return false;

  const now = Date.now();
  const aptDate = new Date(session.scheduledAt);
  const [startH, startM] = session.startTime.split(":").map(Number);
  const [endH, endM] = session.endTime.split(":").map(Number);

  // Construct start and end times in local timezone to match browser display
  const startLocal = new Date(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    startH || 0,
    startM || 0,
    0,
    0
  ).getTime();

  const endLocal = new Date(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    endH || 0,
    endM || 0,
    0,
    0
  ).getTime();

  const fifteenMin = 15 * 60 * 1000;
  const lateJoinLimit = endLocal + 30 * 60 * 1000;

  // Can join from 15 min before scheduled to 30 min after appointment end time
  return now >= startLocal - fifteenMin && now <= lateJoinLimit;
};


const joinSession = async (session: SessionItem) => {
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: {
        id: string;
        roomId: string;
        roomName: string;
        status: string;
        duration: number | null;
        startedAt: string | null;
        endedAt: string | null;
        connectionQuality: string | null;
        patient?: {
          id: string;
          userId: string;
          firstName: string;
          lastName: string;
        };
        practitioner?: {
          id: string;
          userId: string;
          firstName: string;
          lastName: string;
        };
      };
    }>(`/teleconsultations/appointment/${session.appointmentId}`);
    if (res.success && res.data) {
      activeAppointmentId.value = session.appointmentId;
      activeSessionData.value = {
        id: res.data.id,
        roomId: res.data.roomId,
        roomName: res.data.roomName,
        status: res.data.status,
        duration: res.data.duration,
        startedAt: res.data.startedAt,
        endedAt: res.data.endedAt,
        connectionQuality: res.data.connectionQuality,
        patient: res.data.patient,
        practitioner: res.data.practitioner,
      };
      showTeleconsultationRoom.value = true;
    }
  } catch (e: unknown) {
    console.error("Failed to join session:", e);
  }
};

const closeTeleconsultationRoom = () => {
  showTeleconsultationRoom.value = false;
  activeAppointmentId.value = null;
  activeSessionData.value = null;
  refreshData();
};

const viewPatientFile = (session: SessionItem) => {
  if (session.patientId) {
    router.push(`/practitioner/patients/${session.patientId}/medical-record`);
  }
};

const runPreCallTest = async () => {
  try {
    preCallStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    preCallCamera.value = true;
    preCallMic.value = true;

    if (preCallVideoRef.value) {
      preCallVideoRef.value.srcObject = preCallStream;
    }

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(preCallStream);
    source.connect(analyser);
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    micAnalyserInterval = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      micLevel.value = Math.min(100, Math.round((avg / 128) * 100));
    }, 100);
  } catch (error: unknown) {
    preCallCamera.value = false;
    preCallMic.value = false;
    console.error("Pre-call test error:", error);
  }
};

const closePreCallChecks = () => {
  if (preCallStream) {
    preCallStream.getTracks().forEach((t) => t.stop());
    preCallStream = null;
  }
  if (micAnalyserInterval) {
    clearInterval(micAnalyserInterval);
    micAnalyserInterval = null;
  }
  micLevel.value = 0;
  showPreCallChecks.value = false;
};

watch(showPreCallChecks, (val) => {
  if (val) nextTick(() => runPreCallTest());
});

watch(pastPeriod, () => {
  pastPage.value = 1;
  fetchPastSessions();
});

watch(todaySortOrder, () => {
  todayPage.value = 1;
});

watch(showHistoryModal, (val) => {
  if (val) fetchHistory();
});

// refresh waiting patients atutomatic
let waitingRefresh: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  if (!authStore.isAuthenticated) authStore.initAuth();
  if (authStore.accessToken) {
    await refreshData();
    loading.value = false;

    waitingRefresh = setInterval(() => {
      fetchWaitingPatients();
    }, 30_000);
  } else {
    loading.value = false;
  }
});

onUnmounted(() => {
  closePreCallChecks();
  if (waitingRefresh) clearInterval(waitingRefresh);
  if (debounceTimer) clearTimeout(debounceTimer);
});

const showTeleCancelModal = ref(false);
const showTeleModifyModal = ref(false);
const teleSelectedSession = ref<SessionItem | null>(null);
const teleCancelReason = ref("");
const teleCancelLoading = ref(false);
const teleModifyDate = ref("");
const teleModifyTime = ref("");
const teleModifyLoading = ref(false);

function isTeleBeforeTime(session: SessionItem): boolean {
  if (
    session.status === "COMPLETED" ||
    session.status === "NO_SHOW" ||
    session.status === "FAILED" ||
    session.status === "CANCELLED"
  )
    return false;
  const now = new Date();
  const scheduled = new Date(session.scheduledAt);
  return now < scheduled;
}

function isTeleAtOrAfterTime(session: SessionItem): boolean {
  const now = new Date();
  const scheduled = new Date(session.scheduledAt);
  return now >= scheduled;
}

function openTeleCancelModal(session: SessionItem) {
  teleSelectedSession.value = session;
  teleCancelReason.value = "";
  showTeleCancelModal.value = true;
}

async function confirmTeleCancel() {
  if (!teleSelectedSession.value) return;
  teleCancelLoading.value = true;
  try {
    await useAuthenticatedFetch(
      `/practitioner/agenda/appointments/${teleSelectedSession.value.appointmentId}/cancel`,
      {
        method: "PATCH",
        body: { reason: teleCancelReason.value || undefined },
      },
    );
    showTeleCancelModal.value = false;
    await refreshData();
  } catch (e: unknown) {
    console.error("Error cancelling:", e);
    const apiError = e as { data?: { message?: string } };
    alert(apiError?.data?.message || "Erreur lors de l'annulation");
  } finally {
    teleCancelLoading.value = false;
  }
}

function openTeleModifyModal(session: SessionItem) {
  teleSelectedSession.value = session;
  const d = new Date(session.scheduledAt);
  teleModifyDate.value = d.toISOString().slice(0, 10);
  teleModifyTime.value = session.startTime;
  showTeleModifyModal.value = true;
}

async function confirmTeleModify() {
  if (
    !teleSelectedSession.value ||
    !teleModifyDate.value ||
    !teleModifyTime.value
  )
    return;
  teleModifyLoading.value = true;
  try {
    await useAuthenticatedFetch(
      `/practitioner/agenda/appointments/${teleSelectedSession.value.appointmentId}/modify`,
      {
        method: "PATCH",
        body: {
          appointmentDate: teleModifyDate.value,
          startTime: teleModifyTime.value,
        },
      },
    );
    showTeleModifyModal.value = false;
    await refreshData();
  } catch (e: unknown) {
    console.error("Error modifying:", e);
    const apiError = e as { data?: { message?: string } };
    alert(apiError?.data?.message || "Erreur lors de la modification");
  } finally {
    teleModifyLoading.value = false;
  }
}
</script>
