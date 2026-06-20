<template>
  <div class="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-4xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div class="mb-8">
        <BackToHome />
      </div>

      <h1 class="text-4xl font-bold text-gray-900 mb-6">
        Conditions Générales d'Utilisation (CGU)
      </h1>

      <p class="text-gray-500 text-sm mb-8">
        Dernière mise à jour : 20 juin 2026
      </p>

      <div class="prose max-w-none text-gray-600 space-y-6">
        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            1. Objet du Service
          </h2>
          <p class="leading-relaxed">
            MediCote fournit une plateforme numérique de mise en relation entre patients et praticiens de santé en Côte d'Ivoire. Elle permet la recherche de professionnels par spécialité et localisation, la prise de rendez-vous en ligne, le suivi du dossier de santé, la messagerie sécurisée, ainsi que des consultations de télémédecine (téléconsultations).
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            2. Inscription et Vérification des Comptes
          </h2>
          <p class="leading-relaxed">
            Pour accéder aux services de MediCote, l'inscription est obligatoire :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Compte Patient :</strong> Accessible à toute personne physique majeure. Les données fournies doivent être exactes.</li>
            <li><strong>Compte Praticien :</strong> Soumis à une validation administrative obligatoire. MediCote procède à la vérification de l'inscription à l'Ordre National correspondant (Médecins, Pharmaciens, Chirurgiens-Dentistes) et des diplômes d'état avant l'activation du compte.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            3. Règles de Prise de Rendez-vous et de Télémédecine
          </h2>
          <p class="leading-relaxed">
            La prise de rendez-vous en ligne engage les deux parties :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Réservation de créneau :</strong> Lorsqu'un patient commence une réservation, le créneau horaire est bloqué temporairement pendant 10 minutes pour lui permettre de finaliser l'action.</li>
            <li><strong>Annulation :</strong> Tout rendez-vous peut être annulé par le patient ou le praticien selon les délais fixés par le cabinet (habituellement 24h avant).</li>
            <li><strong>Télémédecine :</strong> Les téléconsultations ne doivent pas être utilisées pour des situations d'urgence médicale grave. En cas d'urgence, l'utilisateur doit contacter immédiatement les services d'urgence locaux (SAMU Côte d'Ivoire).</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            4. Conditions de Paiement et Tarifs
          </h2>
          <p class="leading-relaxed">
            Les tarifs des consultations sont définis librement par les praticiens ou leurs cabinets, dans le respect de la réglementation locale :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li>La devise de référence de la plateforme est le Franc CFA (XOF).</li>
            <li>Les paiements sur la plateforme peuvent être exécutés par carte bancaire ou par Mobile Money (Orange Money, MTN MoMo, Moov Money) selon les modalités d'intégration disponibles.</li>
            <li>Une facture est automatiquement générée et mise à disposition dans l'espace personnel du patient après chaque consultation ou téléconsultation.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            5. Responsabilité
          </h2>
          <p class="leading-relaxed">
            MediCote agit en qualité d'intermédiaire technique. Les diagnostics, prescriptions, et soins sont de la responsabilité exclusive des praticiens de santé inscrits. MediCote ne saurait être tenu pour responsable en cas de litige médical, d'absence du praticien ou d'évaluation erronée lors d'une consultation.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            6. Modification des Conditions
          </h2>
          <p class="leading-relaxed">
            MediCote se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications substantielles et devront les accepter lors de leur connexion suivante.
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
