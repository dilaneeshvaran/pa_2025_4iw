<template>
  <div class="bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-4xl bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
      <div class="mb-8">
        <BackToHome />
      </div>

      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Mentions Légales
      </h1>

      <p class="text-gray-500 dark:text-gray-400 text-sm mb-8">
        Dernière mise à jour : 21 juin 2026
      </p>

      <div class="prose max-w-none text-gray-600 dark:text-gray-400 space-y-6">
        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
            1. Éditeur de la Plateforme
          </h2>
          <p class="leading-relaxed">
            La plateforme <strong>MediCôte</strong> est un projet étudiant réalisé dans le cadre de l'évaluation annuelle de la 4ème année d'Ingénierie du Web (4IW) à l'<strong>ESGI (École Supérieure de Génie Informatique)</strong>, année universitaire 2025-2026.
          </p>
          <p class="leading-relaxed">
            <strong>Équipe de réalisation :</strong> Les étudiants de la filière 4IW de l'ESGI Paris.<br />
            <strong>Directeur de la publication :</strong> Dilan, en qualité de chef de projet étudiant.<br />
            <strong>Contact :</strong> <a href="mailto:contact@medicote.ci" class="text-orange-500 underline hover:text-orange-600">contact@medicote.ci</a><br />
            <strong>Adresse académique :</strong> ESGI Paris, 242 Rue du Faubourg Saint-Antoine, 75012 Paris, France.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
            2. Hébergement
          </h2>
          <p class="leading-relaxed">
            Cette plateforme est hébergée à des fins académiques d'évaluation sur un serveur VPS privé sécurisé et configuré par l'équipe étudiante du projet MediCôte.
          </p>
          <p class="leading-relaxed">
            <strong>Nom de l'hébergeur :</strong> Hébergement Académique ESGI (ou VPS Privé d'évaluation).<br />
            <strong>Adresse de l'hébergeur :</strong> 242 Rue du Faubourg Saint-Antoine, 75012 Paris, France.<br />
            <strong>Téléphone de l'hébergeur :</strong> +33 1 56 07 80 00.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
            3. Protection des Données et Déclaration ARTCI
          </h2>
          <p class="leading-relaxed">
            MediCôte est conçu pour respecter la législation relative à la protection des données à caractère personnel :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Législation ivoirienne :</strong> Conformément à la loi n° 2013-450 relative à la protection des données à caractère personnel de la République de Côte d'Ivoire, les traitements de données effectués dans le cadre de ce projet étudiant sont déclarés à des fins de simulation auprès de l'<strong>ARTCI</strong> (Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire).</li>
            <li><strong>Règlement Général sur la Protection des Données (RGPD) :</strong> Les utilisateurs de la plateforme bénéficient de droits d'accès, de rectification, de portabilité et de suppression de leurs données, qu'ils peuvent exercer directement depuis les paramètres de leur compte.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
            4. Propriété Intellectuelle
          </h2>
          <p class="leading-relaxed">
            L'ensemble des contenus de la plateforme (textes, logos, icônes, animations, chartes graphiques, structure générale de l'application) est la propriété intellectuelle exclusive des auteurs du projet étudiant MediCôte, sous réserve des droits de licence des frameworks et dépendances open-source utilisés (notamment Vue/Nuxt, TailwindCSS, Fastify, Prisma, Lucide-Vue-Next).
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
            5. Limitation de Responsabilité et Avertissement Pédagogique
          </h2>
          <p class="leading-relaxed">
            <strong>NOTE IMPORTANTE :</strong> MediCôte est un projet exclusivement pédagogique et d'évaluation universitaire. Il ne s'agit pas d'un service commercial ou d'une plateforme de santé opérationnelle en conditions réelles pour le public.
          </p>
          <p class="leading-relaxed">
            Aucune transaction financière réelle n'est effectuée sur ce site (les paiements Mobile Money et cartes bancaires sont fictifs et simulés). Aucun acte médical réel n'est prescrit et aucun rendez-vous pris n'engage de véritables praticiens. Les auteurs du projet déclinent toute responsabilité en cas d'utilisation abusive de la plateforme en dehors du cadre d'évaluation pédagogique.
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
