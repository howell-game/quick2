<template>
  <div class="details-pan">

    <h2>Your Selection History</h2>

    <div
      v-if="displayedInvestments.length===0"
      class="no-investments"
    >
      No investments found.
    </div>

    <ul v-else>

      <li
        v-for="investment in displayedInvestments"
        :key="investment.investmentCode"
        class="investment-item"
        :class="investment.status"
      >

        <details>

          <summary class="investment-header">

            <span class="date">
              {{ formatDate(investment.createdAt) }}
            </span>

            <span
              class="mode"
              :class="investment.isDemo ? 'demo' : 'real'"
            >
              {{ investment.isDemo ? "DEMO" : "REAL" }}
            </span>

            <span class="status">
              {{ investment.status }}
            </span>

          </summary>

          <div
  v-for="(item,index) in investment.selectedInvestments"
  :key="index"
  class="selection"
>

    <div class="field">
        <span class="title">Category</span>
        <span>{{ item.category }}</span>
    </div>

    <div class="field">
        <span class="title">Choice</span>
        <span>{{ item.choice }}</span>
    </div>

    <div class="field">
        <span class="title">Amount</span>
        <span>₦{{ item.amount }}</span>
    </div>

    <div class="field">
        <span class="title">Odds</span>
        <span>{{ item.odds }}%</span>
    </div>

    <div class="field">
    <span class="title">Outcome</span>

    <span
        :class="{
            win: item.outcome === 'win',
            loss:
                item.outcome === 'loss' ||
                item.outcome === 'neutral',
            pending: !item.outcome
        }"
    >

        {{
            item.outcome === "neutral"
                ? "loss"
                : item.outcome || "Pending"
        }}

    </span>
</div>

    <div class="field">
        <span class="title">Time</span>
        <span>{{ item.timeframe }}</span>
    </div>

</div>

        </details>

      </li>

    </ul>

    <button
      v-if="hasMore"
      @click="loadMoreInvestments"
    >
      Load More
    </button>

  </div>
</template>

<script>
import axios from "axios";
import { mapGetters } from "vuex";

export default {

  name:"InvestmentDetails",

  data(){

    return{

      investments:[],

      displayedInvestments:[],

      currentPage:0,

      itemsPerPage:70,

      hasMore:true

    }

  },

  computed:{
    ...mapGetters(["userId","token"])
  },

  methods:{

    formatDate(date){

      return new Date(date).toLocaleString();

    },

    async fetchInvestments(){

      if(!this.userId) return;

      try{

        const [real,demo]=await Promise.all([

          axios.get(
            `${import.meta.env.VITE_APP_BASE_URL}/api/investments/user/${this.userId}`,
            {
              headers:{
                Authorization:`Bearer ${this.token}`
              }
            }
          ),

          axios.get(
            `${import.meta.env.VITE_APP_BASE_URL}/api/investments/demouser/${this.userId}`,
            {
              headers:{
                Authorization:`Bearer ${this.token}`
              }
            }
          )

        ]);

        const realList=(real.data||[]).map(i=>({

          ...i,

          isDemo:false

        }));

        const demoList=(demo.data||[]).map(i=>({

          ...i,

          isDemo:true

        }));

        this.investments=[

          ...realList,

          ...demoList

        ].sort(

          (a,b)=>

          new Date(b.createdAt)-new Date(a.createdAt)

        );

        this.updateDisplayedInvestments();

      }

      catch(err){

        console.error(err);

      }

    },

    updateDisplayedInvestments(){

      const start=this.currentPage*this.itemsPerPage;

      const end=start+this.itemsPerPage;

      this.displayedInvestments.push(

        ...this.investments.slice(start,end)

      );

      if(end>=this.investments.length){

        this.hasMore=false;

      }

    },

    loadMoreInvestments(){

      this.currentPage++;

      this.updateDisplayedInvestments();

    }

  },

  created(){

    this.fetchInvestments();

  }

}
</script>

<style scoped>

.details-pan{

    width:95%;

    margin:auto;

    background:#fffde8;

    padding:20px;

    border-radius:8px;

}

h2{

    text-align:center;

    margin-bottom:20px;

}

ul{

    list-style:none;

    padding:0;

}

.investment-item{

    margin-bottom:15px;

    border-radius:8px;

    overflow:hidden;

    border:1px solid #ddd;

}

details{

    width:100%;

}

.investment-header{

    width:100%;

    display:flex;

    justify-content:space-between;

    align-items:center;

    padding:15px;

    color:white;

    font-weight:bold;

    box-sizing:border-box;

}

.awaiting .investment-header{

    background:#d6a400;

}

.active .investment-header{

    background:#2e9d45;

}

.completed .investment-header{

    background:#7f7f7f;

}

.date{

    flex:1;

    text-align:left;

}

.mode{

    flex:1;

    text-align:center;

}

.mode.demo{

    color:#ff4444;

}

.mode.real{

    color:#8be88b;

}

.status{

    flex:1;

    text-align:right;

    text-transform:uppercase;

}

.selection{

    display:flex;
    flex-wrap:wrap;
    align-items:center;
    gap:12px;

    margin:8px 10px;
    padding:8px 10px;

    background:#ffffff;

    border-left:4px solid #3498db;
    border-radius:6px;

    font-size:13px;

}

.field{

    display:flex;
    align-items:center;

    gap:4px;

}

.title{

    font-weight:bold;
    color:#444;
    font-size:12px;

}

.field span:last-child{

    color:#111;

}

.win{

    color:green;
    font-weight:bold;

}

.loss{

    color:red;
    font-weight:bold;

}

.pending{

    color:orange;
    font-weight:bold;

}

.row{

    display:flex;

    justify-content:space-between;

    padding:8px 0;

    border-bottom:1px solid #eee;

}

.row:last-child{

    border-bottom:none;

}

.label{

    font-weight:bold;

    color:#555;

}

.win{

    color:green;

    font-weight:bold;

}

.loss{

    color:red;

    font-weight:bold;

}

.pending{

    color:orange;

    font-weight:bold;

}

button{

    display:block;

    margin:20px auto;

    padding:10px 25px;

    border:none;

    background:#3498db;

    color:white;

    border-radius:6px;

    cursor:pointer;

}

button:hover{

    background:#2575c4;

}

.no-investments{

    text-align:center;

    color:red;

    font-weight:bold;

}

</style>