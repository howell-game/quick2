<template>
  <div class="investment-page">
  <div class="prompt"> make at least two(2) selections!</div>
    
    <div class="category-cards">
      <v-card v-for="category in categories" :key="category.id" class="category-card">
        <v-card-title>{{ category.name }}</v-card-title>
        <v-card-subtitle>
        <div>
         <a href="#" @click.prevent="viewTrend(category)">View Trend</a>
          </div>

        </v-card-subtitle>
        <v-card-text>
          <div class="choices">
            <button
              class="choice demand"
              :class="{ active: selectedChoices[category.id] === 'Demand' }"
              @click="selectChoice(category.id, 'Demand')"
            >
              Demand ({{ category.odds.demand }}%)
            </button>
            <button
              class="choice supply"
              :class="{ active: selectedChoices[category.id] === 'Supply' }"
              @click="selectChoice(category.id, 'Supply')"
            >
              Supply ({{ category.odds.supply }}%)
            </button>
          </div>
        </v-card-text>
      </v-card>
    </div>
    <div class="prompt"> make at least two(2) selections!</div>
     <button class="submit-btn" :disabled="!isAnyChoiceSelected" @click="viewInvestmentSummary">
     View Selection Summary
      </button>
     <!-- Popup Modal for Trend Graph -->
<div v-if="showTrendModal" class="modal" @click.self="closeTrendModal">
  <div class="modal-content">
    <span class="close" @click="closeTrendModal">&times;</span>
    <TrendGraph v-if="selectedCategory" :categoryName="selectedCategory.name" />
  </div>
</div>
  </div>
</template>

<script>
import TrendGraph from "@/components/TrendGraph.vue";
import { mapActions } from "vuex";

export default {
  components: {
    TrendGraph,
  },
  data() {
    return {
      categories: [
        { id: 1, name: "Agriculture", odds: { demand: 0, supply: 0 } },
        { id: 2, name: "Transportation", odds: { demand: 0, supply: 0 } },
        { id: 3, name: "Music", odds: { demand: 0, supply: 0 } },
        { id: 4, name: "Movie", odds: { demand: 0, supply: 0 } },
        { id: 5, name: "Sports", odds: { demand: 0, supply: 0 } },
        { id: 6, name: "Basic Education", odds: { demand: 0, supply: 0 } },
        { id: 7, name: "Human Development", odds: { demand: 0, supply: 0 } },
        { id: 8, name: "Governance", odds: { demand: 0, supply: 0 } },
        { id: 9, name: "Forestry", odds: { demand: 0, supply: 0 } },
        { id: 10, name: "Food", odds: { demand: 0, supply: 0 } },
        { id: 11, name: "Northern HDI", odds: { demand: 0, supply: 0 } },
        { id: 12, name: "Southern HDI", odds: { demand: 0, supply: 0 } },
        { id: 13, name: "Woodwork", odds: { demand: 0, supply: 0 } },
        { id: 14, name: "Metalwork", odds: { demand: 0, supply: 0 } },
        { id: 15, name: "Logistics", odds: { demand: 0, supply: 0 } },
        { id: 16, name: "Media", odds: { demand: 0, supply: 0 } },
        { id: 17, name: "Automobile", odds: { demand: 0, supply: 0 } },
        { id: 18, name: "Mineral Resources", odds: { demand: 0, supply: 0 } },
        { id: 19, name: "Lekki Business", odds: { demand: 0, supply: 0 } },
        { id: 20, name: "Stock Exchange", odds: { demand: 0, supply: 0 } },
        { id: 21, name: "Textile", odds: { demand: 0, supply: 0 } },
        { id: 22, name: "Art", odds: { demand: 0, supply: 0 } },
        { id: 23, name: "Technology", odds: { demand: 0, supply: 0 } },
        { id: 24, name: "Health", odds: { demand: 0, supply: 0 } },
      ],

      selectedChoices: {}, // Tracks selected choices
      showTrendModal: false,
      selectedCategory: null,
      trendInterval:null,
    };
  },
  
  async created() {

  this.categories.forEach(category => {

    this.selectedChoices[category.id] = null;

  });

  await this.fetchOdds();

  await this.loadTrendCache();

  this.startTrendRefresh();

},

beforeUnmount(){

   if(this.trendInterval){

      clearInterval(this.trendInterval);

   }

},

  computed: {
    isAnyChoiceSelected() {
       // Check if at least 2 choices are selected
    return Object.values(this.selectedChoices).filter(choice => choice !== null).length >= 2;
  },
},

  methods: {

    startTrendRefresh() {

    const now = new Date();

    // Minutes past the hour
    const minute = now.getMinutes();

    // Seconds
    const second = now.getSeconds();

    // Milliseconds
    const ms = now.getMilliseconds();

    // Next refresh minute: 1,6,11,16,21...
    let nextMinute = Math.floor((minute - 1) / 5) * 5 + 6;

    if (minute < 1) {

        nextMinute = 1;

    }

    if (nextMinute >= 60) {

        nextMinute = 61;

    }

    const next = new Date(now);

    if (nextMinute === 61) {

        next.setHours(next.getHours() + 1);

        next.setMinutes(1);

    } else {

        next.setMinutes(nextMinute);

    }

    next.setSeconds(0);

    next.setMilliseconds(0);

    const delay = next - now;

    setTimeout(() => {

        this.loadTrendCache();

        this.trendInterval = setInterval(() => {

            this.loadTrendCache();

        },300000);

    },delay);

},

    ...mapActions([

   "loadTrendCache"

]),


    async fetchOdds() {
      try {
         console.log("Backend URL:", import.meta.env.VITE_APP_BASE_URL);
    const response = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/api/investments/odds`);
    
        const data = await response.json();
        if (data.success) {
          this.categories = this.categories.map((category) => {
            const odds = data.odds[category.name] || { demand: 0, supply: 0 };
            return { ...category, odds };
          });
        }
      } catch (error) {
        console.error("Error fetching odds:", error);
      }
    },
    viewTrend(category) {
  this.selectedCategory = category;  // Set selected category
  this.showTrendModal = true;        // Show the popup
},
     closeTrendModal() {
    this.showTrendModal = false;  // Hide the popup
    this.selectedCategory = null; // Reset the category
     },


    selectChoice(categoryId, choice) {
      this.selectedChoices[categoryId] =
        this.selectedChoices[categoryId] === choice ? null : choice;
    },

    viewInvestmentSummary() {
      // Filter selected categories
      const selectedInvestments = this.categories
        .filter((category) => this.selectedChoices[category.id])
        .map((category) => ({
          id: category.id,
          name: category.name,
          choice: this.selectedChoices[category.id],
          odds: category.odds[this.selectedChoices[category.id]?.toLowerCase()] || 0,
        }));

      // Pass selectedInvestments as query params
      this.$router.push({
        name: "SummaryPage",
        query: { investments: JSON.stringify(selectedInvestments) },
      });
    },
  },
};
</script>


<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 600px;
}

.close {
  position: absolute;
  top: 10px;
  right: 20px;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  color: black; /* Make sure it's visible */
}


.investment-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color:#003366;
  padding: 10px;
}

.category-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 5px;
  width: 100%;
  max-width: 1200px;
  align: center;
}

.category-card {
  border: 1px solid #ccc;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  padding: 10px;
  background-color: lightblue;
  text-align: center;
}
.prompt {
  color: white
}

.choices {
  display: flex;
  justify-content: centre;
  margin-top: 10px;
}

.category-card {
  border: 1px solid #ccc;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); /* Enhanced shadow for visibility */
  padding: 10px;
  background-color:  lightblue;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.category-card:hover {
  transform: translateY(-5px); /* Slight lift effect on hover */
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4); /* Darker shadow for depth */
}

.choices {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.choice {
  flex: 1;
  padding: 12px;
  margin: 0 5px;
  border: 1px solid transparent;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
}

.choice.demand {
  background-color: red;
  color: white;
  box-shadow: 0 3px 8px rgba(255, 0, 0, 0.5);
}

.choice.supply {
  background-color: green;
  color: white;
  box-shadow: 0 3px 8px rgba(0, 128, 0, 0.5);
}

.choice.active {
  background-color: orange;
  color: white;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(255, 165, 0, 0.6); /* Brighter shadow when active */
}

.submit-btn {
  margin: 20px auto;
  padding: 10px 20px;
  background-color: green;
  color: yellow;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0, 128, 0, 0.6);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.submit-btn:hover {
  background-color: rgb(12, 12, 107);
  box-shadow: 0 6px 12px rgba(12, 12, 107, 0.6);
}


.choice {
  flex: 1;
  padding: 10px;
  margin: 0 5px;
  border: 1px solid transparent;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.3s ease, color 0.3s ease;
  border-radius: 5px;
}

.choice.demand {
  background-color: red;
  color: white;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 600px;
  position: relative;
}

.close {
  position: absolute;
  top: 10px;
  right: 20px;
  font-size: 24px;
  cursor: pointer;
}

.choice.supply {
  background-color: green;
  color: white;
}

.choice.active {
  background-color: orange;
  color: white;
  font-weight: bold;
}

.submit-btn {
  margin: 20px auto;
  padding: 10px 20px;
  background-color:green;
  color: yellow;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  
}

.submit-btn:hover {
  background-color:rgb(12, 12, 107);
}

.caution {
  margin: 20px auto;
  padding: 10px 20px;
  background-color:grey;
  color: yellow;
  border: none;
  border-radius: 5px;}

h1 {
  margin-bottom: 20px;
  color: #333;
}

v-card-title {
  font-weight: bold;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 600px;
  position: relative; /* Ensure child elements position correctly */
}



</style>
