<template>
  <div class="min-h-screen bg-gray-50">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Card class="mb-6 shadow-sm border border-gray-100 rounded-xl bg-white p-2">
        <div role="search" class="relative flex items-center">
          <label for="search-main" class="sr-only">Rechercher un praticien</label>
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <IconSearch class="h-5 w-5 text-gray-500" aria-hidden="true" />
          </div>
          <input
            id="search-main"
            v-model="filters.search"
            type="text"
            placeholder="Rechercher un praticien par nom, mot-clé ou spécialité..."
            class="block w-full rounded-xl border-none py-3.5 pl-11 pr-10 text-base text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-all placeholder-gray-500"
            @input="debouncedSearch"
          />
          <button
            v-if="filters.search"
            type="button"
            aria-label="Effacer la recherche"
            @click="filters.search = ''; searchPractitioners()"
            class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-md"
          >
            <IconX class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </Card>

      <!-- Tabs + view toggle -->
      <div class="mb-6 flex items-center justify-between border-b border-gray-200">
        <div class="-mb-px flex gap-6" role="tablist" aria-label="Type de résultats">
          <button
            id="tab-practitioners"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'practitioners'"
            :tabindex="activeTab === 'practitioners' ? 0 : -1"
            aria-controls="panel-practitioners"
            :class="[
              activeTab === 'practitioners'
                ? 'border-[var(--color-primary)] font-bold text-[var(--color-primary)]'
                : 'border-transparent font-medium text-gray-600 hover:border-gray-300 hover:text-gray-800',
              'whitespace-nowrap border-b-2 px-1 py-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-t',
            ]"
            @click="activeTab = 'practitioners'"
            @keydown="onTabKeydown"
          >
            Praticiens
          </button>
          <button
            id="tab-cabinets"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'cabinets'"
            :tabindex="activeTab === 'cabinets' ? 0 : -1"
            aria-controls="panel-cabinets"
            :class="[
              activeTab === 'cabinets'
                ? 'border-[var(--color-primary)] font-bold text-[var(--color-primary)]'
                : 'border-transparent font-medium text-gray-600 hover:border-gray-300 hover:text-gray-800',
              'whitespace-nowrap border-b-2 px-1 py-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-t',
            ]"
            @click="activeTab = 'cabinets'"
            @keydown="onTabKeydown"
          >
            Cabinets
          </button>
        </div>

        <!-- List / Map toggle -->
        <div class="mb-px flex overflow-hidden rounded-lg border border-gray-200 bg-white" role="group" aria-label="Mode d'affichage">
          <button
            type="button"
            :aria-pressed="viewMode === 'list'"
            :class="[
              viewMode === 'list'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-gray-600 hover:bg-gray-50',
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]',
            ]"
            @click="viewMode = 'list'"
          >
            <IconList class="h-4 w-4" aria-hidden="true" />
            Liste
          </button>
          <button
            type="button"
            :aria-pressed="viewMode === 'map'"
            :class="[
              viewMode === 'map'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-gray-600 hover:bg-gray-50',
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]',
            ]"
            @click="viewMode = 'map'"
          >
            <IconMap class="h-4 w-4" aria-hidden="true" />
            Carte
          </button>
        </div>
      </div>

      <!-- ── PRACTITIONERS TAB ── -->
      <div
        v-if="activeTab === 'practitioners'"
        id="panel-practitioners"
        role="tabpanel"
        aria-labelledby="tab-practitioners"
        tabindex="0"
        class="grid gap-6 lg:grid-cols-4 focus:outline-none"
      >
        <!-- Sidebar filters -->
        <aside class="lg:col-span-1">
          <!-- Mobile Filters Toggle Button -->
          <div class="lg:hidden mb-4">
            <button
              type="button"
              aria-controls="filters-panel"
              :aria-expanded="showMobileFilters"
              @click="showMobileFilters = !showMobileFilters"
              class="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <span class="flex items-center gap-2">
                <IconFilter class="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
                Filtrer les résultats
                <span
                  v-if="activeFiltersCount > 0"
                  class="ml-1.5 px-2 py-0.5 text-xs font-bold text-white bg-orange-500 rounded-full font-mono"
                >
                  {{ activeFiltersCount }} <span class="sr-only">filtres actifs</span>
                </span>
              </span>
              <component :is="showMobileFilters ? IconChevronUp : IconChevronDown" class="h-4 w-4 text-gray-500" aria-hidden="true" />
            </button>
          </div>

          <!-- Filters Card -->
          <Card
            id="filters-panel"
            role="region"
            aria-label="Filtres de recherche"
            :class="[
              showMobileFilters ? 'block' : 'hidden lg:block',
              'transition-all duration-300 shadow-sm border border-gray-100 rounded-xl bg-white p-5'
            ]"
          >
            <!-- Title & Reset Button -->
            <div class="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div class="flex items-center gap-2">
                <IconSliders class="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
                <h3 class="text-base font-bold text-gray-900">Filtres</h3>
                <span v-if="activeFiltersCount > 0" class="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 font-mono">
                  {{ activeFiltersCount }}
                  <span class="sr-only">filtres actifs</span>
                </span>
              </div>
              <button
                v-if="activeFiltersCount > 0"
                type="button"
                @click="resetFilters"
                class="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
              >
                <IconRotateCcw class="h-3.5 w-3.5" aria-hidden="true" />
                Effacer
              </button>
            </div>

            <!-- Group 1: Recherche & Localisation -->
            <div class="space-y-4 mb-6">
              <div>
                <label for="filter-search" class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">
                  Mots-clés
                </label>
                <div class="relative">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <IconSearch class="h-4 w-4 text-gray-500" aria-hidden="true" />
                  </div>
                  <input
                    id="filter-search"
                    v-model="filters.search"
                    type="text"
                    placeholder="Nom, bio..."
                    class="block w-full rounded-lg border border-gray-300 py-2 pl-9 pr-8 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-40"
                    @input="debouncedSearch"
                  />
                  <button
                    v-if="filters.search"
                    type="button"
                    aria-label="Effacer les mots-clés"
                    @click="filters.search = ''; searchPractitioners()"
                    class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
                  >
                    <IconX class="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div>
                <label for="filter-city" class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">
                  Localisation
                </label>
                <div class="relative">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <IconMapPin class="h-4 w-4 text-gray-500" aria-hidden="true" />
                  </div>
                  <input
                    id="filter-city"
                    v-model="filters.city"
                    type="text"
                    placeholder="Ville (ex: Cocody...)"
                    class="block w-full rounded-lg border border-gray-300 py-2 pl-9 pr-8 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-40"
                    @input="debouncedSearch"
                  />
                  <button
                    v-if="filters.city"
                    type="button"
                    aria-label="Effacer la localisation"
                    @click="filters.city = ''; searchPractitioners()"
                    class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
                  >
                    <IconX class="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <hr class="border-gray-100 my-4" />

            <!-- Group 2: Spécialité & Cabinet -->
            <div class="space-y-4 mb-6">
              <div>
                <label for="filter-specialty" class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1">
                  <IconStethoscope class="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
                  Spécialité
                </label>
                <select
                  id="filter-specialty"
                  v-model="filters.specialtyId"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                  @change="searchPractitioners"
                >
                  <option value="">Toutes les spécialités</option>
                  <option
                    v-for="specialty in specialties"
                    :key="specialty.id"
                    :value="specialty.id"
                  >
                    {{ specialty.name }}
                  </option>
                </select>
              </div>

              <div>
                <label for="filter-cabinet" class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1">
                  <IconBuilding class="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
                  Cabinet / Clinique
                </label>
                <select
                  id="filter-cabinet"
                  v-model="filters.cabinetId"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                  @change="searchPractitioners"
                >
                  <option value="">Tous les cabinets</option>
                  <option
                    v-for="cabinet in cabinets"
                    :key="cabinet.id"
                    :value="cabinet.id"
                  >
                    {{ cabinet.name }}
                    {{ cabinet.city ? `(${cabinet.city})` : "" }}
                  </option>
                </select>
              </div>
            </div>

            <hr class="border-gray-100 my-4" />

            <!-- Group 3: Disponibilités & Mode -->
            <fieldset class="space-y-3 mb-6">
              <legend class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">
                Services & Options
              </legend>

              <label class="flex cursor-pointer items-center justify-between py-1.5 group select-none focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:ring-offset-1 rounded">
                <span class="flex items-center gap-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  <IconVideo class="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Téléconsultation
                </span>
                <input
                  v-model="filters.teleconsultationEnabled"
                  type="checkbox"
                  class="h-4.5 w-4.5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  @change="searchPractitioners"
                />
              </label>

              <label class="flex cursor-pointer items-center justify-between py-1.5 group select-none focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:ring-offset-1 rounded">
                <span class="flex items-center gap-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  <IconCalendar class="h-4 w-4 text-orange-500" aria-hidden="true" />
                  Disponible aujourd'hui
                </span>
                <input
                  v-model="filters.availableToday"
                  type="checkbox"
                  class="h-4.5 w-4.5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  @change="searchPractitioners"
                />
              </label>

              <label class="flex cursor-pointer items-center justify-between py-1.5 group select-none focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:ring-offset-1 rounded">
                <span class="flex items-center gap-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  <IconCreditCard class="h-4 w-4 text-blue-500" aria-hidden="true" />
                  Accepte l'assurance
                </span>
                <input
                  v-model="filters.acceptsInsurance"
                  type="checkbox"
                  class="h-4.5 w-4.5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  @change="searchPractitioners"
                />
              </label>
            </fieldset>

            <hr class="border-gray-100 my-4" />

            <!-- Group 4: Budget & Notes -->
            <div class="space-y-4">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label for="filter-maxprice" class="block text-xs font-bold uppercase tracking-wider text-gray-600">
                    Tarif consultation max
                  </label>
                  <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 font-mono">
                    {{ filters.maxPrice.toLocaleString() }} XOF
                  </span>
                </div>
                <div class="relative pt-1">
                  <input
                    id="filter-maxprice"
                    v-model.number="filters.maxPrice"
                    type="range"
                    min="0"
                    max="50000"
                    step="5000"
                    :aria-valuetext="`${filters.maxPrice.toLocaleString()} francs CFA maximum`"
                    class="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#00804A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    @input="debouncedSearch"
                  />
                  <div class="mt-1 flex justify-between text-[10px] font-semibold text-gray-500">
                    <span>0 XOF</span>
                    <span>50 000 XOF</span>
                  </div>
                </div>
              </div>

              <div>
                <label for="filter-rating" class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1">
                  <IconStar class="h-3.5 w-3.5 text-yellow-500" aria-hidden="true" />
                  Note minimale
                </label>
                <select
                  id="filter-rating"
                  v-model.number="filters.minRating"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                  @change="searchPractitioners"
                >
                  <option :value="0">Toutes les notes</option>
                  <option :value="3">3+ ⭐ Excellent</option>
                  <option :value="4">4+ ⭐ Remarquable</option>
                  <option :value="4.5">4.5+ ⭐ Exceptionnel</option>
                </select>
              </div>
            </div>
          </Card>
        </aside>

        <!-- Results Area -->
        <div class="lg:col-span-3">
          <!-- MAP VIEW -->
          <div v-if="viewMode === 'map'" class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p class="mb-3 text-sm text-gray-600" role="status" aria-live="polite">
              <template v-if="loading">Chargement...</template>
              <template v-else>
                {{ pagination.total }} praticien{{ pagination.total > 1 ? "s" : "" }} trouvé{{ pagination.total > 1 ? "s" : "" }}
                <span v-if="geoFilters.active" class="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                  <IconLocate class="h-3 w-3" aria-hidden="true" /> Recherche géolocalisée
                </span>
              </template>
            </p>
            <ClientOnly>
              <PractitionersMap
                :practitioners="practitioners"
                :cabinets="cabinets"
                :loading="loading"
                @locate="onMapLocate"
              />
              <template #fallback>
                <div class="flex h-[560px] items-center justify-center rounded-lg bg-gray-100">
                  <p class="text-gray-500">Chargement de la carte...</p>
                </div>
              </template>
            </ClientOnly>
          </div>

          <!-- LIST VIEW -->
          <div v-else>
            <div class="mb-4 flex items-center justify-between">
              <p class="text-gray-600" role="status" aria-live="polite">
                <template v-if="loading">Chargement...</template>
                <template v-else>
                  {{ pagination.total }} praticien{{ pagination.total > 1 ? "s" : "" }}
                  trouvé{{ pagination.total > 1 ? "s" : "" }}
                </template>
              </p>
            </div>

            <div v-if="loading" class="space-y-4" aria-hidden="true">
              <Card v-for="i in 3" :key="i" class="animate-pulse">
                <div class="flex gap-6">
                  <div class="h-24 w-24 flex-shrink-0 rounded-full bg-gray-200" />
                  <div class="flex-1 space-y-3">
                    <div class="h-4 w-1/3 rounded bg-gray-200" />
                    <div class="h-3 w-1/4 rounded bg-gray-200" />
                    <div class="flex gap-2">
                      <div class="h-6 w-20 rounded-full bg-gray-200" />
                      <div class="h-6 w-20 rounded-full bg-gray-200" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div v-else-if="practitioners.length === 0" class="py-12 text-center">
              <p class="text-lg text-gray-600">
                Aucun praticien trouvé avec ces critères.
              </p>
            </div>

            <div v-else class="space-y-4">
              <Card
                v-for="practitioner in practitioners"
                :key="practitioner.id"
                class="transition-shadow hover:shadow-lg"
              >
                <div class="flex gap-6">
                  <div
                    class="h-24 w-24 flex-shrink-0 overflow-hidden rounded-full bg-gray-200"
                  >
                    <img
                      v-if="practitioner.photo"
                      :src="practitioner.photo"
                      :alt="`${practitioner.title} ${practitioner.firstName} ${practitioner.lastName}`"
                      class="h-full w-full object-cover"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-500"
                    >
                      {{ practitioner.firstName.charAt(0)
                      }}{{ practitioner.lastName.charAt(0) }}
                    </div>
                  </div>

                  <div class="flex-1">
                    <div class="mb-2 flex items-start justify-between">
                      <div>
                        <h3 class="mb-1 text-xl font-semibold">
                          {{ practitioner.title }} {{ practitioner.firstName }}
                          {{ practitioner.lastName }}
                        </h3>
                        <p class="text-gray-600 font-sans">
                          {{ practitioner.specialties[0]?.name || "Généraliste" }}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="text-xl font-medium text-[var(--color-primary)]">
                          {{ practitioner.baseConsultationFee.toLocaleString() }}
                          FCFA
                        </p>
                      </div>
                    </div>

                    <div class="mb-3 flex items-center gap-4">
                      <div
                        v-if="practitioner.averageRating"
                        class="flex items-center gap-1"
                      >
                        <IconStar class="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                        <span class="font-medium">{{ practitioner.averageRating }}</span>
                        <span class="sr-only">étoiles sur 5,</span>
                        <span class="text-sm text-gray-600 font-sans">({{ practitioner.totalReviews }}<span class="sr-only">&nbsp;avis</span>)</span>
                      </div>
                      <div class="flex items-center gap-1 text-sm text-gray-600">
                        <IconMapPin class="h-4 w-4" aria-hidden="true" />
                        {{ practitioner.city }}
                      </div>
                    </div>

                    <div class="mb-4 flex flex-wrap gap-2">
                      <Badge v-if="practitioner.teleconsultationEnabled" variant="success">
                        Téléconsultation
                      </Badge>
                      <Badge v-if="practitioner.availableToday" variant="warning">
                        Disponible aujourd'hui
                      </Badge>
                      <Badge v-if="practitioner.acceptsInsurance" variant="primary">
                        Accepte l'assurance
                      </Badge>
                    </div>

                    <div class="flex gap-3">
                      <Button
                        variant="secondary"
                        @click="navigateTo(`/practitioner/${practitioner.id}`)"
                      >
                        Voir le profil
                      </Button>
                      <Button @click="handleReserve(practitioner)">
                        Réserver
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <nav
              v-if="pagination.totalPages > 1"
              class="mt-6 flex justify-center gap-2"
              aria-label="Pagination des résultats"
            >
              <Button
                variant="outline"
                :disabled="pagination.page === 1"
                aria-label="Page précédente"
                @click="changePage(pagination.page - 1)"
              >
                Précédent
              </Button>
              <span class="flex items-center px-4 text-sm text-gray-600 font-sans" aria-current="page" aria-live="polite">
                Page {{ pagination.page }} sur {{ pagination.totalPages }}
              </span>
              <Button
                variant="outline"
                :disabled="pagination.page === pagination.totalPages"
                aria-label="Page suivante"
                @click="changePage(pagination.page + 1)"
              >
                Suivant
              </Button>
            </nav>
          </div>
        </div>
      </div>

      <!-- ── CABINETS TAB ── -->
      <div
        v-else
        id="panel-cabinets"
        role="tabpanel"
        aria-labelledby="tab-cabinets"
        tabindex="0"
        class="focus:outline-none"
      >
        <!-- MAP VIEW -->
        <div v-if="viewMode === 'map'" class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p class="mb-3 text-sm text-gray-600" role="status" aria-live="polite">
            {{ cabinets.length }} cabinet{{ cabinets.length > 1 ? "s" : "" }}
            trouvé{{ cabinets.length > 1 ? "s" : "" }}
          </p>
          <ClientOnly>
            <PractitionersMap
              :practitioners="[]"
              :cabinets="cabinets"
              :loading="loading"
              @locate="onMapLocate"
            />
            <template #fallback>
              <div class="flex h-[560px] items-center justify-center rounded-lg bg-gray-100">
                <p class="text-gray-500">Chargement de la carte...</p>
              </div>
            </template>
          </ClientOnly>
        </div>

        <!-- LIST VIEW -->
        <div v-else class="space-y-4">
          <div class="mb-4 flex items-center justify-between">
            <p class="text-gray-600" role="status" aria-live="polite">
              {{ cabinets.length }} cabinet{{ cabinets.length > 1 ? "s" : "" }}
              trouvé{{ cabinets.length > 1 ? "s" : "" }}
            </p>
          </div>

          <div v-if="cabinets.length === 0" class="py-12 text-center">
            <p class="text-lg text-gray-600">Aucun cabinet trouvé.</p>
          </div>

          <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card
              v-for="cabinet in cabinets"
              :key="cabinet.id"
              class="flex flex-col justify-between transition-shadow hover:shadow-lg"
            >
              <div>
                <h3 class="mb-2 text-xl font-semibold">{{ cabinet.name }}</h3>
                <div class="mb-2 flex items-center gap-1 text-sm text-gray-600">
                  <IconMapPin class="h-4 w-4" aria-hidden="true" />
                  {{ cabinet.city || "Ville non renseignée" }}
                </div>
                <p class="mb-4 text-sm text-gray-500">
                  {{ cabinet.address || "" }}
                </p>
              </div>

              <div
                class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4"
              >
                <span class="text-sm font-medium text-gray-600">
                  {{ cabinet.practitionersCount }} praticien{{
                    cabinet.practitionersCount > 1 ? "s" : ""
                  }}
                </span>
                <Button
                  variant="outline"
                  @click="navigateTo(`/cabinet/${cabinet.id}`)"
                >
                  Voir le cabinet
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from "vue";
import {
  Search as IconSearch,
  Filter as IconFilter,
  Star as IconStar,
  MapPin as IconMapPin,
  List as IconList,
  Map as IconMap,
  Locate as IconLocate,
  RotateCcw as IconRotateCcw,
  Stethoscope as IconStethoscope,
  Building as IconBuilding,
  CreditCard as IconCreditCard,
  Video as IconVideo,
  X as IconX,
  ChevronDown as IconChevronDown,
  ChevronUp as IconChevronUp,
  SlidersHorizontal as IconSliders,
  Calendar as IconCalendar,
} from "lucide-vue-next";
import Card from "~/components/ui/Card.vue";
import Button from "~/components/ui/Button.vue";
import Badge from "~/components/ui/Badge.vue";

const config = useRuntimeConfig();
const route = useRoute();
const { trackEvent } = useAnalytics();

interface Specialty {
  id: string;
  name: string;
  description?: string;
}

interface Cabinet {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  practitionersCount: number;
  latitude?: number | null;
  longitude?: number | null;
}

interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  photo?: string;
  city: string;
  baseConsultationFee: number;
  teleconsultationFee: number | null;
  teleconsultationEnabled: boolean;
  averageRating: number | null;
  totalReviews: number;
  acceptsInsurance: boolean;
  availableToday?: boolean;
  latitude: number | null;
  longitude: number | null;
  specialties: Array<{ id: string; name: string; isPrimary: boolean }>;
  cabinets: Array<{ id: string; name: string; city?: string | null }>;
}

const activeTab = ref<"practitioners" | "cabinets">("practitioners");
const viewMode = ref<"list" | "map">("list");

// Accessible tab navigation (ARIA APG pattern: arrow keys move focus between tabs)
const TABS = ["practitioners", "cabinets"] as const;
const focusTab = (name: "practitioners" | "cabinets") => {
  activeTab.value = name;
  void nextTick(() => document.getElementById(`tab-${name}`)?.focus());
};
const onTabKeydown = (e: KeyboardEvent) => {
  const idx = TABS.indexOf(activeTab.value);
  if (e.key === "ArrowRight") {
    e.preventDefault();
    focusTab(idx === TABS.length - 1 ? TABS[0] : TABS[idx + 1]!);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    focusTab(idx <= 0 ? TABS[TABS.length - 1]! : TABS[idx - 1]!);
  } else if (e.key === "Home") {
    e.preventDefault();
    focusTab(TABS[0]);
  } else if (e.key === "End") {
    e.preventDefault();
    focusTab(TABS[TABS.length - 1]!);
  }
};
const showMobileFilters = ref(false);

const filters = reactive({
  search: "",
  specialtyId: "",
  cabinetId: "",
  city: "",
  teleconsultationEnabled: false,
  availableToday: false,
  acceptsInsurance: false,
  minPrice: 0,
  maxPrice: 50000,
  minRating: 0,
  page: 1,
  limit: 20,
});

const geoFilters = reactive({
  active: false,
  latitude: 0,
  longitude: 0,
  radiusKm: 10,
});

const practitioners = ref<Practitioner[]>([]);
const specialties = ref<Specialty[]>([]);
const cabinets = ref<Cabinet[]>([]);
const loading = ref(false);
const pagination = reactive({
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
});

const hasSearchCriteria = () => {
  return Boolean(
    filters.search.trim() ||
      filters.city.trim() ||
      filters.specialtyId ||
      filters.cabinetId ||
      geoFilters.active,
  );
};

const trackSearchSubmitted = () => {
  if (hasSearchCriteria()) {
    trackEvent("search_submitted");
  }
};

const activeFiltersCount = computed(() => {
  let count = 0;
  if (filters.search.trim() !== "") count++;
  if (filters.specialtyId !== "") count++;
  if (filters.cabinetId !== "") count++;
  if (filters.city.trim() !== "") count++;
  if (filters.teleconsultationEnabled) count++;
  if (filters.availableToday) count++;
  if (filters.acceptsInsurance) count++;
  if (filters.maxPrice !== 50000) count++;
  if (filters.minRating !== 0) count++;
  return count;
});

const resetFilters = () => {
  filters.search = "";
  filters.specialtyId = "";
  filters.cabinetId = "";
  filters.city = "";
  filters.teleconsultationEnabled = false;
  filters.availableToday = false;
  filters.acceptsInsurance = false;
  filters.minPrice = 0;
  filters.maxPrice = 50000;
  filters.minRating = 0;
  filters.page = 1;
  geoFilters.active = false;
  navigateTo({ path: "/search" });
  searchPractitioners();
};

let debounceTimeout: NodeJS.Timeout | null = null;

const debouncedSearch = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => searchPractitioners(), 500);
};

const searchPractitioners = async () => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams();

    let activeSearch = filters.search;
    let activeSpecialtyId = filters.specialtyId;

    if (activeSearch) {
      const trimmed = activeSearch.trim();
      const matchedSpecialty = specialties.value.find(
        (s) => s.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (matchedSpecialty) {
        activeSpecialtyId = matchedSpecialty.id;
        activeSearch = "";
      }
    }

    if (activeSearch) queryParams.append("search", activeSearch);
    if (activeSpecialtyId) queryParams.append("specialtyId", activeSpecialtyId);
    if (filters.cabinetId) queryParams.append("cabinetId", filters.cabinetId);
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.teleconsultationEnabled)
      queryParams.append("teleconsultationEnabled", "true");
    if (filters.availableToday) queryParams.append("availableToday", "true");
    if (filters.acceptsInsurance) queryParams.append("acceptsInsurance", "true");
    if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice.toString());
    if (filters.minRating) queryParams.append("minRating", filters.minRating.toString());
    queryParams.append("page", filters.page.toString());
    queryParams.append("limit", filters.limit.toString());

    if (geoFilters.active) {
      queryParams.append("latitude", geoFilters.latitude.toString());
      queryParams.append("longitude", geoFilters.longitude.toString());
      queryParams.append("radiusKm", geoFilters.radiusKm.toString());
    }

    const response = await $fetch<{
      success: boolean;
      data: Practitioner[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/practitioners/search?${queryParams.toString()}`, {
      baseURL: config.public.apiBase,
    });

    if (response.success) {
      practitioners.value = response.data;
      pagination.total = response.pagination.total;
      pagination.page = response.pagination.page;
      pagination.limit = response.pagination.limit;
      pagination.totalPages = response.pagination.totalPages;
    }
  } catch (error) {
    console.error("Error searching practitioners:", error);
  } finally {
    loading.value = false;
  }
};

const onMapLocate = (lat: number, lng: number, radius: number) => {
  geoFilters.active = true;
  geoFilters.latitude = lat;
  geoFilters.longitude = lng;
  geoFilters.radiusKm = radius;
  filters.page = 1;
  void searchPractitioners().then(() => trackSearchSubmitted());
};

const loadSpecialties = async () => {
  try {
    const response = await $fetch<{ success: boolean; data: Specialty[] }>(
      "/practitioners/specialties",
      { baseURL: config.public.apiBase },
    );
    if (response.success) specialties.value = response.data;
  } catch (error) {
    console.error("Error loading specialties:", error);
  }
};

const loadCabinets = async () => {
  try {
    const response = await $fetch<{ success: boolean; data: Cabinet[] }>(
      "/practitioners/cabinets",
      { baseURL: config.public.apiBase },
    );
    if (response.success) cabinets.value = response.data;
  } catch (error) {
    console.error("Error loading cabinets:", error);
  }
};

const changePage = (page: number) => {
  filters.page = page;
  searchPractitioners();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const handleReserve = (practitioner: Practitioner) => {
  navigateTo(`/practitioner/${practitioner.id}`);
};

const applyFiltersFromQuery = () => {
  const query = route.query;

  if (query.search) {
    const searchTerm = String(query.search).trim();
    const matchedSpecialty = specialties.value.find(
      (s) => s.name.toLowerCase() === searchTerm.toLowerCase()
    );
    if (matchedSpecialty) {
      filters.specialtyId = matchedSpecialty.id;
      filters.search = "";
    } else {
      filters.search = searchTerm;
      filters.specialtyId = "";
    }
  } else {
    filters.search = "";
  }

  if (query.specialtyId) {
    filters.specialtyId = String(query.specialtyId);
  }

  if (query.city) {
    filters.city = String(query.city);
  } else {
    filters.city = "";
  }
};

onMounted(async () => {
  loading.value = true;
  await Promise.all([loadSpecialties(), loadCabinets()]);
  applyFiltersFromQuery();
  await searchPractitioners();
  trackSearchSubmitted();
});

watch(
  () => route.query,
  async () => {
    applyFiltersFromQuery();
    await searchPractitioners();
    trackSearchSubmitted();
  }
);

definePageMeta({
  layout: "default",
});
</script>
