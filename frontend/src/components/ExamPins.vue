<template>
  <div class="overlay">

    <div class="modal">

      <div class="modal-header">

        <div>
          <h2>📝 Exam PINS</h2>
          <p>WAEC and JAMB examination PINs</p>
        </div>

        <button
          class="close-btn"
          @click="$emit('close')"
        >
          ×
        </button>

      </div>


      <div class="form-group">

        <label>Exam</label>

        <select
          v-model="selectedService"
          @change="loadPackages"
        >

          <option value="">
            Select exam
          </option>

          <option value="waec">
            WAEC Result Checker
          </option>

          <option value="waec-registration">
            WAEC Registration
          </option>

          <option value="jamb">
            JAMB PIN
          </option>

        </select>

      </div>


      <div
        v-if="packages.length"
        class="form-group"
      >

        <label>PIN Type</label>

        <select
          v-model="selectedPackage"
          @change="resetJAMBVerification"
        >

          <option :value="null">
            Select PIN type
          </option>

          <option
            v-for="item in packages"
            :key="item.variation_code"
            :value="item"
          >

            {{ item.name }}
            —
            ₦{{ Number(item.variation_amount).toLocaleString() }}

          </option>

        </select>

      </div>


      <div
        v-if="selectedService === 'jamb' && selectedPackage"
        class="form-group"
      >

        <label>JAMB Profile ID</label>

        <input
          v-model="profileId"
          type="text"
          placeholder="Enter JAMB Profile ID"
        />


        <button
          class="verify-btn"
          :disabled="verifying"
          @click="verifyJAMB"
        >

          {{
            verifying
              ? "Verifying..."
              : "Verify Profile ID"
          }}

        </button>


        <div
          v-if="customerName"
          class="verified"
        >

          ✓ {{ customerName }}

        </div>

      </div>


      <div class="form-group">

        <label>Phone Number</label>

        <input
          v-model="phoneNumber"
          type="tel"
          placeholder="08012345678"
        />

      </div>


      <div
        v-if="selectedPackage"
        class="summary"
      >

        <span>
          Amount
        </span>

        <strong>
          ₦{{
            Number(
              selectedPackage.variation_amount
            ).toLocaleString()
          }}
        </strong>

      </div>


      <div
        v-if="message"
        :class="[
          'message',
          isError
            ? 'error'
            : 'success'
        ]"
      >

        {{ message }}

      </div>


      <div
        v-if="purchased"
        class="pin-result"
      >

        <h3>🎉 PIN Purchased</h3>


        <div v-if="serialNumber">
          <strong>Serial Number</strong>
          <p>{{ serialNumber }}</p>
        </div>


        <div v-if="pin">
          <strong>PIN</strong>
          <p class="pin-value">
            {{ pin }}
          </p>
        </div>


        <div v-if="token">
          <strong>Token</strong>
          <p class="pin-value">
            {{ token }}
          </p>
        </div>

      </div>


      <button
        class="buy-btn"
        :disabled="!canBuy || buying"
        @click="buyPIN"
      >

        {{
          buying
            ? "Processing..."
            : "Buy PIN"
        }}

      </button>


      <div class="history">

        <h3>Recent Purchases</h3>

        <div
          v-if="transactions.length === 0"
          class="empty"
        >
          No exam PIN purchases yet.
        </div>


        <div
          v-for="transaction in transactions"
          :key="transaction.id"
          class="history-item"
        >

          <div>

            <strong>
              {{ transaction.examType }}
            </strong>

            <small>
              {{ transaction.packageName }}
            </small>

          </div>


          <span
            :class="
              transaction.status ===
              'SUCCESSFUL'
                ? 'status-success'
                : 'status-pending'
            "
          >

            {{ transaction.status }}

          </span>

        </div>

      </div>

    </div>

  </div>
</template>


<script>

import axios from "axios";

export default {

  name: "ExamPins",

  data() {

    return {

      selectedService: "",

      packages: [],

      selectedPackage: null,

      profileId: "",

      customerName: "",

      phoneNumber: "",

      verifying: false,

      buying: false,

      message: "",

      isError: false,

      purchased: false,

      serialNumber: "",

      pin: "",

      token: "",

      transactions: [],

    };

  },


  computed: {

    canBuy() {

      if (
        !this.selectedPackage ||
        !this.phoneNumber
      ) {
        return false;
      }


      if (
        this.selectedService ===
        "jamb"
      ) {

        return (
          this.profileId &&
          this.customerName
        );

      }


      return true;

    },

  },


  mounted() {

    this.loadHistory();

  },


  methods: {

    async loadPackages() {

      this.packages = [];

      this.selectedPackage =
        null;

      this.profileId = "";

      this.customerName = "";

      this.message = "";

      this.purchased = false;


      if (!this.selectedService) {
        return;
      }


      try {

        const response =
          await axios.get(
            `${import.meta.env.VITE_APP_BASE_URL}/api/etrend-education/packages/${this.selectedService}`
          );


        this.packages =
          response.data?.packages ||
          [];

      } catch (error) {

        console.error(
          "Failed to load exam packages:",
          error
        );

        this.message =
          error.response?.data?.message ||
          "Unable to load exam PIN packages.";

        this.isError = true;

      }

    },


    resetJAMBVerification() {

      this.customerName =
        "";

      this.message =
        "";

      this.purchased =
        false;

    },


    async verifyJAMB() {

      if (
        !this.profileId ||
        !this.selectedPackage
      ) {
        return;
      }


      this.verifying =
        true;

      this.message =
        "";

      this.isError =
        false;


      try {

        const response =
          await axios.post(
            `${import.meta.env.VITE_APP_BASE_URL}/api/etrend-education/verify-jamb`,
            {
              profileId:
                this.profileId,

              variationCode:
                this.selectedPackage
                  .variation_code,
            }
          );


        this.customerName =
          response.data?.customerName ||
          "";


        this.message =
          "JAMB Profile ID verified successfully.";

        this.isError =
          false;

      } catch (error) {

        this.customerName =
          "";

        this.message =
          error.response?.data?.message ||
          "JAMB Profile ID verification failed.";

        this.isError =
          true;

      } finally {

        this.verifying =
          false;

      }

    },


    async buyPIN() {

      if (!this.canBuy) {
        return;
      }


      this.buying =
        true;

      this.message =
        "";

      this.isError =
        false;

      this.purchased =
        false;


      try {

        const userId =
          this.$store.getters.userId;


        const response =
          await axios.post(
            `${import.meta.env.VITE_APP_BASE_URL}/api/etrend-education/buy`,
            {
              userId,

              examType:
                this.selectedService ===
                "jamb"
                  ? "JAMB"
                  : this.selectedService ===
                    "waec-registration"
                    ? "WAEC Registration"
                    : "WAEC Result Checker",

              serviceID:
                this.selectedService,

              variationCode:
                this.selectedPackage
                  .variation_code,

              packageName:
                this.selectedPackage.name,

              phoneNumber:
                this.phoneNumber,

              profileId:
                this.profileId || null,

              amount:
                Number(
                  this.selectedPackage
                    .variation_amount
                ),

              quantity: 1,
            }
          );


        this.serialNumber =
          response.data?.serialNumber ||
          "";

        this.pin =
          response.data?.pin ||
          "";

        this.token =
          response.data?.token ||
          "";


        this.purchased =
          !!(
            this.serialNumber ||
            this.pin ||
            this.token
          );


        this.message =
          response.data?.message ||
          "Exam PIN purchase completed.";

        this.isError =
          false;


        await this.loadHistory();


      } catch (error) {

        console.error(
          "Exam PIN purchase error:",
          error
        );

        this.message =
          error.response?.data?.message ||
          "Exam PIN purchase failed.";

        this.isError =
          true;

      } finally {

        this.buying =
          false;

      }

    },


    async loadHistory() {

      try {

        const userId =
          this.$store.getters.userId;


        if (!userId) {
          return;
        }


        const response =
          await axios.get(
            `${import.meta.env.VITE_APP_BASE_URL}/api/etrend-education/transactions/${userId}`
          );


        this.transactions =
          response.data?.transactions ||
          [];

      } catch (error) {

        console.error(
          "Failed to load exam PIN history:",
          error
        );

      }

    },

  },

};

</script>


<style scoped>

.overlay {

  position: fixed;

  inset: 0;

  background:
    rgba(0, 0, 0, 0.7);

  display: flex;

  justify-content: center;

  align-items: center;

  padding: 20px;

  z-index: 9999;

}


.modal {

  width: 100%;

  max-width: 520px;

  max-height: 90vh;

  overflow-y: auto;

  background: #fff;

  border-radius: 14px;

  padding: 22px;

}


.modal-header {

  display: flex;

  justify-content:
    space-between;

  align-items:
    flex-start;

  margin-bottom: 20px;

}


.modal-header h2 {

  margin: 0;

}


.modal-header p {

  margin: 5px 0 0;

  color: #666;

}


.close-btn {

  border: none;

  background: none;

  font-size: 30px;

  cursor: pointer;

}


.form-group {

  margin-bottom: 16px;

}


.form-group label {

  display: block;

  margin-bottom: 7px;

  font-weight: 600;

}


.form-group input,
.form-group select {

  width: 100%;

  padding: 12px;

  border: 1px solid #ccc;

  border-radius: 8px;

  box-sizing: border-box;

}


.verify-btn,
.buy-btn {

  width: 100%;

  border: none;

  padding: 12px;

  border-radius: 8px;

  cursor: pointer;

  margin-top: 8px;

}


.verify-btn {

  background: #222;

  color: white;

}


.buy-btn {

  background: #b00020;

  color: white;

  font-weight: bold;

  margin-top: 15px;

}


button:disabled {

  opacity: 0.5;

  cursor: not-allowed;

}


.summary {

  display: flex;

  justify-content:
    space-between;

  padding: 14px;

  background: #f5f5f5;

  border-radius: 8px;

}


.message {

  padding: 10px;

  border-radius: 8px;

  margin-top: 12px;

}


.success {

  background: #e8f7ed;

  color: #176b32;

}


.error {

  background: #fdecec;

  color: #a00000;

}


.verified {

  margin-top: 8px;

  color: #167334;

  font-weight: 600;

}


.pin-result {

  margin-top: 15px;

  padding: 15px;

  background: #eef7ff;

  border-radius: 10px;

}


.pin-value {

  font-size: 18px;

  font-weight: bold;

  word-break: break-all;

}


.history {

  margin-top: 25px;

}


.history-item {

  display: flex;

  justify-content:
    space-between;

  align-items:
    center;

  gap: 10px;

  padding: 12px 0;

  border-bottom:
    1px solid #eee;

}


.history-item small {

  display: block;

  color: #777;

  margin-top: 4px;

}


.status-success {

  color: green;

  font-size: 12px;

}


.status-pending {

  color: #b06a00;

  font-size: 12px;

}


.empty {

  color: #777;

  font-size: 14px;

}

</style>