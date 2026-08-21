<template>
  <div class="forgot-password">
    <h2>Forgot Password?</h2>
    <p>Enter your email to receive a reset link</p>
    <input v-model="email" type="email" placeholder="Enter your email" />
    <button @click="sendResetLink">Send Reset Link</button>
    <p v-if="message" class="message">{{ message }}</p>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      email: "",
      message: "",
    };
  },
  methods: {
    async sendResetLink() {
      try {
        const response = await axios.post(
  `${import.meta.env.VITE_APP_BASE_URL}/auth/forgot-password`, 
  { email: this.email });
          this.message = response.data.message;
      } catch (error) {
        this.message = error.response?.data.message || "Error sending reset link";
      }
    },
  },
};
</script>

<style scoped>
.forgot-password {
  max-width: 900px;
  margin: auto;
  text-align: center;
   text-align: center;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: lightyellow;
}
input {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
}


button {
  width: 100%;
  padding: 10px 20px;
  background-color: red; /* Default button color */
  color: white; /* Text color */
  border: none; /* Remove default border */
  border-radius: 4px; /* Rounded corners */
  cursor: pointer; /* Pointer cursor on hover */
  font-size: 16px;
  transition: background-color 0.3s ease; /* Smooth transition for color change */
}

button:hover {
  background-color: darkred; /* Dark red when hovered */
}

button:active {
  background-color: #8B0000; /* Darker red when clicked */
}

.message {
  margin-top: 10px;
  color: green;
}
</style>
