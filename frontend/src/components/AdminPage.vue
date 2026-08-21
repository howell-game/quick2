<template>

  <div class="admin-page">


    <!-- =====================================================
         SIDEBAR
    ====================================================== -->

    <aside class="sidebar">

      <div class="admin-logo">

        <h1>TradeGame</h1>

        <span>Admin Panel</span>

      </div>


      <nav class="admin-menu">


        <!-- USERS -->

        <button
          :class="{ active: activeSection === 'users' }"
          @click="activeSection = 'users'"
        >

          <span>👥</span>

          <div>

            <strong>Users</strong>

            <small>
              {{ stats.users }}
            </small>

          </div>

        </button>



        <!-- ISSUES -->

        <button
          :class="{ active: activeSection === 'issues' }"
          @click="activeSection = 'issues'"
        >

          <span>⚠️</span>

          <div>

            <strong>Issues</strong>

            <small>
              {{ stats.issues }}
            </small>

          </div>

        </button>



        <!-- PLATFORM FEES -->

        <button
          :class="{ active: activeSection === 'fees' }"
          @click="activeSection = 'fees'"
        >

          <span>💰</span>

          <div>

            <strong>Platform Fees</strong>

            <small>
              ₦{{ formatNumber(stats.platformFees) }}
            </small>

          </div>

        </button>



        <!-- USER BALANCE -->

        <button
          :class="{ active: activeSection === 'balance' }"
          @click="activeSection = 'balance'"
        >

          <span>💳</span>

          <div>

            <strong>User Balance</strong>

            <small>
              ₦{{ formatNumber(stats.totalUserBalance) }}
            </small>

          </div>

        </button>



        <!-- ACTIVE INVESTMENTS -->

        <button
          :class="{ active: activeSection === 'active' }"
          @click="activeSection = 'active'"
        >

          <span>📈</span>

          <div>

            <strong>Active Investments</strong>

            <small>
              {{ stats.activeInvestments }}
            </small>

          </div>

        </button>



        <!-- AWAITING INVESTMENTS -->

        <button
          :class="{ active: activeSection === 'awaiting' }"
          @click="activeSection = 'awaiting'"
        >

          <span>⏳</span>

          <div>

            <strong>Awaiting Investments</strong>

            <small>
              {{ stats.awaitingInvestments }}
            </small>

          </div>

        </button>



        <!-- PENDING WITHDRAWALS -->

        <button
          :class="{ active: activeSection === 'withdrawals' }"
          @click="activeSection = 'withdrawals'"
        >

          <span>🏦</span>

          <div>

            <strong>Pending Withdrawals</strong>

            <small>
              {{ stats.pendingWithdrawals }}
            </small>

          </div>

        </button>



        <!-- MESSAGES -->

        <router-link
          to="/adminchat"
          class="admin-menu-link"
        >

          <span>💬</span>

          <div>

            <strong>Messages</strong>

            <small>
              Support Chat
            </small>

          </div>

        </router-link>


      </nav>

    </aside>



    <!-- =====================================================
         MAIN CONTENT
    ====================================================== -->

    <main class="main-content">


      <!-- HEADER -->

      <header class="dashboard-header">

        <div>

          <h2>
            Admin Dashboard
          </h2>

          <p>
            Monitor and manage TradeGame
          </p>

        </div>


        <div class="admin-status">

          <span class="status-dot"></span>

          Admin Online

        </div>

      </header>



      <!-- =====================================================
           USERS
      ====================================================== -->

      <section
        v-if="activeSection === 'users'"
        class="content-section"
      >

        <div class="section-heading">

          <div>

            <span class="section-icon">
              👥
            </span>

            <h2>
              Users
            </h2>

          </div>

        </div>


        <div class="large-stat">

          <span>
            Total Registered Users
          </span>

          <strong>
            {{ stats.users }}
          </strong>

        </div>


        <p class="section-description">

          Total number of users currently
          registered on the TradeGame platform.

        </p>

      </section>



      <!-- =====================================================
           ISSUES
      ====================================================== -->

      <section
        v-if="activeSection === 'issues'"
        class="content-section"
      >

        <div class="section-heading">

          <div>

            <span class="section-icon">
              ⚠️
            </span>

            <h2>
              Issues
            </h2>

          </div>

        </div>


        <div class="large-stat warning">

          <span>
            Unresolved Issues
          </span>

          <strong>
            {{ stats.issues }}
          </strong>

        </div>


        <p class="section-description">

          Unresolved support messages requiring
          administrative attention.

        </p>

      </section>



      <!-- =====================================================
           PLATFORM FEES
      ====================================================== -->

      <section
        v-if="activeSection === 'fees'"
        class="content-section"
      >

        <div class="section-heading">

          <div>

            <span class="section-icon">
              💰
            </span>

            <h2>
              Platform Fees
            </h2>

          </div>

        </div>


        <div class="large-stat">

          <span>
            Total Platform Fees
          </span>

          <strong>

            ₦{{ formatNumber(stats.platformFees) }}

          </strong>

        </div>


        <p class="section-description">

          Total fees currently accumulated
          by the platform.

        </p>

      </section>



      <!-- =====================================================
           USER BALANCE
      ====================================================== -->

      <section
        v-if="activeSection === 'balance'"
        class="content-section"
      >

        <div class="section-heading">

          <div>

            <span class="section-icon">
              💳
            </span>

            <h2>
              Total User Balance
            </h2>

          </div>

        </div>


        <div class="large-stat">

          <span>
            Total Balance Held By Users
          </span>

          <strong>

            ₦{{ formatNumber(stats.totalUserBalance) }}

          </strong>

        </div>


        <p class="section-description">

          Combined balance of all users
          on the platform.

        </p>

      </section>



      <!-- =====================================================
           ACTIVE INVESTMENTS
      ====================================================== -->

      <section
        v-if="activeSection === 'active'"
        class="content-section"
      >

        <div class="section-heading">

          <div>

            <span class="section-icon">
              📈
            </span>

            <h2>
              Active Investments
            </h2>

          </div>

        </div>


        <div class="large-stat">

          <span>
            Currently Active
          </span>

          <strong>
            {{ stats.activeInvestments }}
          </strong>

        </div>


        <p class="section-description">

          Investment selections currently
          active on the platform.

        </p>

      </section>



      <!-- =====================================================
           AWAITING INVESTMENTS
      ====================================================== -->

      <section
        v-if="activeSection === 'awaiting'"
        class="content-section"
      >

        <div class="section-heading">

          <div>

            <span class="section-icon">
              ⏳
            </span>

            <h2>
              Awaiting Investments
            </h2>

          </div>

        </div>


        <div class="large-stat warning">

          <span>
            Awaiting Action
          </span>

          <strong>
            {{ stats.awaitingInvestments }}
          </strong>

        </div>


        <p class="section-description">

          Investment selections waiting
          for processing or distribution.

        </p>

      </section>



      <!-- =====================================================
           PENDING WITHDRAWALS
      ====================================================== -->

      <section
        v-if="activeSection === 'withdrawals'"
        class="content-section"
      >

        <div class="section-heading">

          <div>

            <span class="section-icon">
              🏦
            </span>

            <h2>
              Pending Withdrawals
            </h2>

          </div>

        </div>


        <div class="large-stat warning">

          <span>
            Withdrawals Waiting
          </span>

          <strong>
            {{ stats.pendingWithdrawals }}
          </strong>

        </div>


        <p class="section-description">

          User withdrawals that still
          require processing.

        </p>



        <!-- ===============================================
             LOADING WITHDRAWALS
        ================================================ -->

        <div
          v-if="loadingWithdrawals"
          class="withdrawal-loading"
        >

          Loading withdrawals...

        </div>



        <!-- ===============================================
             NO WITHDRAWALS
        ================================================ -->

        <div
          v-if="
            !loadingWithdrawals &&
            withdrawalTransactions.length === 0
          "
          class="no-withdrawals"
        >

          No pending withdrawals.

        </div>



        <!-- ===============================================
             WITHDRAWAL LIST
        ================================================ -->

        <div
          v-for="transaction in withdrawalTransactions"
          :key="transaction.id"
          class="withdrawal-card"
        >


          <div class="withdrawal-summary">

            <div>

              <strong>
                ₦{{ formatNumber(transaction.amount) }}
              </strong>

              <small>
                {{ transaction.transactionId }}
              </small>

            </div>


            <button
              class="dropdown-button"
              @click="
                toggleWithdrawal(transaction.id)
              "
            >

              {{ openedWithdrawal === transaction.id
                ? "▲"
                : "▼"
              }}

            </button>

          </div>



          <!-- ==========================================
               WITHDRAWAL DETAILS
          =========================================== -->

          <div
            v-if="
              openedWithdrawal === transaction.id
            "
            class="withdrawal-details"
          >

            <div>

              <span>
                Bank Name
              </span>

              <strong>
                {{ transaction.bankName || "N/A" }}
              </strong>

            </div>


            <div>

              <span>
                Account Number
              </span>

              <strong>
                {{ transaction.accountNumber || "N/A" }}
              </strong>

            </div>


            <div>

              <span>
                Date
              </span>

              <strong>
                {{ formatDate(transaction.createdAt) }}
              </strong>

            </div>


            <div>

              <span>
                Transaction Type
              </span>

              <strong>
                {{ transaction.transactionType }}
              </strong>

            </div>


            <div>

              <span>
                Reference
              </span>

              <strong>
                {{ transaction.reference || "N/A" }}
              </strong>

            </div>


            <div>

              <span>
                Status
              </span>

              <strong>
                {{ transaction.status }}
              </strong>

            </div>


            <!-- RESOLVE BUTTON -->

            <button
              class="resolve-button"
              :disabled="
                resolvingTransaction === transaction.id
              "
              @click="
                resolveWithdrawal(transaction.id)
              "
            >

              {{
                resolvingTransaction === transaction.id
                  ? "Resolving..."
                  : "Resolve Withdrawal"
              }}

            </button>

          </div>


        </div>

      </section>



      <!-- =====================================================
           DEFAULT VIEW
      ====================================================== -->

      <section
        v-if="!activeSection"
        class="welcome-section"
      >

        <div class="welcome-icon">
          📊
        </div>

        <h2>
          Welcome to TradeGame Admin
        </h2>

        <p>
          Select an item from the menu
          to view its details.
        </p>

      </section>


    </main>

  </div>

</template>



<script>

import axios from "axios";


export default {

  name: "AdminPage",


  data() {

    return {

      // ==========================================
      // CURRENT SECTION
      // ==========================================

      activeSection: "users",


      // ==========================================
      // API URL
      // ==========================================

      API_URL:
        import.meta.env.VITE_APP_BASE_URL,


      // ==========================================
      // DASHBOARD DATA
      // ==========================================

      stats: {

        users: 0,

        issues: 0,

        platformFees: 0,

        totalUserBalance: 0,

        activeInvestments: 0,

        awaitingInvestments: 0,

        pendingWithdrawals: 0,

      },


      // ==========================================
      // WITHDRAWALS
      // ==========================================

      withdrawalTransactions: [],


      loadingWithdrawals: false,


      openedWithdrawal: null,


      resolvingTransaction: null,

    };

  },


  // ==================================================
  // MOUNTED
  // ==================================================

  async mounted() {

    await this.loadDashboard();

  },


  methods: {


    // ==================================================
    // FORMAT NUMBERS
    // ==================================================

    formatNumber(value) {

      return Number(value || 0)
        .toLocaleString("en-NG");

    },


    // ==================================================
    // FORMAT DATE
    // ==================================================

    formatDate(date) {

      if (!date) {
        return "N/A";
      }


      return new Date(date).toLocaleString(
        "en-NG",
        {
          dateStyle: "medium",
          timeStyle: "short"
        }
      );

    },


    // ==================================================
    // LOAD DASHBOARD
    // ==================================================

    async loadDashboard() {

      try {

        this.loadingWithdrawals = true;


        const response = await axios.get(
          `${this.API_URL}/api/admin/dashboard`
        );


        // ==========================================
        // UPDATE STATISTICS
        // ==========================================

        if (response.data.stats) {

          this.stats = {

            ...this.stats,

            ...response.data.stats,

          };

        }


        // ==========================================
        // UPDATE WITHDRAWALS
        // ==========================================

        this.withdrawalTransactions =
          response.data.withdrawalTransactions || [];


      } catch (error) {

        console.error(
          "Failed to load admin dashboard:",
          error
        );

      } finally {

        this.loadingWithdrawals = false;

      }

    },


    // ==================================================
    // OPEN / CLOSE WITHDRAWAL
    // ==================================================

    toggleWithdrawal(id) {

      if (this.openedWithdrawal === id) {

        this.openedWithdrawal = null;

      } else {

        this.openedWithdrawal = id;

      }

    },


    // ==================================================
    // RESOLVE WITHDRAWAL
    // ==================================================

    async resolveWithdrawal(id) {

      try {

        this.resolvingTransaction = id;


        await axios.put(
          `${this.API_URL}/api/admin/transactions/${id}/resolve`
        );


        // ==========================================
        // CLOSE CURRENT DROPDOWN
        // ==========================================

        this.openedWithdrawal = null;


        // ==========================================
        // REFRESH DASHBOARD
        // ==========================================

        await this.loadDashboard();


      } catch (error) {

        console.error(
          "Failed to resolve withdrawal:",
          error
        );


        alert(
          error.response?.data?.error ||
          "Failed to resolve withdrawal."
        );

      } finally {

        this.resolvingTransaction = null;

      }

    },


  },

};

</script>



<style scoped>


/* =====================================================
   PAGE
===================================================== */

.admin-page {

  min-height: 100vh;

  display: flex;

  background: #f5f7fa;

  color: #222;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

}


/* =====================================================
   SIDEBAR
===================================================== */

.sidebar {

  width: 250px;

  min-width: 250px;

  background: #111;

  color: white;

  min-height: 100vh;

  padding: 20px 12px;

  box-sizing: border-box;

}


.admin-logo {

  padding:
    4px
    12px
    20px;

  border-bottom:
    1px solid #333;

  margin-bottom: 12px;

}


.admin-logo h1 {

  margin: 0;

  font-size: 25px;

  color: #fff;

}


.admin-logo span {

  display: block;

  margin-top: 4px;

  color: #aaa;

  font-size: 12px;

}


/* =====================================================
   MENU
===================================================== */

.admin-menu {

  display: flex;

  flex-direction: column;

  gap: 5px;

}


.admin-menu button,
.admin-menu-link {

  width: 100%;

  border: none;

  background: transparent;

  color: #ddd;

  text-decoration: none;

  padding: 11px 10px;

  display: flex;

  align-items: center;

  gap: 12px;

  border-radius: 7px;

  cursor: pointer;

  text-align: left;

  box-sizing: border-box;

}


.admin-menu button:hover,
.admin-menu-link:hover {

  background: #242424;

  color: white;

}


.admin-menu button.active {

  background: #e31b23;

  color: white;

}


.admin-menu-link span,
.admin-menu button span {

  font-size: 19px;

  width: 25px;

  text-align: center;

}


.admin-menu button div,
.admin-menu-link div {

  display: flex;

  flex-direction: column;

  min-width: 0;

}


.admin-menu strong {

  font-size: 13px;

}


.admin-menu small {

  color: #999;

  font-size: 10px;

  margin-top: 2px;

}


.admin-menu button.active small {

  color: #eee;

}


/* =====================================================
   MAIN CONTENT
===================================================== */

.main-content {

  flex: 1;

  min-width: 0;

}


/* =====================================================
   HEADER
===================================================== */

.dashboard-header {

  height: 70px;

  background: white;

  border-bottom:
    1px solid #e5e5e5;

  padding:
    0 28px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  box-sizing: border-box;

}


.dashboard-header h2 {

  margin: 0;

  font-size: 20px;

}


.dashboard-header p {

  margin:
    4px
    0
    0;

  color: #777;

  font-size: 12px;

}


.admin-status {

  font-size: 12px;

  color: #555;

  display: flex;

  align-items: center;

  gap: 7px;

}


.status-dot {

  width: 8px;

  height: 8px;

  background: #19a974;

  border-radius: 50%;

}


/* =====================================================
   CONTENT
===================================================== */

.content-section {

  margin: 22px;

  background: white;

  border-radius: 10px;

  border:
    1px solid #e6e6e6;

  padding: 22px;

  max-width: 850px;

}


.section-heading {

  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 25px;

}


.section-heading > div {

  display: flex;

  align-items: center;

  gap: 10px;

}


.section-heading h2 {

  margin: 0;

  font-size: 20px;

}


.section-icon {

  font-size: 22px;

}


/* =====================================================
   LARGE STAT
===================================================== */

.large-stat {

  padding: 25px;

  border-radius: 8px;

  background: #f5f7fa;

  display: flex;

  align-items: center;

  justify-content: space-between;

}


.large-stat span {

  color: #666;

  font-size: 14px;

}


.large-stat strong {

  font-size: 28px;

  color: #111;

}


.large-stat.warning strong {

  color: #e31b23;

}


/* =====================================================
   DESCRIPTION
===================================================== */

.section-description {

  margin:
    15px
    0
    0;

  color: #777;

  font-size: 13px;

}


/* =====================================================
   WITHDRAWALS
===================================================== */

.withdrawal-loading,
.no-withdrawals {

  margin-top: 20px;

  padding: 20px;

  text-align: center;

  color: #777;

  background: #f5f7fa;

  border-radius: 8px;

}


.withdrawal-card {

  margin-top: 12px;

  border:
    1px solid #e2e2e2;

  border-radius: 8px;

  overflow: hidden;

  background: white;

}


.withdrawal-summary {

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 14px 16px;

}


.withdrawal-summary > div {

  display: flex;

  flex-direction: column;

  gap: 4px;

}


.withdrawal-summary strong {

  font-size: 17px;

  color: #111;

}


.withdrawal-summary small {

  font-size: 10px;

  color: #888;

}


.dropdown-button {

  border: none;

  background: #f5f7fa;

  width: 32px;

  height: 32px;

  border-radius: 6px;

  cursor: pointer;

}


.dropdown-button:hover {

  background: #e9e9e9;

}


/* =====================================================
   WITHDRAWAL DETAILS
===================================================== */

.withdrawal-details {

  border-top:
    1px solid #e5e5e5;

  padding: 15px;

  background: #fafafa;

}


.withdrawal-details > div {

  display: flex;

  justify-content: space-between;

  gap: 20px;

  padding: 8px 0;

  border-bottom:
    1px solid #eee;

}


.withdrawal-details span {

  color: #777;

  font-size: 12px;

}


.withdrawal-details strong {

  color: #222;

  font-size: 12px;

  text-align: right;

  word-break: break-word;

}


/* =====================================================
   RESOLVE BUTTON
===================================================== */

.resolve-button {

  width: 100%;

  margin-top: 15px;

  padding: 11px;

  border: none;

  border-radius: 7px;

  background: #19a974;

  color: white;

  font-size: 13px;

  font-weight: 600;

  cursor: pointer;

}


.resolve-button:hover {

  background: #148b5f;

}


.resolve-button:disabled {

  opacity: 0.6;

  cursor: not-allowed;

}


/* =====================================================
   WELCOME
===================================================== */

.welcome-section {

  text-align: center;

  padding: 80px 20px;

}


.welcome-icon {

  font-size: 45px;

  margin-bottom: 15px;

}


.welcome-section h2 {

  margin:
    0
    0
    8px;

}


.welcome-section p {

  color: #777;

}


/* =====================================================
   PHONE
===================================================== */

@media (max-width: 700px) {

  .admin-page {

    display: block;

  }


  .sidebar {

    width: 100%;

    min-width: 0;

    min-height: auto;

    padding: 12px;

  }


  .admin-logo {

    padding:
      4px
      8px
      12px;

    margin-bottom: 8px;

  }


  .admin-logo h1 {

    font-size: 20px;

  }


  .admin-menu {

    display: grid;

    grid-template-columns:
      repeat(2, 1fr);

    gap: 5px;

  }


  .admin-menu button,
  .admin-menu-link {

    padding:
      9px
      8px;

  }


  .admin-menu strong {

    font-size: 11px;

  }


  .admin-menu small {

    font-size: 9px;

  }


  .admin-menu button span,
  .admin-menu-link span {

    font-size: 17px;

    width: 20px;

  }


  .dashboard-header {

    height: auto;

    min-height: 65px;

    padding:
      12px
      15px;

  }


  .dashboard-header h2 {

    font-size: 17px;

  }


  .admin-status {

    font-size: 10px;

  }


  .content-section {

    margin: 12px;

    padding: 15px;

  }


  .large-stat {

    padding:
      18px
      14px;

  }


  .large-stat strong {

    font-size: 23px;

  }


  .large-stat span {

    font-size: 12px;

  }


  .withdrawal-details > div {

    flex-direction: column;

    gap: 3px;

  }


  .withdrawal-details strong {

    text-align: left;

  }

}


/* =====================================================
   SMALL PHONE
===================================================== */

@media (max-width: 400px) {

  .admin-menu {

    grid-template-columns:
      1fr 1fr;

  }


  .admin-menu button,
  .admin-menu-link {

    gap: 7px;

    padding:
      8px
      6px;

  }


  .admin-menu strong {

    font-size: 10px;

  }


  .admin-menu small {

    font-size: 8px;

  }

}

</style>