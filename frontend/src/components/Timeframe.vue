<template>
  <div class="timeframe-container">
    <!-- Add the "Timeframe Countdown" label -->
    <h2 class="timeframe-label">Timeframe Countdown</h2>

    <div
      v-for="(time, label) in countdowns"
      :key="label"
      class="timeframe-box"
    >
      <h3>{{ label }}</h3>
      <p>{{ time }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "Timeframe",
  data() {
    return {
      timeframes: {
        "5m": 5 * 60, // 5 minutes in seconds
        "15m": 15 * 60, // 15 minutes in seconds
        "30m": 30 * 60, // 30 minutes in seconds
        "1h": 60 * 60, // 1 hour in seconds
        "4h": 4 * 60 * 60, // 4 hours in seconds
        "1d": 24 * 60 * 60, // 1 day in seconds
      },
      countdowns: {}, // Holds the formatted countdown strings
    };
  },
  methods: {
    calculateCountdown(label, duration) {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0, // 12:00 a.m. hour
        0,
        0
      );

      // Calculate the next cycle's end time
      const elapsed = Math.floor((now - startOfDay) / 1000); // Seconds since 12:00 a.m.
      const nextEnd = Math.ceil(elapsed / duration) * duration; // Next end time in seconds

      const remaining = nextEnd - elapsed; // Seconds remaining until cycle ends
      return remaining > 0 ? remaining : duration; // Reset for next cycle
    },
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    },
    updateCountdowns() {
      Object.keys(this.timeframes).forEach((label) => {
        const duration = this.timeframes[label];
        const remaining = this.calculateCountdown(label, duration);
        this.countdowns[label] = this.formatTime(remaining);
      });
    },
  },
  mounted() {
    // Initialize countdowns
    this.updateCountdowns();

    // Update every second
    setInterval(() => {
      this.updateCountdowns();
    }, 1000);
  },
};
</script>

<style>
/* Container for the countdown timers */
.timeframe-container {
  display: flex;
  gap: 0.6rem; /* Reduced gap */
  justify-content: center;
  align-items: center;
  background-color: lightblue;
  padding: 0.6rem; /* Reduced padding */
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap; /* Ensure they wrap on smaller screens */
  height: auto; /* Adjust height automatically based on content */
}

/* Timeframe Countdown label */
.timeframe-label {
  width: 100%;
  text-align: center;
  font-size: 1.2rem; /* Slightly smaller font size */
  font-weight: bold;
  color: yellow; /* Dark blue color */
  margin-bottom: 0.6rem; /* Reduced margin */
}

/* Individual timer box styling */
.timeframe-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 0.3rem 0.6rem; /* Reduced padding */
  width: 69px; /* Reduced width */
  height: 47px; /* Reduced width */
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.6rem; /* Reduced bottom margin */
}

/* Timer title styling */
.timeframe-box h3 {
  margin: 0;
  color: #4caf50;
  font-size: 0.9rem; /* Slightly smaller font size for the title */
}

/* Timer time styling */
.timeframe-box p {
  margin: 0.3rem 0 0;
  font-size: 1rem; /* Reduced font size */
  color: #333;
  font-weight: bold;
}
.timeframe-container {
  background-image: url('@/assets/background4.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  height: 25vh;
  width: 100%;
}
</style>
