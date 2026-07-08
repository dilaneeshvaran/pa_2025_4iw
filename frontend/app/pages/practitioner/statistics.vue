<template>
  <div class="space-y-6 print:space-y-4">
    <div
      class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden"
    >
      <div>
        <h1 class="mb-2 text-2xl font-bold text-gray-900">Statistiques</h1>
        <p class="text-gray-600">Analysez votre activité et vos performances</p>
      </div>
      <div class="flex gap-2">
        <UiButton variant="outline" @click="exportCSV">
          <Download class="mr-2 h-4 w-4" />
          Exporter CSV
        </UiButton>
        <UiButton variant="outline" @click="exportPDF">
          <Printer class="mr-2 h-4 w-4" />
          Exporter PDF
        </UiButton>
      </div>
    </div>

    <UiCard class="print:hidden">
      <div class="flex flex-wrap items-center gap-4">
        <label class="text-sm font-medium text-gray-700">Période :</label>
        <select
          v-model="selectedPeriod"
          class="rounded-lg border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="semaine">Cette semaine</option>
          <option value="mois">Ce mois</option>
          <option value="annee">Cette année</option>
          <option value="personnalise">Personnalisé</option>
        </select>

        <div
          v-if="selectedPeriod === 'personnalise'"
          class="flex items-center gap-2"
        >
          <input
            type="date"
            v-model="startDate"
            class="rounded-lg border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <span class="text-gray-500">à</span>
          <input
            type="date"
            v-model="endDate"
            class="rounded-lg border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <UiButton size="sm" @click="fetchStats" :disabled="loading"
            >Appliquer</UiButton
          >
        </div>
      </div>
    </UiCard>

    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div
        v-for="i in 5"
        :key="i"
        class="h-24 animate-pulse rounded-lg bg-gray-200"
      ></div>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <UiCard v-for="(kpi, i) in kpiCards" :key="i">
        <div class="flex items-center gap-4">
          <div
            :class="[
              'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg',
              kpi.bgColor,
            ]"
          >
            <component :is="kpi.icon" :class="['h-6 w-6', kpi.iconColor]" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm text-gray-500">{{ kpi.label }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ kpi.value }}</p>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- charts -->
    <div v-if="!loading" class="grid gap-6 lg:grid-cols-1">
      <UiCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          Évolution des consultations
        </h3>
        <div class="h-80">
          <ClientOnly>
            <Line
              v-if="hasChartData"
              :data="chartDataConfig"
              :options="chartOptions"
            />
            <div
              v-else
              class="flex h-full items-center justify-center text-gray-500"
            >
              Pas de données sur cette période
            </div>
          </ClientOnly>
        </div>
      </UiCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import {
  Download,
  Printer,
  Users,
  TrendingUp,
  CreditCard,
  UserPlus,
  Star,
} from "lucide-vue-next";
import { useAuthenticatedFetch } from "~/composables/useAuthenticatedFetch";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

definePageMeta({ layout: "practitioner", middleware: "practitioner-only" });

const loading = ref(true);
const selectedPeriod = ref("mois");
const startDate = ref("");
const endDate = ref("");

const stats = ref<{
  totalConsultations: number;
  attendanceRate: number;
  revenue: number;
  newPatients: number;
  satisfactionScore: number;
  chartData: Array<{ date: string; count: number }>;
} | null>(null);

const kpiCards = computed(() => [
  {
    label: "Consultations",
    value: stats.value?.totalConsultations ?? 0,
    icon: Users,
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    label: "Taux de présence",
    value: `${stats.value?.attendanceRate ?? 0}%`,
    icon: TrendingUp,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    label: "Revenus",
    value: `${(stats.value?.revenue ?? 0).toLocaleString("fr-FR")} XOF`,
    icon: CreditCard,
    bgColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    label: "Nouveaux patients",
    value: stats.value?.newPatients ?? 0,
    icon: UserPlus,
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    label: "Satisfaction",
    value: `${stats.value?.satisfactionScore ?? 0} / 5`,
    icon: Star,
    bgColor: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
]);

const hasChartData = computed(() => {
  return stats.value?.chartData && stats.value.chartData.length > 0;
});

const chartDataConfig = computed(() => {
  if (!hasChartData.value) return { labels: [], datasets: [] };
  return {
    labels: stats.value!.chartData.map((d) => {
      // formatter dates pour affichage selon mois ou annee
      if (d.date.length === 7) {
        //  yyyy-mm
        const [year, month] = d.date.split("-") as [string, string];
        const dateObj = new Date(parseInt(year), parseInt(month) - 1);
        return dateObj.toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        });
      }
      return new Date(d.date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    }),
    datasets: [
      {
        label: "Consultations",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "#3b82f6",
        pointBackgroundColor: "#2563eb",
        borderWidth: 2,
        fill: true,
        data: stats.value!.chartData.map((d) => d.count),
        tension: 0.3,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
};

const fetchStats = async () => {
  loading.value = true;
  try {
    let url = `/practitioners/statistics?period=${selectedPeriod.value}`;
    if (
      selectedPeriod.value === "personnalise" &&
      startDate.value &&
      endDate.value
    ) {
      url += `&startDate=${startDate.value}&endDate=${endDate.value}`;
    }
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: any;
    }>(url);
    if (response?.success) {
      stats.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching statistics:", error);
  } finally {
    loading.value = false;
  }
};

watch(selectedPeriod, (newVal) => {
  if (newVal !== "personnalise") {
    fetchStats();
  }
});

onMounted(() => {
  fetchStats();
});

const exportCSV = () => {
  if (!stats.value) return;

  const bom = "\uFEFF"; // force utf8 dans excel
  let csvContent = "Indicateur,Valeur\n";
  csvContent += `Total Consultations,${stats.value.totalConsultations}\n`;
  csvContent += `Taux de présence (%),${stats.value.attendanceRate}\n`;
  csvContent += `Revenus (XOF),${stats.value.revenue}\n`;
  csvContent += `Nouveaux patients,${stats.value.newPatients}\n`;
  csvContent += `Score de satisfaction (/5),${stats.value.satisfactionScore}\n\n`;

  // ajouter tableau d evolution consultation
  csvContent += "Date,Nombre de consultations\n";
  if (stats.value.chartData && stats.value.chartData.length > 0) {
    stats.value.chartData.forEach((d) => {
      csvContent += `${d.date},${d.count}\n`;
    });
  } else {
    csvContent += "Aucune donnée,\n";
  }

  const blob = new Blob([bom + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `statistiques_${selectedPeriod.value}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportPDF = () => {
  if (!stats.value) return;

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Rapport de Statistiques", 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Période : ${selectedPeriod.value}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [["Indicateur", "Valeur"]],
    body: [
      ["Total Consultations", stats.value.totalConsultations.toString()],
      ["Taux de présence", `${stats.value.attendanceRate}%`],
      ["Revenus", `${stats.value.revenue.toLocaleString("fr-FR")} XOF`],
      ["Nouveaux patients", stats.value.newPatients.toString()],
      ["Score de satisfaction", `${stats.value.satisfactionScore} / 5`],
    ],
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] }, // tailwind blue-500
  });

  // evolution des consultations
  let finalY = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Évolution des consultations", 14, finalY);

  const chartBody =
    stats.value.chartData && stats.value.chartData.length > 0
      ? stats.value.chartData.map((d) => [d.date, d.count.toString()])
      : [["Aucune donnée", ""]];

  autoTable(doc, {
    startY: finalY + 6,
    head: [["Date", "Nombre de consultations"]],
    body: chartBody,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`statistiques_${selectedPeriod.value}.pdf`);
};
</script>
