<template>
  <div class="app">

    <!-- =========================
         HEADER
    ========================== -->
    <header
      v-if="!isAdminPage"
      class="main-header"
      :class="{ 'header-hidden': isHeaderHidden }"
    >

      <div class="logo-container">
        <h1 class="quick">TrendGame9ja</h1>
      </div>

      <nav v-if="!isHiddenPage" class="main-nav">

        <router-link to="/advice">
          HowToPlay
        </router-link>

        <router-link
          v-if="isLoggedIn"
          :to="`/profile/${user?.userId}/`"
        >
          Profile
        </router-link>

        <router-link
          v-if="!isLoggedIn"
          to="/signup"
        >
          Sign Up
        </router-link>

        <router-link
          v-if="!isLoggedIn"
          to="/login"
        >
          Login
        </router-link>

        <a
          v-if="isLoggedIn"
          href="#"
          @click.prevent="logout"
        >
          Logout
        </a>

      </nav>

    </header>


    <!-- =========================
         TIMEFRAME
    ========================== -->
    <div
      v-if="!isAdminPage"
      class="timeframe-wrapper"
      :class="{ 'timeframe-raised': isHeaderHidden }"
    >
      <Timeframe />
    </div>


    <!-- =========================
         BANNER CAROUSEL
    ========================== -->
    <div
      v-if="!isAdminPage"
      class="banner-wrapper"
    >
      <BannerCarousel />
    </div>


    <!-- =========================
         MAIN CONTENT
    ========================== -->
    <main>
      <router-view />
    </main>


    <!-- =========================
         FOOTER
    ========================== -->
    <footer
      v-if="!isAdminPage && !isHiddenPage"
    >

      <nav class="footer-nav">

        <router-link to="/about/">
          About Us
        </router-link>

        <span class="footer-divider">|</span>

        <router-link to="/terms/">
          Terms & Conditions
        </router-link>

      </nav>

      <p>
        © 2026 TrendGame. All Rights Reserved.
      </p>

    </footer>

  </div>
</template>


<script>
import { mapState, mapActions } from "vuex";

import Timeframe from "./components/Timeframe.vue";
import BannerCarousel from "./components/BannerCarousel.vue";


export default {

  name: "App",


  components: {
    Timeframe,
    BannerCarousel,
  },


  data() {

    return {

      // =========================
      // HEADER SCROLL STATE
      // =========================
      isHeaderHidden: false,

      lastScrollPosition: 0,

      // =========================
      // LOGOUT TIMER
      // =========================
      logoutTimer: null,

    };

  },


  computed: {

    ...mapState([
      "isLoggedIn",
      "user",
    ]),


    // =========================
    // ADMIN PAGE
    // =========================
    isAdminPage() {

      return this.$route.path === "/adminpage";

    },


    // =========================
    // HIDDEN PAGES
    // =========================
    isHiddenPage() {

      const path = this.$route.path;

      return (
        path.startsWith("/share-profile") ||
        path.startsWith("/adminchat") ||
        path.startsWith("/share-terms") ||
        path.startsWith("/share-payment-success") ||
        path.startsWith("/share-deposit") ||
        path.startsWith("/share-withdrawal") ||
        path.startsWith("/share-signup") ||
        path.startsWith("/share-login") ||
        path.startsWith("/share-forgot-password") ||
        path.startsWith("/share-reset-password")
      );

    },

  },


  methods: {

    ...mapActions([
      "logIn",
      "logOut",
    ]),


    // =========================
    // LOGOUT
    // =========================
    logout() {

      this.logOut();

      this.$router.push("/login");

    },


    // =========================
    // HEADER SCROLL BEHAVIOR
    // =========================
    handleScroll() {

      const currentScrollPosition = window.scrollY;


      // ---------------------------------
      // At the very top
      // ---------------------------------
      if (currentScrollPosition <= 10) {

        this.isHeaderHidden = false;

        this.lastScrollPosition =
          currentScrollPosition;

        return;

      }


      // ---------------------------------
      // Scrolling DOWN
      // Hide header
      // ---------------------------------
      if (
        currentScrollPosition >
        this.lastScrollPosition
      ) {

        this.isHeaderHidden = true;

      }


      // ---------------------------------
      // Scrolling UP
      // Show header
      // ---------------------------------
      else if (
        currentScrollPosition <
        this.lastScrollPosition
      ) {

        this.isHeaderHidden = false;

      }


      this.lastScrollPosition =
        currentScrollPosition;

    },


    // =========================
    // RESET LOGOUT TIMER
    // =========================
    resetTimer() {

      clearTimeout(this.logoutTimer);


      this.logoutTimer = setTimeout(() => {

        if (this.isLoggedIn) {

          this.logout();

        }

      }, 3600000);

    },


    // =========================
    // USER ACTIVITY
    // =========================
    activityListener() {

      window.addEventListener(
        "mousemove",
        this.resetTimer
      );

      window.addEventListener(
        "keydown",
        this.resetTimer
      );

      window.addEventListener(
        "click",
        this.resetTimer
      );

      this.resetTimer();

    },

  },


  // =========================
  // MOUNTED
  // =========================
  mounted() {

    this.activityListener();


    window.addEventListener(
      "scroll",
      this.handleScroll,
      { passive: true }
    );


    this.lastScrollPosition =
      window.scrollY;

  },


  // =========================
  // BEFORE UNMOUNT
  // =========================
  beforeUnmount() {

    window.removeEventListener(
      "mousemove",
      this.resetTimer
    );

    window.removeEventListener(
      "keydown",
      this.resetTimer
    );

    window.removeEventListener(
      "click",
      this.resetTimer
    );

    window.removeEventListener(
      "scroll",
      this.handleScroll
    );


    clearTimeout(
      this.logoutTimer
    );

  },

};
</script>


<style>

/* =========================================
   GLOBAL
========================================= */

* {
  box-sizing: border-box;
}


html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
}


body {
  font-family: Arial, Helvetica, sans-serif;
}


/* =========================================
   APP
========================================= */

.app {
  width: 100%;
  min-height: 100vh;
}


/* =========================================
   HEADER
========================================= */

.main-header {

  width: 100%;

  height: 65px;

  background: #111;

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 10px 30px;

  border-bottom: 2px solid #e31b23;

  position: relative;

  z-index: 1002;

  /*
   * Header slides upward when hidden.
   */
  transform: translateY(0);

  transition:
    transform 0.3s ease;

}


/* =========================================
   HIDDEN HEADER
========================================= */

.main-header.header-hidden {

  transform: translateY(-100%);

}


/* =========================================
   LOGO
========================================= */

.logo-container {

  display: flex;

  align-items: center;

}


.quick {

  margin: 0;

  color: white;

  font-size: 26px;

  font-weight: 800;

  letter-spacing: 0.5px;

}


/* =========================================
   MAIN NAVIGATION
========================================= */

.main-nav {

  display: flex;

  align-items: center;

  gap: 24px;

}


.main-nav a {

  color: #ffffff;

  text-decoration: none;

  font-size: 14px;

  font-weight: 600;

  padding: 8px 4px;

  transition:
    color 0.2s ease,
    border-color 0.2s ease;

}


.main-nav a:hover {

  color: #e31b23;

}


.main-nav a.router-link-active {

  color: #e31b23;

}


/* =========================================
   TIMEFRAME
========================================= */

.timeframe-wrapper {

  width: 100%;

  position: sticky;

  top: 0;

  z-index: 1001;

  background: white;

  /*
   * Normal position:
   * directly underneath header.
   */
  margin-top: 0;

  transition:
    margin-top 0.3s ease;

}


/* =========================================
   TIMEFRAME MOVES TO TOP
   WHEN HEADER DISAPPEARS
========================================= */

.timeframe-wrapper.timeframe-raised {

  /*
   * Header is 65px tall.
   * Remove its occupied space.
   */
  margin-top: -65px;

}


/* =========================================
   BANNER CAROUSEL
========================================= */

.banner-wrapper {

  width: 100%;

  height: 60px;

  margin: 0;

  padding: 0;

  overflow: hidden;

  position: relative;

}


/*
 * Keep BannerCarousel itself responsible
 * for its internal styling.
 */


/* =========================================
   MAIN
========================================= */

main {

  width: 100%;

  margin: 0;

  padding: 0;

}


/* =========================================
   FOOTER
========================================= */

footer {

  width: 100%;

  background: #111;

  color: #aaa;

  text-align: center;

  padding: 25px 20px;

  margin-top: 30px;

  border-top: 2px solid #e31b23;

}


/* =========================================
   FOOTER NAVIGATION
========================================= */

.footer-nav {

  display: flex;

  justify-content: center;

  align-items: center;

  gap: 18px;

  margin-bottom: 12px;

}


.footer-nav a {

  color: #ffffff;

  text-decoration: none;

  font-size: 14px;

  font-weight: 600;

  padding: 5px 8px;

  transition:
    color 0.2s ease;

}


.footer-nav a:hover {

  color: #e31b23;

}


.footer-nav a.router-link-active {

  color: #e31b23;

}


.footer-divider {

  color: #555;

  font-size: 13px;

}


footer p {

  margin: 0;

  color: #888;

  font-size: 12px;

}


/* =========================================
   PHONE
========================================= */

@media (max-width: 700px) {


  /* ---------------------------------------
     HEADER
  --------------------------------------- */

  .main-header {

    height: auto;

    min-height: 90px;

    padding: 12px 15px;

    flex-direction: column;

    gap: 10px;

  }


  /* ---------------------------------------
     HIDDEN MOBILE HEADER
  --------------------------------------- */

  .main-header.header-hidden {

    transform: translateY(-100%);

  }


  /* ---------------------------------------
     LOGO
  --------------------------------------- */

  .quick {

    font-size: 23px;

  }


  /* ---------------------------------------
     NAV
  --------------------------------------- */

  .main-nav {

    width: 100%;

    justify-content: center;

    flex-wrap: wrap;

    gap: 8px 18px;

  }


  .main-nav a {

    font-size: 13px;

    padding: 5px 3px;

  }


  /* ---------------------------------------
     TIMEFRAME
  --------------------------------------- */

  .timeframe-wrapper {

    margin-top: 0;

  }


  /*
   * Mobile header is approximately 90px.
   * Remove its occupied space when hidden.
   */

  .timeframe-wrapper.timeframe-raised {

    margin-top: -90px;

  }


  /* ---------------------------------------
     FOOTER
  --------------------------------------- */

  .footer-nav {

    gap: 10px;

    flex-wrap: wrap;

  }


  .footer-nav a {

    font-size: 13px;

  }

}


/* =========================================
   SMALL PHONE
========================================= */

@media (max-width: 400px) {


  .main-header {

    min-height: 85px;

    padding: 10px;

  }


  .quick {

    font-size: 21px;

  }


  .main-nav {

    gap: 6px 12px;

  }


  .main-nav a {

    font-size: 12px;

  }


  .timeframe-wrapper.timeframe-raised {

    margin-top: -85px;

  }


  footer {

    padding: 20px 10px;

  }

}

</style>