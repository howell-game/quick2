<template>
  <div class="terms-container">
    <v-card class="card">
      <v-card-title>Terms & Conditions</v-card-title>
      <v-card-text>By using TrendGame, you agree to these terms. Please read them carefully before proceeding.</v-card-text>
    </v-card>

    <section class="user-responsibilities">
      <v-card class="card">
        <v-card-title>User Responsibilities</v-card-title>
        <v-card-text>
          <ul>
            <li>✔ Be at least 18 years old.</li>
            <li>✔ Provide accurate registration details.</li>
            <li>✔ Keep your login credentials secure.</li>
            <li>✔ Not engage in fraud or misuse of the platform.</li>
          </ul>
        </v-card-text>
      </v-card>
    </section>

    <section class="risk-disclaimer">
      <v-card class="card">
        <v-card-title>Selection Risks</v-card-title>
        <v-card-text>
          TrendGame does not guarantee profits. Selections are subject to supply and demand fluctuations, and users must trade responsibly.
        </v-card-text>
      </v-card>
    </section>

    <section class="withdrawal-policy">
      <v-card class="card">
        <v-card-title>Deposit & Withdrawal Policy</v-card-title>
        <v-card-text>
          All deposits and withdrawals are processed securely. Withdrawals may take up to 48 hours for verification and processing.
        </v-card-text>
      </v-card>
    </section>

    <section class="security">
      <v-card class="card">
        <v-card-title>Security & Fraud Prevention</v-card-title>
        <v-card-text>
          We prioritize security. Users must not engage in fraudulent activities, and suspicious transactions may lead to account suspension.
        </v-card-text>
      </v-card>
    </section>

    <section class="dispute-resolution">
      <v-card class="card">
        <v-card-title>Dispute Resolution</v-card-title>
        <v-card-text>
          If you have concerns, contact our support team. Disputes will be reviewed fairly, but no refunds will be issued once selections are placed.
        </v-card-text>
      </v-card>
    </section>

    <section class="terms-update">
      <v-card class="card">
        <v-card-title>Changes to Terms</v-card-title>
        <v-card-text>We may update these terms at any time. Users will be notified of significant changes.</v-card-text>
      </v-card>
    </section>

    <footer>
      <router-link to="/" class="accept-btn">✔ Accept & Continue</router-link>
    </footer>
  </div>
</template>

<style scoped>
.terms-container {
  text-align: center;
  margin: 20px auto;
  max-width: 800px;
}

.card {
  margin: 10px 0;
  padding: 15px;
  background: lightyellow;
  color: black;
}

ul {
  list-style-type: none;
  padding: 0;
}

ul li {
  background: lightyellow;
  margin: 5px;
  padding: 10px;
  border-radius: 5px;
  color: black;
}

.accept-btn {
  display: block;
  text-align: center;
  margin-top: 20px;
  padding: 10px;
  background: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 5px;
}
</style>
