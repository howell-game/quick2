<template>
  <div class="color">
    <div class="signup">
      <h2>Sign Up</h2>
      <form @submit.prevent="handleSignup">
        <!-- Name Field -->
        <div>
          <label for="name">Name:</label>
          <input id="name" type="text" v-model="name" required />
        </div>

        <!-- Email Field -->
        <div>
          <label for="email">Email:</label>
          <input id="email" type="email" v-model="email" required />
        </div>

        <!-- Password Field -->
        <div class="password-container">
          <label for="password">Password:</label>
          <input
            id="password"
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            @input="validatePassword"
            required
          />
        </div>

        <!-- Password Visibility Toggle Button -->
        <div class="password-toggle">
          <button type="button" @click="togglePasswordVisibility">
            {{ showPassword ? "👁️" : "🙈" }} Toggle Password Visibility
          </button>
        </div>

        <!-- Password Strength Indicators -->
        <div class="password-indicators">
          <p :class="{ valid: hasUppercase }">✔ Uppercase Letter</p>
          <p :class="{ valid: hasLowercase }">✔ Lowercase Letter</p>
          <p :class="{ valid: hasNumber }">✔ Number</p>
          <p :class="{ valid: hasSpecialChar }">✔ Special Character (!@#$%^&*)</p>
          <p :class="{ valid: isMinLength }">✔ At least 8 characters</p>
        </div>

        <!-- Submit Button -->
        <div>
          <button type="submit" :disabled="!isPasswordValid">Sign Up</button>
        </div>
      </form>

      <!-- Success or Error Message -->
      <p v-if="message" :class="{ success: isSuccess, error: !isSuccess }">{{ message }}</p>
    </div>
     <div>
    <p>Already A User? Login <router-link to="/login">HERE</router-link> </p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      name: '',
      email: '',
      password: '',
      showPassword: false,
      message: '',
      isSuccess: false,
      referralCode: '', // 👈 add this

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
      return this.hasUppercase && this.hasLowercase && this.hasNumber && this.hasSpecialChar && this.isMinLength;
    },
  },
  
mounted() {
  this.referralCode = this.$route.query.ref || '';
},
  methods: {
    validatePassword() {
      this.hasUppercase = /[A-Z]/.test(this.password);
      this.hasLowercase = /[a-z]/.test(this.password);
      this.hasNumber = /[0-9]/.test(this.password);
      this.hasSpecialChar = /[!@#$%^&*]/.test(this.password);
      this.isMinLength = this.password.length >= 8;
    },
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    async handleSignup() {
      if (!this.isPasswordValid) {
        this.message = 'Password does not meet requirements.';
        this.isSuccess = false;
        return;
      }

      try {
       const response = await axios.post(
  `${import.meta.env.VITE_APP_BASE_URL}/auth/signup`,
  {
    name: this.name,
    email: this.email,
    password: this.password,
    ref: this.referralCode, // 👈 send referral
  }
);


        this.message = response.data.message;
        this.isSuccess = true;
        this.name = this.email = this.password = ''; // Clear form
        this.$router.push('/verify'); // Redirect after signup
      } catch (error) {
        this.message = error.response?.data?.error || 'Sign-up failed';
        this.isSuccess = false;
      }
    },
  },
};
</script>

<style>
/* General Styling */
.signup {
  text-align: center;
  margin: 20px auto;
  max-width: 900px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
}

/* Password Field Styling */
.password-container {
  margin-bottom: 10px;
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

/* Password Visibility Toggle Button */
.password-toggle {
  margin-top: 5px;
  text-align: left;
   background-color: gray; /* Set the toggle button color to grey */
}

button {
  width: 100%;
  padding: 10px;
  
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 16px;
  border-radius: 5px;
}

button:hover {
  background-color: darkgray;
}

button:disabled {
  background-color: gray;
  cursor: not-allowed;
}

/* Success/Error Message */
.success {
  color: green;
}

.error {
  color: red;
}

/* Background Box */
.color {
  text-align: center;
  margin: 20px auto;
  max-width: 400px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: lightyellow;
}
</style>
