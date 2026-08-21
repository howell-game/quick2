<template>
  <div class="color">
    <h1>Payment Successful</h1>
    <p>Your payment has been successfully processed.</p>
    <router-link to="/">Go Back to Home</router-link>
  </div>
</template>

<script>
import axios from "axios";
import { mapActions } from "vuex";

export default {
  name: "PaymentSuccess",
  data() {
    return {
      transactionId: null,
      transactionStatus: null,
      transactionRef: null,
    };
  },
  created() {
    const query = this.$route.query;
    this.transactionId = query.transaction_id;
    this.transactionStatus = query.status;
    this.transactionRef = query.tx_ref;

    if (this.transactionStatus === "successful") {
      this.verifyAndUpdate();
    }
  },
  methods: {
    ...mapActions(["logIn"]),

    async verifyAndUpdate() {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_APP_BASE_URL}/api/transactions/update`,
          {
            transaction_id: this.transactionId,
            tx_ref: this.transactionRef,
          }
        );

        const updatedBalance = response.data.newBalance;

        // Update Vuex state
        this.$store.commit("updateBalance", updatedBalance);

        // Update local storage
        localStorage.setItem("balance", updatedBalance);

        // Re-log user in with updated balance
        this.logIn({
          name: localStorage.getItem("userName"),
          userId: localStorage.getItem("userId"),
          balance: updatedBalance,
          token: localStorage.getItem("token"),
        });

        console.log("Balance updated and session refreshed.");

      } catch (error) {
        console.error("Verification failed:", error.response?.data || error.message);
        alert("Payment was successful, but verification failed. Please contact support.");
      }
    },
  },
};
</script>

<style>
p {
  margin: 20px 0;
}
/* Background Box */
.color {
  text-align: center;
  margin: 20px auto;
  max-width: 900px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: lightyellow;
}
</style>
