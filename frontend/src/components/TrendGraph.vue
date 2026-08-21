<template>
<div class="trend-graph-container">

  <canvas ref="trendCanvas"></canvas>

  <!-- Tiny session critical categories -->
  <div
    v-if="sessionCriticalCategories.length"
    class="session-critical-categories"
  >

    <span class="session-title">
      Session Critical Categories:
    </span>

    <span
      v-for="(category, index) in sessionCriticalCategories"
      :key="index"
      class="session-category"
    >
      {{ category }}<span v-if="index < sessionCriticalCategories.length - 1">, </span>
    </span>

  </div>

  <div
    v-if="meanROI !== null && maxEROI !== null"
    class="roi-info"
  >

    <p>
      <strong>Mean ROI:</strong> {{ meanROI }}
    </p>

    <p>
      <strong>Max ROI:</strong> {{ maxEROI }}
    </p>

  </div>

</div>
  
</template>

<script>
import Chart from "chart.js/auto";
import { mapGetters } from "vuex";
import axios from "axios";

export default {
  props: ["categoryName", "categoryId"],

  data() {
    return {
      trendChart: null,
      trendData: [],
      yPosition: 0,
      meanROI: null,
      maxEROI: null,
      sessionCriticalCategories: [],
    };
  },

  computed: {
    ...mapGetters([
      "trendCache"
    ]),
  },

  mounted() {
    this.loadTrend();
    this.loadSessionCriticalCategories();
    this.initializeChart();
  },

  methods: {
    loadTrend() {
      const categoryData = this.trendCache[this.categoryName];

      if (!categoryData) return;

      this.meanROI = categoryData.meanROI;
      this.maxEROI = categoryData.maxEROI;

      this.yPosition = 0;

      this.trendData = categoryData.outcomes.map((entry, index) => ({
        x: index,
        y: this.getNextY(entry.outcome === "Supply" ? 1 : -1),
        outcome: entry.outcome,
      }));

      if (this.trendData.length > 100) {
        this.trendData = this.trendData.slice(-100);
      }

      this.trendData.forEach((point, index) => {
        point.x = index;
      });
    },

    getNextY(value) {
      this.yPosition += value;
      return this.yPosition;
    },

    async loadSessionCriticalCategories() {

  try {

    const response = await axios.get(
      `${import.meta.env.VITE_APP_BASE_URL}/api/chat/session-critical-categories`
    );

    this.sessionCriticalCategories =
      response.data.categories || [];

  } catch (error) {

    console.error(
      "Failed to load session critical categories:",
      error
    );

  }

},

    initializeChart() {
      if (!this.$refs.trendCanvas) return;

      const ctx = this.$refs.trendCanvas.getContext("2d");

      this.trendChart = new Chart(ctx, {
        type: "line",

        data: {
          datasets: [
            {
              label: this.categoryName,
              data: this.trendData,
              borderWidth: 2,
              pointRadius: 0,
              fill: false,
            },
          ],
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,

          scales: {
            x: {
              type: "linear",
              position: "bottom",
              title: {
                display: true,
                text: "overtime",
              },
              min: 0,
              max: 100,
            },

            y: {
              title: {
                display: true,
                text: "Outcome Curve",
              },

              ticks: {
                callback: (value, index, values) => {
                  if (index === 0) return "Demand";
                  if (index === values.length - 1) return "Supply";
                  return "";
                },
              },

              suggestedMin:
                this.trendData.length > 0
                  ? Math.min(...this.trendData.map((d) => d.y)) - 2
                  : -10,

              suggestedMax:
                this.trendData.length > 0
                  ? Math.max(...this.trendData.map((d) => d.y)) + 2
                  : 10,
            },
          },

          elements: {
            line: {
              tension: 0,
            },
          },

          plugins: {
            tooltip: {
              enabled: true,
            },
          },
        },

        plugins: [
          {
            id: "customLineColor",

            afterDatasetDraw(chart) {
              const { ctx, data } = chart;
              const dataset = data.datasets[0];

              ctx.save();

              for (let i = 0; i < dataset.data.length - 1; i++) {
                const start = dataset.data[i];
                const end = dataset.data[i + 1];

                ctx.beginPath();

                ctx.moveTo(
                  chart.scales.x.getPixelForValue(start.x),
                  chart.scales.y.getPixelForValue(start.y)
                );

                ctx.lineTo(
                  chart.scales.x.getPixelForValue(end.x),
                  chart.scales.y.getPixelForValue(end.y)
                );

                ctx.strokeStyle =
                  start.outcome === "Supply" ? "green" : "red";

                ctx.lineWidth = 2;

                ctx.stroke();
              }

              ctx.restore();
            },
          },
        ],
      });
    },

    updateChart() {
      if (!this.trendChart) return;

      this.trendChart.data.datasets[0].label = this.categoryName;
      this.trendChart.data.datasets[0].data = this.trendData;

      this.trendChart.update();
    },
  },

  watch: {
    trendCache: {
      deep: true,

      handler() {
        this.loadTrend();
        this.updateChart();
      },
    },

    categoryName() {
      this.loadTrend();
      this.updateChart();
    },
  },
};
</script>

<style scoped>
.trend-graph-container {
  width: 100%;
  max-width: 100%;
  height: 400px;
}

.roi-info {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 5px;
  text-align: center;
}

.roi-info p {
  margin: 5px 0;
  font-size: 14px;
}

.session-critical-categories {
  margin-top: 2px;
  padding: 0 5px;
  text-align: center;
  font-size: 9px;
  color: #180303;
  opacity: 1.65;
  line-height: 1.3;
}

.session-title {
  font-weight: 600;
  margin-right: 3px;
}

.session-category {
  font-weight: 800;
}
</style>
