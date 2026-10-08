<template>
  <div class="services-page">

    <!-- Header -->
    <div class="services-header">
      <div>
        <h1>Services</h1>
        <p>Quick and convenient everyday services</p>
      </div>

      <div class="service-icon">
        ⚡
      </div>
    </div>

    <!-- Services Grid -->
    <div class="services-grid">

      <!-- Airtime -->
      <div class="service-card black-card" @click="openService('airtime')">
        <div class="card-icon">📱</div>
        <div class="card-content">
          <h2>Airtime</h2>
          <p>Buy airtime for all networks</p>
        </div>
        <div class="arrow">›</div>
      </div>

      <!-- Data -->
      <div class="service-card blue-card" @click="openService('data')">
        <div class="card-icon">🌐</div>
        <div class="card-content">
          <h2>Data</h2>
          <p>Buy affordable data bundles</p>
        </div>
        <div class="arrow">›</div>
      </div>

      <!-- Electricity -->
      <div class="service-card red-card" @click="openService('electricity')">
        <div class="card-icon">⚡</div>
        <div class="card-content">
          <h2>Electricity</h2>
          <p>Pay your electricity bills</p>
        </div>
        <div class="arrow">›</div>
      </div>

      <!-- Cable TV -->
      <div class="service-card black-card" @click="openService('tv')">
        <div class="card-icon">📺</div>
        <div class="card-content">
          <h2>Cable TV</h2>
          <p>Renew your TV subscription</p>
        </div>
        <div class="arrow">›</div>
      </div>

      <!-- Education -->
      <div class="service-card blue-card" @click="openService('education')">
        <div class="card-icon">🎓</div>
        <div class="card-content">
          <h2>Education</h2>
          <p>Access educational materials</p>
        </div>
        <div class="arrow">›</div>
      </div>

      <!-- Other Services -->
      <div class="service-card red-card" @click="openService('pins')">
        <div class="card-icon">📝</div>
        <div class="card-content">
          <h2>Exam PINS</h2>
          <p>Buy WAEC, JAMB, PINS</p>
        </div>
        <div class="arrow">›</div>
      </div>

    </div>
        <!-- Airtime Modal -->
    <Airtime
      v-if="showAirtime"
      @close="closeAirtime"
    />
    <Data
  v-if="showData"
  @close="closeData"
/>
<TV
  v-if="showTV"
  @close="closeTV"
/>
<Electricity
  v-if="showElectricity"
  @close="closeElectricity"
/>
<ExamPins
  v-if="showExamPins"
  @close="closeExamPins"
/>


  </div>
</template>

<script>
import Airtime from "./Airtime.vue";
import TV from "./TV.vue";
import Data from "./Data.vue";
import ExamPins from "./ExamPins.vue";
import Electricity from "./Electricity.vue";

export default {
  name: "Services",

  components: {
    Airtime,
    Data,
    TV,
    Electricity,
    ExamPins
  },

  data() {
    return {
      showAirtime: false,
      showData: false,
      showTV: false,
      showElectricity: false,
      showExamPins: false
    };
  },

  methods: {
    openService(service) {
      if (service === "airtime") {
        this.showAirtime = true;
        return;
      }

      if (service === "pins") {
  this.showExamPins = true;
  return;
}

      if (service === "data") {
    this.showData = true;
    return;
  }
  if (service === "electricity") {
  this.showElectricity = true;
  return;
}
  if (service === "tv") {
    this.showTV = true;
    return;
  }

      console.log("Selected service:", service);
    },

    closeAirtime() {
      this.showAirtime = false;
    },
    closeData() {
  this.showData = false;
},
closeExamPins() {
  this.showExamPins = false;
},
closeTV() {
  this.showTV = false;
},
closeElectricity() {
  this.showElectricity = false;
},
  }
};
</script>

<style scoped>

.services-page {
  padding: 10px 20px;
  background: #0e327f;
  color: white;
}

/* =========================
   HEADER
========================= */

.services-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.services-header h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
}

.services-header p {
  margin: 4px 0 0;
  color: #c1c8d3;
  font-size: 13px;
}

.service-icon {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111827;
  border: 1px solid #1f2937;
  font-size: 20px;
}

/* =========================
   GRID
========================= */

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 8px;
  width: 100%;
  max-width: 1200px;
}


/* =========================
   CARDS
========================= */

.service-card {
  position: relative;
  min-height: 75px;
  padding: 10px 12px;
  border-radius: 10px;

  display: flex;
  align-items: center;
  gap: 10px;

  cursor: pointer;
  overflow: hidden;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.service-card:hover {
  transform: translateY(-3px);
}

.service-card:active {
  transform: scale(0.98);
}


/* =========================
   ICON
========================= */

.card-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;

  border-radius: 10px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);

  font-size: 20px;
}


/* =========================
   CONTENT
========================= */

.card-content {
  flex: 1;
  min-width: 0;
}

.card-content h2 {
  margin: 0 0 3px;
  font-size: 15px;
  font-weight: 700;
}

.card-content p {
  margin: 0;
  color: #aeb6c3;
  font-size: 11px;
  line-height: 1.3;
}


/* =========================
   ARROW
========================= */

.arrow {
  font-size: 22px;
  color: #8b93a1;
  transition: transform 0.2s ease;
}

.service-card:hover .arrow {
  transform: translateX(3px);
  color: white;
}
.service-card:hover {
  transform: translateY(-2px);
}

.service-card:active {
  transform: scale(0.98);
}

/* =========================
   BLACK
========================= */

.black-card {
  background: linear-gradient(
    145deg,
    #050505,
    #111111
  );

  border: 1px solid #292929;
}

.black-card:hover {
  border-color: #555;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

/* =========================
   DARK BLUE
========================= */

.blue-card {
  background: linear-gradient(
    145deg,
    #071426,
    #0d2340
  );

  border: 1px solid #16385f;
}

.blue-card:hover {
  border-color: #285d91;
  box-shadow: 0 6px 18px rgba(3, 35, 70, 0.35);
}

/* =========================
   RED
========================= */

.red-card {
  background: linear-gradient(
    145deg,
    #190709,
    #310b10
  );

  border: 1px solid #5c151d;
}

.red-card:hover {
  border-color: #9d202c;
  box-shadow: 0 6px 18px rgba(100, 10, 20, 0.35);
}

/* =========================
   ICON
========================= */

.card-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;

  border-radius: 11px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);

  font-size: 20px;
}

/* =========================
   CONTENT
========================= */

.card-content {
  flex: 1;
  min-width: 0;
}

.card-content h2 {
  margin: 0 0 3px;
  font-size: 15px;
  font-weight: 700;
}

.card-content p {
  margin: 0;
  color: #aeb6c3;
  font-size: 11px;
  line-height: 1.3;
}

/* =========================
   ARROW
========================= */

.arrow {
  font-size: 22px;
  color: #8b93a1;
  transition: transform 0.2s ease;
}

.service-card:hover .arrow {
  transform: translateX(3px);
  color: white;
}

@media (max-width: 650px) {

  .services-page {
    padding: 12px;
  }

  .services-header {
    margin-bottom: 14px;
  }

  .services-header h1 {
    font-size: 24px;
  }

  .services-header p {
    font-size: 12px;
  }

  .services-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  .service-card {
    min-height: 70px;
    padding: 9px;
    gap: 8px;
  }

  .card-icon {
    width: 34px;
    height: 34px;
    min-width: 34px;
    font-size: 17px;
  }

  .card-content h2 {
    font-size: 13px;
  }

  .card-content p {
    font-size: 9px;
  }

  .arrow {
    font-size: 19px;
  }
}

</style>