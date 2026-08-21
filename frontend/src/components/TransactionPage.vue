<template>
  <div class="transaction-page">
    <h2>Transaction History</h2>

    <div v-if="transactions.length === 0">Loading transactions.</div>

    <div v-for="(transaction, index) in transactions" :key="index" class="transaction-item">
      <button @click="toggleDropdown(index)">
        {{ transaction.type }} ({{ formatDate(transaction.createdAt) }})
      </button>

      <div v-if="openDropdown === index" class="transaction-details">
        <p><strong>Amount:</strong> {{ transaction.amount }}</p>
        <p><strong>Status:</strong> {{ transaction.status }}</p>
        <p v-if="transaction.transactionId"><strong>Transaction ID:</strong> {{ transaction.transactionId }}</p>
        <p v-if="transaction.reference"><strong>Reference:</strong> {{ transaction.reference }}</p>
        <p v-if="transaction.account_bank"><strong>Bank:</strong> {{ transaction.account_bank }}</p>
        <p v-if="transaction.account_number"><strong>Account Number:</strong> {{ transaction.account_number }}</p>
        <p><strong>Created At:</strong> {{ formatDate(transaction.createdAt) }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { mapGetters } from "vuex";

export default {
  data() {
    return {
      transactions: [],
      openDropdown: null, // Stores the index of the open dropdown
    };
  },
  computed: {
    ...mapGetters(["userId"]), // Get userId from Vuex store
  },
  methods: {
    async fetchTransactions() {
      try {
        if (!this.userId) return; // Ensure userId is available

       const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/transactions/transactions/${this.userId}`);

        if (response.data) {
          // Combine deposits and withdrawals, sorting them by createdAt
          this.transactions = [...response.data.deposits.map(d => ({ ...d, type: "Deposit" })), 
                               ...response.data.withdrawals.map(w => ({ ...w, type: "Withdrawal" })) ]
                               .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    },
    toggleDropdown(index) {
      this.openDropdown = this.openDropdown === index ? null : index;
    },
    formatDate(datetime) {
      return new Date(datetime).toLocaleString(); // Convert to human-readable format
    }
  },
  watch: {
    userId(newVal) {
      if (newVal) this.fetchTransactions(); // Refetch when userId is available
    }
  },
  mounted() {
    this.fetchTransactions();
  }
};
</script>

<style scoped>
.transaction-page {
  text-align: center;
  margin: 20px auto;
  
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: lightyellow;
}
.transaction-item {
  margin-bottom: 10px;
}
button {
  width: 100%;
  padding: 10px;
  text-align: left;
  border: none;
  background-color:#003366;
  cursor: pointer;
  font-weight: bold;
}
.transaction-details {
  padding: 10px;
  border: 1px solid #ddd;
  background-color: #fff;
}
</style>
