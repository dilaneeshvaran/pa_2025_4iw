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
        Dernière mise à jour : 21 juin 2026
      </p>

      <div class="prose max-w-none text-gray-600 space-y-6">
        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            1. Introduction et Conformité Réglementaire
          </h2>
          <p class="leading-relaxed">
            MediCôte est particulièrement soucieux de la vie privée et de la protection des données à caractère personnel de ses utilisateurs. Nous nous engageons à traiter les données de santé et les données personnelles conformément à la réglementation applicable en Côte d'Ivoire (loi n° 2013-450 relative à la protection des données à caractère personnel) sous l'égide de l'<strong>ARTCI</strong>, ainsi qu'aux standards du Règlement Général sur la Protection des Données (RGPD).
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            2. Données collectées
          </h2>
          <p class="leading-relaxed">
            Dans le cadre de l'utilisation de la plateforme MediCôte, nous collectons les types de données suivants :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li>
              <strong>Données d'identification et de contact :</strong> Nom, prénom, adresse e-mail, numéro de téléphone, date de naissance, genre, adresse postale, ville.
            </li>
            <li>
              <strong>Données de santé (données hautement sensibles) :</strong> Motifs de consultation, antécédents médicaux déclarés, ordonnances, comptes rendus d'examens, notes cliniques du praticien. Ces données sont chiffrées de bout en bout et au repos à l'aide de l'algorithme fort AES-256-GCM.
            </li>
            <li>
              <strong>Données financières et facturation :</strong> Historique de transaction Mobile Money et carte bancaire (fictif pour le projet académique), montants et factures générées.
            </li>
            <li>
              <strong>Données de connexion et techniques :</strong> Adresses IP anonymisées, historiques de navigation (soumis à consentement pour l'outil Umami), logs d'accès de sécurité aux dossiers médicaux.
            </li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            3. Finalités et Bases Légales du Traitement
          </h2>
          <p class="leading-relaxed">
            Vos données personnelles sont traitées sur la base de fondements juridiques précis :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Exécution d'un contrat :</strong> Gestion des rendez-vous, mise en relation entre patients et praticiens, réalisation des téléconsultations par visioconférence sécurisée, et génération des factures.</li>
            <li><strong>Consentement explicite :</strong> Traitement des données de santé sensibles pour le dossier médical partagé, activation de l'authentification double facteur (2FA), et suivi statistique anonyme.</li>
            <li><strong>Intérêt légitime :</strong> Sécurisation des accès aux données de santé, journalisation d'audit pour prévenir les fraudes ou les accès non autorisés.</li>
            <li><strong>Préservation des intérêts vitaux :</strong> Orientation rapide vers les urgences locales (ex: SAMU Côte d'Ivoire) en cas d'inadéquation de la téléconsultation.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            4. Sécurité, Chiffrement et Confidentialité
          </h2>
          <p class="leading-relaxed">
            Nous appliquons des mesures de sécurité techniques et organisationnelles renforcées pour assurer la protection de vos données :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Chiffrement fort :</strong> Utilisation d'AES-256-GCM pour le stockage des données de santé et de fichiers médicaux importés sur nos serveurs.</li>
            <li><strong>Chiffrement des flux :</strong> Cryptage systématique de toutes les communications réseau via le protocole TLS (HTTPS, WebSockets sécurisés).</li>
            <li><strong>Traçabilité et audit :</strong> Chaque consultation, modification, ou téléchargement d'un dossier médical ou document de santé est consigné de façon inaltérable dans un journal d'audit de sécurité.</li>
            <li><strong>Isolation logique :</strong> L'accès aux dossiers de santé est strictement réservé au patient et aux praticiens auxquels le patient a expressément accordé une autorisation d'accès.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            5. Destinataires des Données
          </h2>
          <p class="leading-relaxed">
            Les données personnelles et médicales collectées sont strictement destinées :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li>Au patient concerné.</li>
            <li>Aux praticiens et au personnel administratif habilité des cabinets médicaux auprès desquels le patient a pris rendez-vous.</li>
            <li>Aux sous-traitants techniques (hébergeur sécurisé agréé HDS/VPS, API de visioconférence WebRTC).</li>
            <li>Aucune donnée n'est vendue, louée ou cédée à des tiers à des fins de marketing ou de publicité commerciale.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            6. Durées de Conservation des Données
          </h2>
          <p class="leading-relaxed">
            Conformément aux obligations légales et déontologiques :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Dossier médical partagé (DMP) :</strong> Conservé pendant 20 ans à compter de la date de la dernière consultation ou du dernier acte de soins de l'utilisateur.</li>
            <li><strong>Logs système et de connexion :</strong> Conservés pendant une durée de 1 an à compter de leur enregistrement.</li>
            <li><strong>Factures et documents financiers :</strong> Conservés pendant 10 ans conformément aux règles de la comptabilité commerciale.</li>
            <li><strong>Comptes inactifs et données de profil :</strong> Supprimés ou anonymisés de façon définitive après 3 ans d'inactivité totale sur le compte, ou sous un délai de 30 jours après une demande de suppression formulée par l'utilisateur (délai de grâce permettant l'annulation de la suppression).</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            7. Vos Droits
          </h2>
          <p class="leading-relaxed">
            Conformément à la réglementation ivoirienne et au RGPD, vous disposez des droits suivants :
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Droit d'accès et de portabilité :</strong> Vous pouvez télécharger un export complet de vos données personnelles au format JSON directement depuis l'onglet « Mes données » dans vos paramètres de profil.</li>
            <li><strong>Droit de rectification :</strong> Vous pouvez corriger vos informations d'identification à tout moment depuis votre tableau de bord.</li>
            <li><strong>Droit à l'effacement :</strong> Vous pouvez demander la suppression de votre compte, sous réserve des durées légales impératives de conservation des dossiers de santé.</li>
            <li><strong>Droit d'opposition et de limitation :</strong> Vous pouvez vous opposer au traitement de certaines données secondaires ou révoquer vos consentements (ex: statistiques analytics d'Umami).</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900 border-b pb-2">
            8. Contact et Délégué à la Protection des Données
          </h2>
          <p class="leading-relaxed">
            Pour toute question relative à cette politique de confidentialité ou pour exercer vos droits, vous pouvez contacter notre Délégué à la Protection des Données (DPO) à l'adresse e-mail suivante :
            <a href="mailto:dpo@medicote.ci" class="text-orange-500 underline font-medium hover:text-orange-600">dpo@medicote.ci</a>.
          </p>
          <p class="leading-relaxed">
            Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à l'ARTCI (République de Côte d'Ivoire) ou à la CNIL (France).
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
