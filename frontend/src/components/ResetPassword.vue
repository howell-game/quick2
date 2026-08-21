<template>
  <div class="reset-password">
    <h2>Reset Your Password</h2>
    <p>Enter a new password below</p>

    <!-- New Password Input -->
    <div class="password-container">
      <input
        v-model="newPassword"
        :type="showPassword ? 'text' : 'password'"
        placeholder="New Password"
        @input="validatePassword"
      />
      <button type="button" @click="togglePasswordVisibility">
        {{ showPassword ? "👁️" : "🙈" }}
      </button>
    </div>

    <!-- Confirm Password Input -->
    <div class="password-container">
      <input
        v-model="confirmPassword"
        :type="showPassword ? 'text' : 'password'"
        placeholder="Confirm Password"
      />
    </div>

    <!-- Password Strength Indicators -->
    <div class="password-indicators">
      <p :class="{ valid: hasUppercase }">✔ Uppercase Letter</p>
      <p :class="{ valid: hasLowercase }">✔ Lowercase Letter</p>
      <p :class="{ valid: hasNumber }">✔ Number</p>
      <p :class="{ valid: hasSpecialChar }">✔ Special Character (!@#$%^&*)</p>
      <p :class="{ valid: isMinLength }">✔ At least 8 characters</p>
    </div>

    <button @click="resetPassword" :disabled="!isPasswordValid">
      Reset Password
    </button>

    <p v-if="message" :class="message.includes('successful') ? 'success' : 'message'">
      {{ message }}
    </p>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      newPassword: "",
      confirmPassword: "",
      showPassword: false,
      message: "",
      token: "",

      // Password validation flags
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false,
      isMinLength: false,
    };
  },
  computed: {
    isPasswordValid() {
      return (
        this.hasUppercase &&
        this.hasLowercase &&
        this.hasNumber &&
        this.hasSpecialChar &&
        this.isMinLength
      );
    },
  },
  created() {
    this.token = this.$route.params.token;
  },
  methods: {
    validatePassword() {
      this.hasUppercase = /[A-Z]/.test(this.newPassword);
      this.hasLowercase = /[a-z]/.test(this.newPassword);
      this.hasNumber = /[0-9]/.test(this.newPassword);
      this.hasSpecialChar = /[!@#$%^&*]/.test(this.newPassword);
      this.isMinLength = this.newPassword.length >= 8;
    },
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    async resetPassword() {
      if (!this.isPasswordValid) {
        this.message = "Password does not meet requirements!";
        return;
      }

      if (this.newPassword !== this.confirmPassword) {
        this.message = "Passwords do not match!";
        return;
      }

      try {
        const response = await axios.post(
  `${import.meta.env.VITE_APP_BASE_URL}/auth/reset-password/${this.token}`,
  { newPassword: this.newPassword }
);

        this.message = response.data.message;
      } catch (error) {
        this.message = error.response?.data.message || "Error resetting password";
      }
    },
  },
};
</script>

<style scoped>
/* General Styling */
.reset-password {
  text-align: center;
  margin: 20px auto;
  max-width: 900px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: lightyellow;
}

/* Input Fields */
input {
  width: calc(100% - 40px);
  padding: 10px;
  margin: 10px 0;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
}

/* Password Container */
.password-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 5px;
}

.password-container input {
  border: none;
  flex-grow: 1;
}

.password-container button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
}

/* Password Strength Indicators */
.password-indicators {
  text-align: left;
  font-size: 14px;
}

.password-indicators p {
  color: red;
  margin: 5px 0;
}

.password-indicators .valid {
  color: green;
}

/* Buttons */
button {
  width: 100%;
  padding: 10px;
  background-color: red;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: darkred;
}

button:disabled {
  background-color: gray;
  cursor: not-allowed;
}

/* Messages */
.message {
  margin-top: 10px;
  color: red;
}

.success {
  color: green;
}
</style>
