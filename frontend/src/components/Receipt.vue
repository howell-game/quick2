<template>

  <div class="receipt-container">

    <h1 class="title">
      Receipts
    </h1>


    <!-- ================================================== -->
    <!-- REAL RECEIPTS -->
    <!-- ================================================== -->

    <section class="receipt-section real-section">

      <div class="section-title real-title">

        <span>
          Real Receipts
        </span>

        <span class="receipt-type real-type">
          REAL
        </span>

      </div>


      <!-- NO REAL RECEIPTS -->

      <div
        v-if="!loading && investments.length === 0"
        class="no-investments"
      >

        <p>
          No real investments found.
        </p>

      </div>


      <!-- REAL INVESTMENT LIST -->

      <div
        v-else
        class="investment-list"
      >

        <div
          v-for="investment in investments"
          :key="`real-${investment.groupCode}`"
          class="investment-item real-item"
        >

          <details class="investment-dropdown">

            <summary class="investment-header">

              <strong>
                {{ investment.groupCode }}
              </strong>

              <span>
                (Investment Code)
              </span>

              <span class="receipt-badge real-badge">
                REAL
              </span>

            </summary>


            <div class="investment-details">

              <p>

                <span class="label">
                  Investment Return:
                </span>

                {{ Math.round(investment.share) }}

              </p>


              <p>

                <span class="label">
                  Investment Amount:
                </span>

                {{ investment.investmentAmount }}

              </p>


              <p>

                <span class="label">
                  Timeframe:
                </span>

                {{ investment.timeframe }}

              </p>


              <p>

                <span class="label">
                  Created At:
                </span>

                {{ formatDate(investment.createdAt) }}

              </p>

            </div>

          </details>

        </div>

      </div>


      <!-- REAL PAGINATION -->

      <div
        v-if="realTotalPages > 1"
        class="pagination"
      >

        <button
          class="pagination-button"
          :disabled="
            realCurrentPage === 1 ||
            loading
          "
          @click="changeRealPage(realCurrentPage - 1)"
        >
          Previous
        </button>


        <button
          v-for="page in realTotalPages"
          :key="`real-page-${page}`"
          class="pagination-button"
          :class="{
            active: page === realCurrentPage
          }"
          :disabled="loading"
          @click="changeRealPage(page)"
        >
          {{ page }}
        </button>


        <button
          class="pagination-button"
          :disabled="
            realCurrentPage === realTotalPages ||
            loading
          "
          @click="changeRealPage(realCurrentPage + 1)"
        >
          Next
        </button>

      </div>


      <div
        v-if="realTotal > 0"
        class="page-info"
      >

        Showing page
        <strong>{{ realCurrentPage }}</strong>
        of
        <strong>{{ realTotalPages }}</strong>

        —
        <strong>{{ realTotal }}</strong>
        total real receipts

      </div>

    </section>



    <!-- ================================================== -->
    <!-- DEMO RECEIPTS -->
    <!-- ================================================== -->

    <section class="receipt-section demo-section">

      <div class="section-title demo-title">

        <span>
          Demo Receipts
        </span>

        <span class="receipt-type demo-type">
          DEMO
        </span>

      </div>


      <!-- NO DEMO RECEIPTS -->

      <div
        v-if="!loading && demoInvestments.length === 0"
        class="no-investments"
      >

        <p>
          No demo investments found.
        </p>

      </div>


      <!-- DEMO INVESTMENT LIST -->

      <div
        v-else
        class="investment-list"
      >

        <div
          v-for="investment in demoInvestments"
          :key="`demo-${investment.groupCode}`"
          class="investment-item demo-item"
        >

          <details class="investment-dropdown">

            <summary class="investment-header demo-header">

              <strong>
                {{ investment.groupCode }}
              </strong>

              <span>
                (Investment Code)
              </span>

              <span class="receipt-badge demo-badge">
                DEMO
              </span>

            </summary>


            <div class="investment-details">

              <p>

                <span class="label">
                  Investment Return:
                </span>

                {{ Math.round(investment.share) }}

              </p>


              <p>

                <span class="label">
                  Investment Amount:
                </span>

                {{ investment.investmentAmount }}

              </p>


              <p>

                <span class="label">
                  Timeframe:
                </span>

                {{ investment.timeframe }}

              </p>


              <p>

                <span class="label">
                  Created At:
                </span>

                {{ formatDate(investment.createdAt) }}

              </p>

            </div>

          </details>

        </div>

      </div>


      <!-- DEMO PAGINATION -->

      <div
        v-if="demoTotalPages > 1"
        class="pagination"
      >

        <button
          class="pagination-button demo-pagination-button"
          :disabled="
            demoCurrentPage === 1 ||
            loading
          "
          @click="changeDemoPage(demoCurrentPage - 1)"
        >
          Previous
        </button>


        <button
          v-for="page in demoTotalPages"
          :key="`demo-page-${page}`"
          class="pagination-button demo-pagination-button"
          :class="{
            active: page === demoCurrentPage
          }"
          :disabled="loading"
          @click="changeDemoPage(page)"
        >
          {{ page }}
        </button>


        <button
          class="pagination-button demo-pagination-button"
          :disabled="
            demoCurrentPage === demoTotalPages ||
            loading
          "
          @click="changeDemoPage(demoCurrentPage + 1)"
        >
          Next
        </button>

      </div>


      <div
        v-if="demoTotal > 0"
        class="page-info demo-page-info"
      >

        Showing page
        <strong>{{ demoCurrentPage }}</strong>
        of
        <strong>{{ demoTotalPages }}</strong>

        —
        <strong>{{ demoTotal }}</strong>
        total demo receipts

      </div>

    </section>


    <!-- ================================================== -->
    <!-- LOADING -->
    <!-- ================================================== -->

    <div
      v-if="loading"
      class="loading"
    >

      Loading receipts...

    </div>

  </div>

</template>

<script>

import axios from "axios";

import { mapGetters } from "vuex";


export default {

  data() {

    return {

      // ==================================================
      // REAL
      // ==================================================

      investments: [],

      realCurrentPage: 1,

      realTotalPages: 0,

      realTotal: 0,


      // ==================================================
      // DEMO
      // ==================================================

      demoInvestments: [],

      demoCurrentPage: 1,

      demoTotalPages: 0,

      demoTotal: 0,


      // ==================================================
      // GENERAL
      // ==================================================

      pageSize: 30,

      loading: false,

    };

  },


  computed: {

    ...mapGetters([
      "userId"
    ]),

  },


  methods: {


    // ======================================================
    // FETCH REAL RECEIPTS
    // ======================================================

    async fetchInvestments() {

      if (!this.userId) {
        return;
      }


      try {

        const response =
          await axios.get(

            `${import.meta.env.VITE_APP_BASE_URL}/api/investments/receipt`,

            {

              params: {

                userId:
                  this.userId,

                page:
                  this.realCurrentPage,

                limit:
                  this.pageSize,

              }

            }

          );


        console.log(
          "Fetched Real Receipts:",
          response.data
        );


        this.investments =
          response.data.investments || [];


        this.realTotal =
          response.data.total || 0;


        this.realCurrentPage =
          response.data.page || 1;


        this.realTotalPages =
          response.data.totalPages || 0;


      } catch (error) {

        // 404 simply means no real receipts

        if (
          error.response?.status !== 404
        ) {

          console.error(
            "Error fetching real receipts:",
            error
          );

        }


        this.investments = [];

        this.realTotal = 0;

        this.realTotalPages = 0;

      }

    },


    // ======================================================
    // FETCH DEMO RECEIPTS
    // ======================================================

    async fetchDemoInvestments() {

      if (!this.userId) {
        return;
      }


      try {

        const response =
          await axios.get(

            `${import.meta.env.VITE_APP_BASE_URL}/api/investments/demoreceipt`,

            {

              params: {

                userId:
                  this.userId,

                page:
                  this.demoCurrentPage,

                limit:
                  this.pageSize,

              }

            }

          );


        console.log(
          "Fetched Demo Receipts:",
          response.data
        );


        this.demoInvestments =
          response.data.investments || [];


        this.demoTotal =
          response.data.total || 0;


        this.demoCurrentPage =
          response.data.page || 1;


        this.demoTotalPages =
          response.data.totalPages || 0;


      } catch (error) {

        if (
          error.response?.status !== 404
        ) {

          console.error(
            "Error fetching demo receipts:",
            error
          );

        }


        this.demoInvestments = [];

        this.demoTotal = 0;

        this.demoTotalPages = 0;

      }

    },


    // ======================================================
    // FETCH BOTH
    // ======================================================

    async fetchAllReceipts() {

      if (!this.userId) {
        return;
      }


      this.loading = true;


      try {

        await Promise.all([

          this.fetchInvestments(),

          this.fetchDemoInvestments(),

        ]);

      } finally {

        this.loading = false;

      }

    },


    // ======================================================
    // CHANGE REAL PAGE
    // ======================================================

    async changeRealPage(page) {

      if (

        page < 1 ||

        page > this.realTotalPages ||

        this.loading

      ) {

        return;

      }


      this.realCurrentPage =
        page;


      this.loading = true;


      try {

        await this.fetchInvestments();

      } finally {

        this.loading = false;

      }


      window.scrollTo({

        top: 0,

        behavior: "smooth"

      });

    },


    // ======================================================
    // CHANGE DEMO PAGE
    // ======================================================

    async changeDemoPage(page) {

      if (

        page < 1 ||

        page > this.demoTotalPages ||

        this.loading

      ) {

        return;

      }


      this.demoCurrentPage =
        page;


      this.loading = true;


      try {

        await this.fetchDemoInvestments();

      } finally {

        this.loading = false;

      }


      window.scrollTo({

        top: 0,

        behavior: "smooth"

      });

    },


    // ======================================================
    // FORMAT DATE
    // ======================================================

    formatDate(date) {

      return new Date(
        date
      ).toLocaleString();

    },

  },


  mounted() {

    if (this.userId) {

      this.fetchAllReceipts();

    }

  },

};

</script>

<style scoped>

/* ==========================================================
   CONTAINER
   ========================================================== */

.receipt-container {

  font-family: Arial, sans-serif;

  margin: 20px auto;

  padding: 20px;

  border: 1px solid #ddd;

  border-radius: 8px;

  background-color: #fffef0;

}


/* ==========================================================
   TITLE
   ========================================================== */

.title {

  text-align: center;

  font-size: 2rem;

  color: #003366;

  margin-bottom: 30px;

}


/* ==========================================================
   RECEIPT SECTION
   ========================================================== */

.receipt-section {

  margin-bottom: 35px;

  padding: 15px;

  border-radius: 10px;

}


/* ==========================================================
   REAL SECTION
   ========================================================== */

.real-section {

  background-color: lightyellow;

  border: 1px solid #e6df8c;

}


/* ==========================================================
   DEMO SECTION
   ========================================================== */

.demo-section {

  background-color: #e6f5ff;

  border: 1px solid #9dd7f5;

}


/* ==========================================================
   SECTION TITLE
   ========================================================== */

.section-title {

  display: flex;

  justify-content: space-between;

  align-items: center;

  font-size: 1.4rem;

  font-weight: bold;

  padding: 12px 15px;

  margin-bottom: 15px;

  border-radius: 7px;

}


/* ==========================================================
   REAL TITLE
   ========================================================== */

.real-title {

  background-color: #003366;

  color: yellow;

}


/* ==========================================================
   DEMO TITLE
   ========================================================== */

.demo-title {

  background-color: #1976a8;

  color: white;

}


/* ==========================================================
   RECEIPT TYPE
   ========================================================== */

.receipt-type {

  margin-left: auto;

  font-size: 0.9rem;

  font-weight: bold;

  padding: 5px 12px;

  border-radius: 20px;

}


/* ==========================================================
   REAL TYPE
   ========================================================== */

.real-type {

  background-color: yellow;

  color: #003366;

}


/* ==========================================================
   DEMO TYPE
   ========================================================== */

.demo-type {

  background-color: white;

  color: #1976a8;

}


/* ==========================================================
   NO INVESTMENTS
   ========================================================== */

.no-investments {

  text-align: center;

  color: #888;

  font-size: 1.1rem;

  padding: 15px;

}


/* ==========================================================
   INVESTMENT LIST
   ========================================================== */

.investment-list {

  display: flex;

  flex-direction: column;

  gap: 15px;

}


/* ==========================================================
   INVESTMENT ITEM
   ========================================================== */

.investment-item {

  border-radius: 8px;

  padding: 10px;

  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.1);

}


/* ==========================================================
   REAL INVESTMENT
   ========================================================== */

.real-item {

  background-color: lightyellow;

}


/* ==========================================================
   DEMO INVESTMENT
   ========================================================== */

.demo-item {

  background-color: #dff2ff;

}


/* ==========================================================
   DROPDOWN
   ========================================================== */

.investment-dropdown {

  width: 100%;

  cursor: pointer;

}


/* ==========================================================
   HEADER
   ========================================================== */

.investment-header {

  display: flex;

  align-items: center;

  gap: 6px;

  font-size: 1.1rem;

  font-weight: bold;

  background-color: #003366;

  color: yellow;

  padding: 10px;

  border-radius: 5px;

  text-align: left;

}


/* ==========================================================
   DEMO HEADER
   ========================================================== */

.demo-header {

  background-color: #1976a8;

  color: white;

}


/* ==========================================================
   BADGE
   ========================================================== */

.receipt-badge {

  margin-left: auto;

  padding: 4px 10px;

  border-radius: 15px;

  font-size: 0.75rem;

  font-weight: bold;

}


/* ==========================================================
   REAL BADGE
   ========================================================== */

.real-badge {

  background-color: yellow;

  color: #003366;

}


/* ==========================================================
   DEMO BADGE
   ========================================================== */

.demo-badge {

  background-color: white;

  color: #1976a8;

}


/* ==========================================================
   DETAILS
   ========================================================== */

.investment-details {

  padding: 10px;

  margin-top: 5px;

  background: white;

  border-radius: 5px;

  border: 1px solid #ddd;

}


/* ==========================================================
   LABEL
   ========================================================== */

.label {

  font-weight: bold;

  color: #003366;

}


/* ==========================================================
   PAGINATION
   ========================================================== */

.pagination {

  display: flex;

  justify-content: center;

  align-items: center;

  flex-wrap: wrap;

  gap: 8px;

  margin-top: 20px;

}


/* ==========================================================
   PAGINATION BUTTON
   ========================================================== */

.pagination-button {

  padding: 8px 14px;

  border: 1px solid #003366;

  border-radius: 5px;

  background-color: white;

  color: #003366;

  cursor: pointer;

  font-weight: bold;

}


/* ==========================================================
   ACTIVE REAL PAGE
   ========================================================== */

.pagination-button.active {

  background-color: #003366;

  color: yellow;

}


/* ==========================================================
   DEMO PAGINATION
   ========================================================== */

.demo-pagination-button {

  border-color: #1976a8;

  color: #1976a8;

}


/* ==========================================================
   ACTIVE DEMO PAGE
   ========================================================== */

.demo-pagination-button.active {

  background-color: #1976a8;

  color: white;

}


/* ==========================================================
   DISABLED
   ========================================================== */

.pagination-button:disabled {

  opacity: 0.5;

  cursor: not-allowed;

}


/* ==========================================================
   PAGE INFORMATION
   ========================================================== */

.page-info {

  margin-top: 12px;

  color: #003366;

  font-size: 0.95rem;

  text-align: center;

}


/* ==========================================================
   DEMO PAGE INFORMATION
   ========================================================== */

.demo-page-info {

  color: #1976a8;

}


/* ==========================================================
   LOADING
   ========================================================== */

.loading {

  margin-top: 15px;

  color: #003366;

  font-weight: bold;

  text-align: center;

}

</style>