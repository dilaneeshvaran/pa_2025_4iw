<template>
  <div class="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-4xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div class="mb-8">
        <BackToHome />
      </div>

      <h1 class="text-4xl font-bold text-gray-900 mb-6">
        Politique de Confidentialité
      </h1>

      <p class="text-gray-500 text-sm mb-8">
        Dernière mise à jour : 20 juin 2026
      </p>

      <div class="prose max-w-none text-gray-600 space-y-6">
        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            1. Introduction
          </h2>
          <p class="leading-relaxed">
            MediCote est particulièrement soucieux du respect de la vie privée et de la protection des données à caractère personnel de ses utilisateurs. Nous nous engageons à traiter les données de santé et les données personnelles conformément à la réglementation applicable en Côte d'Ivoire (notamment les directives de l'ARTCI) et aux meilleures pratiques internationales, y compris le Règlement Général sur la Protection des Données (RGPD).
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            2. Données collectées
          </h2>
          <p class="leading-relaxed">
            Dans le cadre de l'utilisation de la plateforme MediCote, nous collectons les types d'informations suivants :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li>
              <strong>Données d'identification :</strong> Nom, prénom, adresse e-mail, numéro de téléphone, date de naissance, genre.
            </li>
            <li>
              <strong>Données de santé (hautement sensibles) :</strong> Motifs de consultation, antécédents médicaux déclarés, documents de santé (ordonnances, comptes rendus d'examens), notes cliniques du praticien.
            </li>
            <li>
              <strong>Données de connexion et techniques :</strong> Adresses IP anonymisées, logs système et de sécurité.
            </li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            3. Finalités du traitement
          </h2>
          <p class="leading-relaxed">
            Vos données personnelles sont traitées pour les finalités suivantes :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li>Mise en relation et gestion des rendez-vous entre patients et praticiens.</li>
            <li>Fourniture de services de téléconsultation par visioconférence sécurisée.</li>
            <li>Constitution et partage sécurisé du dossier médical partagé.</li>
            <li>Gestion des factures et des transactions financières (XOF).</li>
            <li>Envoi de notifications importantes concernant vos rendez-vous (SMS, e-mails).</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            4. Sécurité et Confidentialité
          </h2>
          <p class="leading-relaxed">
            Nous appliquons les mesures techniques et organisationnelles les plus strictes pour garantir un niveau de sécurité adapté au risque :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li>Chiffrement fort (AES-256-GCM) des données sensibles et de santé stockées dans nos bases.</li>
            <li>Protocoles TLS sécurisés pour l'intégralité des flux réseau.</li>
            <li>Hébergement des données de santé séparé et soumis à un contrôle strict des accès.</li>
            <li>Journalisation d'audit complète de chaque accès ou modification des données de santé.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            5. Vos Droits
          </h2>
          <p class="leading-relaxed">
            Conformément au RGPD et à la législation ivoirienne, vous disposez des droits suivants sur vos données :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Droit d'accès et d'export :</strong> Vous pouvez demander un export complet de vos données au format structuré (JSON) depuis les paramètres de votre compte.</li>
            <li><strong>Droit de rectification :</strong> Possibilité de corriger à tout moment vos informations inexactes.</li>
            <li><strong>Droit à l'effacement :</strong> Vous pouvez demander la suppression de votre compte. Les dossiers de santé sont toutefois conservés pendant les durées légales de conservation médicale.</li>
            <li><strong>Gestion du consentement :</strong> Vous pouvez accepter ou refuser certains types de traitements (comme les statistiques d'utilisation) à tout moment.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            6. Contact
          </h2>
          <p class="leading-relaxed">
            Pour toute question ou demande concernant vos données personnelles, veuillez contacter notre Délégué à la Protection des Données (DPO) à l'adresse e-mail suivante :
            <a href="mailto:dpo@medicote.ci" class="text-orange-500 underline font-medium hover:text-orange-600">dpo@medicote.ci</a>.
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
