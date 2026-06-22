<template>
  <footer class="border-t border-gray-200 bg-gray-50 text-gray-600" aria-labelledby="footer-heading">
    <h2 id="footer-heading" class="sr-only">Pied de page</h2>
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="xl:grid xl:grid-cols-3 xl:gap-8">
        <div class="space-y-6">
          <NuxtLink
            :to="brandTarget"
            class="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
              <Heart class="h-6 w-6 text-white" />
            </div>
            <span class="text-xl font-bold text-gray-900">
              <span class="text-orange-500">Medi</span><span class="text-green-600">côte</span>
            </span>
          </NuxtLink>
          <p class="max-w-md text-sm text-gray-500 leading-relaxed">
            « À côté des patients, nous sommes là à vos côtés »<br />
            Votre plateforme de confiance pour la prise de rendez-vous médicaux et la téléconsultation en Côte d'Ivoire.
          </p>
          <div class="flex space-x-6">
            <a href="#" class="text-gray-400 hover:text-orange-500" aria-label="Facebook">
              <span class="sr-only">Facebook</span>
              <Facebook class="h-5 w-5" />
            </a>
            <a href="#" class="text-gray-400 hover:text-orange-500" aria-label="Twitter">
              <span class="sr-only">Twitter</span>
              <Twitter class="h-5 w-5" />
            </a>
            <a href="#" class="text-gray-400 hover:text-orange-500" aria-label="LinkedIn">
              <span class="sr-only">LinkedIn</span>
              <Linkedin class="h-5 w-5" />
            </a>
          </div>
        </div>

        <div class="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
          <div class="md:grid md:grid-cols-2 md:gap-8">
            <div>
              <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Services
              </h3>
              <ul role="list" class="mt-4 space-y-3">
                <li>
                  <NuxtLink to="/" class="text-sm text-gray-500 hover:text-orange-500 transition-colors">
                    Accueil
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/search" class="text-sm text-gray-500 hover:text-orange-500 transition-colors">
                    Rechercher un médecin
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/contact/practitioner" class="text-sm text-gray-500 hover:text-orange-500 transition-colors">
                    Espace Praticien
                  </NuxtLink>
                </li>
              </ul>
            </div>
            <div class="mt-12 md:mt-0">
              <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Légal
              </h3>
              <ul role="list" class="mt-4 space-y-3">
                <li>
                  <NuxtLink to="/legal/mentions" class="text-sm text-gray-500 hover:text-orange-500 transition-colors">
                    Mentions légales
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/legal/privacy" class="text-sm text-gray-500 hover:text-orange-500 transition-colors">
                    Politique de confidentialité
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/legal/terms" class="text-sm text-gray-500 hover:text-orange-500 transition-colors">
                    Conditions Générales (CGU)
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Contact & Support
            </h3>
            <ul role="list" class="mt-4 space-y-3 text-sm text-gray-500">
              <li class="flex items-start gap-2.5">
                <MapPin class="h-5 w-5 shrink-0 text-orange-500" />
                <span>Cocody, Boulevard Hassan II, Abidjan, Côte d'Ivoire</span>
              </li>
              <li class="flex items-center gap-2.5">
                <Mail class="h-5 w-5 shrink-0 text-orange-500" />
                <a href="mailto:support@medicote.ci" class="hover:text-orange-500 transition-colors">
                  support@medicote.ci
                </a>
              </li>
              <li class="flex items-center gap-2.5">
                <Phone class="h-5 w-5 shrink-0 text-orange-500" />
                <a href="tel:+2250700000000" class="hover:text-orange-500 transition-colors">
                  +225 07 00 00 00 00
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="mt-12 border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-xs text-gray-400">
          &copy; {{ new Date().getFullYear() }} MediCôte. Tous droits réservés. Projet académique ESGI.
        </p>
        <p class="text-xs text-gray-400 flex items-center gap-1">
          Fait avec <span class="text-red-500">❤️</span> pour la Côte d'Ivoire
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Heart, MapPin, Mail, Phone, Facebook, Twitter, Linkedin } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'
import { getDashboardPath } from '~/utils/authNavigation'

const authStore = useAuthStore()
const brandTarget = computed(() =>
  authStore.isAuthenticated ? getDashboardPath(authStore.user?.role) : '/',
)
</script>
