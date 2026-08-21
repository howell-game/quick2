<template>
<div>
  <div class="deposit-container">
    <div class="h1">Deposit Funds</div>
    <form @submit.prevent="handleDeposit">
      <div>
        <label for="amount">Deposit Amount</label>
        <input type="number" v-model="amount" id="amount" required />
      </div>
      <button type="submit">Deposit</button>
    </form>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';

export default {
  data() {
    return {
      amount: 0,
      error: null,
    };
  },
  computed: {
    ...mapGetters(['userId']), // Access userId from the store
  },
  methods: {
    async handleDeposit() {
      try {
        this.error = null;
        const response = await axios.post(
    `${import.meta.env.VITE_APP_BASE_URL}/api/transactions/deposit`, // Use import.meta.env for Vite
    { userId: this.userId, amount: this.amount });
        window.location.href = response.data.paymentLink; // Redirect to Flutterwave payment
      } catch (err) {
        this.error = err.response?.data?.error || 'An error occurred.';
      }
    },
  },
};
</script>

<style>
.error {
  color: red;
  margin-top: 10px;
}
.h1 {
  color: white;
}

.deposit-container  {
  text-align: center;
  margin: 20px auto;
  max-width: 900px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: lightyellow;
  }
</style>
