<template>
  <div class="bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-4xl bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
      <div class="mb-8">
        <BackToHome />
      </div>

      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Conditions Générales d'Utilisation (CGU)
      </h1>

      <p class="text-gray-500 dark:text-gray-400 text-sm mb-8">
        Dernière mise à jour : 21 juin 2026
      </p>

      <div class="prose max-w-none text-gray-600 dark:text-gray-400 space-y-6">
        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
            1. Objet du Service
          </h2>
          <p class="leading-relaxed">
            La plateforme <strong>MediCôte</strong> est un service numérique de mise en relation entre patients et praticiens de santé en Côte d'Ivoire. Elle propose notamment la recherche de professionnels par spécialité et par zone géographique, la prise de rendez-vous en ligne, le suivi du dossier médical partagé (DMP), un système de messagerie sécurisée interne, ainsi que des consultations à distance par visioconférence (téléconsultation).
          </p>
          <p class="leading-relaxed">
            Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités d'accès et d'utilisation de la plateforme par les Patients et les Praticiens. L'accès ou l'utilisation de la plateforme implique l'acceptation sans réserve des présentes CGU.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
            2. Inscription et Vérification des Comptes
          </h2>
          <p class="leading-relaxed">
            Pour pouvoir utiliser les services de MediCôte, la création d'un compte utilisateur est requise :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li>
              <strong>Compte Patient :</strong> L'inscription est ouverte à toute personne physique majeure. Le Patient s'engage à fournir des informations d'identification exactes, sincères et à jour.
            </li>
            <li>
              <strong>Compte Praticien :</strong> L'accès est strictement réservé aux professionnels de santé légalement autorisés à exercer en Côte d'Ivoire. Chaque inscription de Praticien fait l'objet d'une validation administrative manuelle et obligatoire par les administrateurs de la plateforme, incluant la vérification de l'inscription à l'Ordre National correspondant (Médecins, Chirurgiens-Dentistes, Pharmaciens, etc.) et des diplômes d'état certifiés.
            </li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
            3. Règles de Prise de Rendez-vous et de Télémédecine
          </h2>
          <p class="leading-relaxed">
            La prise de rendez-vous en ligne sur MediCôte est soumise aux règles suivantes :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li>
              <strong>Verrouillage temporaire des créneaux :</strong> Afin d'éviter les réservations simultanées conflictuelles, lorsqu'un patient initie une réservation de créneau, celui-ci est temporairement bloqué pendant une durée de 10 minutes dans le cache Redis pour lui permettre de finaliser son rendez-vous. Au-delà de ce délai, le créneau est automatiquement libéré.
            </li>
            <li>
              <strong>Annulation :</strong> Les rendez-vous peuvent être annulés par le Patient ou le Praticien. Les règles d'annulation tardive sont fixées librement par chaque cabinet médical.
            </li>
            <li>
              <strong>Limites de la Téléconsultation :</strong> La téléconsultation n'est pas un service d'urgence médicale. En cas d'urgence vitale ou de dégradation rapide de l'état de santé, l'utilisateur doit composer immédiatement les numéros d'urgence de Côte d'Ivoire (ex: le 185 pour le SAMU, ou le 180 pour les Sapeurs-Pompiers).
            </li>
            <li>
              <strong>Conditions de déroulement :</strong> Pour une téléconsultation de qualité, le Patient s'engage à se situer dans un endroit calme, suffisamment éclairé, confidentiel et disposant d'une connexion internet stable.
            </li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
            4. Conditions Financières, Tarifs et Facturation
          </h2>
          <p class="leading-relaxed">
            Les tarifs des consultations et des actes médicaux sont définis librement par les Praticiens ou par les cabinets médicaux qui les emploient, conformément aux usages de la profession et aux réglementations en vigueur :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li>
              <strong>Devise :</strong> La devise officielle de facturation de la plateforme est le Franc CFA (XOF).
            </li>
            <li>
              <strong>Modes de Paiement :</strong> Les règlements s'effectuent de façon sécurisée directement via la plateforme par carte bancaire ou par Mobile Money (Orange Money, MTN MoMo, Moov Money) selon les protocoles d'intégration applicables.
            </li>
            <li>
              <strong>Facturation :</strong> Une facture électronique est automatiquement générée et mise à disposition dans l'espace personnel du Patient après chaque consultation ou téléconsultation.
            </li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
            5. Responsabilité et Déontologie
          </h2>
          <p class="leading-relaxed">
            <strong>Rôle d'intermédiaire :</strong> MediCôte agit en tant qu'intermédiaire technique de mise en relation. L'éditeur ne fournit aucun acte de soin, aucun diagnostic, et ne participe pas aux décisions thérapeutiques.
          </p>
          <p class="leading-relaxed">
            <strong>Responsabilité Médicale :</strong> Les diagnostics, prescriptions, ordonnances, et la qualité des soins dispensés relèvent de la responsabilité exclusive et entière du Praticien de santé, dans le respect de ses obligations déontologiques et de son assurance responsabilité civile professionnelle.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
            6. Propriété Intellectuelle
          </h2>
          <p class="leading-relaxed">
            Tous les droits de propriété intellectuelle portant sur la structure générale de la plateforme MediCôte, les designs, marques, logos, bases de données, codes et interfaces logicielles sont détenus par l'éditeur ou ses concédants de licence. Toute modification, reproduction, copie, ou exploitation non autorisée du site fera l'objet de poursuites judiciaires.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
            7. Modifications des Conditions Générales
          </h2>
          <p class="leading-relaxed">
            L'éditeur se réserve le droit de modifier les présentes CGU à tout moment afin de les adapter aux évolutions techniques ou réglementaires de la plateforme. Les utilisateurs seront informés de toute modification substantielle et devront les accepter expressément lors de leur connexion suivante pour pouvoir continuer à utiliser les services.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
            8. Droit Applicable et Juridiction Compétente
          </h2>
          <p class="leading-relaxed">
            Les présentes CGU sont soumises à la législation de la République de Côte d'Ivoire. Tout litige relatif à leur validité, leur interprétation ou leur exécution qui ne pourrait être résolu de manière amiable sera porté devant les tribunaux compétents d'Abidjan, Côte d'Ivoire.
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
