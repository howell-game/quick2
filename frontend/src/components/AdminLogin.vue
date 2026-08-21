<template>

  <div class="admin-login-page">

    <div class="admin-login-card">

      <div class="admin-login-logo">

        <h1>TradeGame</h1>

        <span>Admin Panel</span>

      </div>


      <div class="admin-login-heading">

        <h2>Admin Login</h2>

        <p>
          Sign in to manage the TradeGame platform.
        </p>

      </div>


      <form @submit.prevent="login">


        <!-- USERNAME -->

        <div class="form-group">

          <label>
            Username
          </label>

          <input
            v-model="username"
            type="text"
            placeholder="Enter admin username"
            autocomplete="username"
            :disabled="loading"
          />

        </div>


        <!-- PASSWORD -->

        <div class="form-group">

          <label>
            Password
          </label>

          <input
            v-model="password"
            type="password"
            placeholder="Enter password"
            autocomplete="current-password"
            :disabled="loading"
          />

        </div>


        <!-- ERROR -->

        <div
          v-if="errorMessage"
          class="login-error"
        >
          {{ errorMessage }}
        </div>


        <!-- LOGIN BUTTON -->

        <button
          type="submit"
          class="login-button"
          :disabled="loading"
        >

          {{
            loading
              ? "Signing in..."
              : "Login"
          }}

        </button>


      </form>


    </div>

  </div>

</template>


<script>

import axios from "axios";


export default {

  name: "AdminLogin",


  data() {

    return {

      username: "",

      password: "",

      loading: false,

      errorMessage: "",

    };

  },


  methods: {

    async login() {

      this.errorMessage = "";


      if (!this.username.trim()) {

        this.errorMessage =
          "Please enter your username.";

        return;

      }


      if (!this.password) {

        this.errorMessage =
          "Please enter your password.";

        return;

      }


      try {

        this.loading = true;


        const API_URL =
          import.meta.env.VITE_APP_BASE_URL;


        const response =
          await axios.post(
            `${API_URL}/api/admin/login`,
            {
              username:
                this.username.trim(),

              password:
                this.password,
            }
          );


        // ==========================================
        // SAVE ADMIN INFORMATION
        // ==========================================

        localStorage.setItem(
          "admin",
          JSON.stringify(
            response.data.admin
          )
        );


        localStorage.setItem(
          "adminLoggedIn",
          "true"
        );


        // ==========================================
        // GO TO ADMIN PAGE
        // ==========================================

        this.$router.push(
          "/adminpage"
        );


      } catch (error) {

        console.error(
          "Admin login error:",
          error
        );


        this.errorMessage =
          error.response?.data?.error ||
          "Unable to login.";

      } finally {

        this.loading = false;

      }

    },

  },

};

</script>


<style scoped>

.admin-login-page {

  min-height: 100vh;

  width: 100%;

  display: flex;

  align-items: center;

  justify-content: center;

  background: #f5f7fa;

  padding: 20px;

  box-sizing: border-box;

}


.admin-login-card {

  width: 100%;

  max-width: 400px;

  background: white;

  border: 1px solid #e5e5e5;

  border-radius: 12px;

  padding: 30px;

  box-shadow:
    0 8px 30px
    rgba(0, 0, 0, 0.08);

  box-sizing: border-box;

}


.admin-login-logo {

  text-align: center;

  margin-bottom: 25px;

  padding-bottom: 20px;

  border-bottom: 1px solid #eee;

}


.admin-login-logo h1 {

  margin: 0;

  color: #111;

  font-size: 27px;

  font-weight: 800;

}


.admin-login-logo span {

  display: block;

  margin-top: 5px;

  color: #999;

  font-size: 12px;

}


.admin-login-heading {

  margin-bottom: 22px;

}


.admin-login-heading h2 {

  margin: 0 0 6px;

  font-size: 21px;

  color: #222;

}


.admin-login-heading p {

  margin: 0;

  color: #777;

  font-size: 13px;

}


.form-group {

  margin-bottom: 17px;

}


.form-group label {

  display: block;

  margin-bottom: 7px;

  color: #444;

  font-size: 13px;

  font-weight: 600;

}


.form-group input {

  width: 100%;

  height: 44px;

  padding: 0 12px;

  border: 1px solid #dcdcdc;

  border-radius: 7px;

  outline: none;

  font-size: 14px;

  box-sizing: border-box;

}


.form-group input:focus {

  border-color: #e31b23;

}


.login-error {

  margin-bottom: 15px;

  padding: 10px 12px;

  background: #fff1f1;

  border: 1px solid #f1b5b5;

  border-radius: 6px;

  color: #d00000;

  font-size: 12px;

}


.login-button {

  width: 100%;

  height: 44px;

  border: none;

  border-radius: 7px;

  background: #e31b23;

  color: white;

  font-size: 14px;

  font-weight: 700;

  cursor: pointer;

}


.login-button:hover {

  background: #c9151d;

}


.login-button:disabled {

  opacity: 0.6;

  cursor: not-allowed;

}


@media (max-width: 450px) {

  .admin-login-card {

    padding: 23px 18px;

  }

}

</style>