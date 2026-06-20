<template>
  <div class="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-4xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div class="mb-8">
        <BackToHome />
      </div>

      <h1 class="text-4xl font-bold text-gray-900 mb-6">
        Mentions Légales
      </h1>

      <p class="text-gray-500 text-sm mb-8">
        Dernière mise à jour : 20 juin 2026
      </p>

      <div class="prose max-w-none text-gray-600 space-y-6">
        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            1. Éditeur de la Plateforme
          </h2>
          <p class="leading-relaxed">
            La plateforme <strong>MediCôte</strong> est un projet étudiant réalisé dans le cadre de l'évaluation annuelle de la 4ème année d'Ingénierie du Web (4IW) à l'<strong>ESGI (École Supérieure de Génie Informatique)</strong>, année universitaire 2025-2026.
          </p>
          <p class="leading-relaxed">
            <strong>Responsables du projet :</strong> L'équipe étudiante de MediCôte.<br />
            <strong>Contact Académique :</strong> ESGI Paris, 242 Rue du Faubourg Saint-Antoine, 75012 Paris, France.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            2. Hébergement
          </h2>
          <p class="leading-relaxed">
            Ce site est hébergé à des fins académiques :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Hébergeur :</strong> Infrastructure d'évaluation de l'école ou serveur VPS privé configuré par les étudiants.</li>
            <li><strong>Sécurité :</strong> Les flux d'informations et accès aux dossiers médicaux sont sécurisés et restreints selon les protocoles de chiffrement documentés du projet.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            3. Propriété Intellectuelle
          </h2>
          <p class="leading-relaxed">
            L'ensemble des contenus de la plateforme (textes, logos, icônes, animations, structure générale de l'application) est la propriété intellectuelle exclusive des auteurs du projet étudiant MediCôte, sous réserve des droits de licence des frameworks et dépendances open-source utilisés (Vue/Nuxt, TailwindCSS, Fastify).
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            4. Absence d'activité commerciale
          </h2>
          <p class="leading-relaxed">
            <strong>NOTE IMPORTANTE :</strong> MediCôte est un projet pédagogique et d'évaluation. Il ne s'agit pas d'un service commercial ou d'une plateforme de santé opérationnelle en production réelle pour le grand public. Aucune transaction financière réelle n'est effectuée sur ce site et aucun acte médical réel n'y est prescrit.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BackToHome from "~/components/ui/BackToHome.vue";

definePageMeta({
  layout: "default",
});
</script>
