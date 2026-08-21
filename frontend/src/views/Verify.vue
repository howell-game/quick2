<template>
  <div class="verify">
    <h2>Email Verification</h2>
    <p>{{ message }}</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      message: 'Verifying your email...',
    };
  },
  async created() {
    try {
      const { userId } = this.$route.params;
      const response = await axios.get(`/auth/verify/${userId}`);
      this.message = response.data.message;
    } catch (error) {
      this.message = error.response?.data?.message || 'Verification failed';
    }
  },
};
</script>

<style>
.verify {
  text-align: center;
  margin: 20px auto;
  max-width: 900px;
  font-family: Arial, sans-serif;
  font-size: 18px;
}
</style>
