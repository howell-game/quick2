
<template>
  <div class="scheme-page">
    <div class="scheme-container">
      <header class="scheme-header">
        <button class="back-button" @click="goBack" type="button">
          ← Back
        </button>

        <div class="school-heading">
          <h1>SCHEME OF WORK</h1>
          <p>ETREND EDUCATION SERVICES</p>
          <p class="mock-notice">DEMONSTRATION DATA — NOT AN OFFICIAL SCHOOL SCHEME</p>
        </div>

        <button class="print-button" @click="printScheme" type="button">
          Print Scheme
        </button>
      </header>

      <section class="scheme-details">
        <div class="detail-item">
          <span>TERM</span>
          <strong>{{ term }}</strong>
        </div>

        <div class="detail-item">
          <span>CLASS</span>
          <strong>{{ schoolClass }}</strong>
        </div>

        <div class="detail-item">
          <span>SUBJECT</span>
          <strong>{{ subject }}</strong>
        </div>

        <div class="detail-item">
          <span>ACADEMIC SESSION</span>
          <strong>{{ academicSession }}</strong>
        </div>
      </section>

      <div class="scheme-introduction">
        <h2>{{ subject }} — {{ schoolClass }}</h2>
        <p>
          This sample demonstrates how the scheme of work will appear.
          The official scheme will be retrieved from the ETrend backend
          when the backend integration is added.
        </p>
      </div>

      
<div v-if="loading" class="scheme-message">
  Loading scheme of work from the database...
</div>

<div v-else-if="errorMessage" class="scheme-message scheme-error">
  <h3>Scheme Not Available</h3>
  <p>{{ errorMessage }}</p>
</div>

<div v-else-if="schemeData.length" class="table-wrapper">
  <table class="scheme-table">
    <thead>
      <tr>
        <th>Week</th>
        <th>Topic</th>
        <th>Learning Objectives</th>
        <th>Teaching and Learning Activities</th>
        <th>Evaluation</th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="item in schemeData" :key="item.id || item.week">
        <td class="week-cell">{{ item.week }}</td>
        <td><strong>{{ item.topic }}</strong></td>
        <td>{{ item.objectives }}</td>
        <td>{{ item.activities }}</td>
        <td>{{ item.evaluation }}</td>
      </tr>
    </tbody>
  </table>
</div>

<div v-else class="scheme-message">
  No weekly topics have been added to this scheme yet.
</div>


      <footer class="scheme-footer">
        <p>Prepared for teaching and learning purposes.</p>
        <p>Source: ETrend Education Services demonstration data</p>
      </footer>
    </div>
  </div>
</template>


<script>
import axios from "axios";

export default {
  name: "SchemeOfWork",

  data() {
    return {
      term: this.$route.query.term || "First Term",
      schoolClass: this.$route.query.class || "JSS 1",
      subject: this.$route.query.subject || "Mathematics",
      academicSession:
        this.$route.query.academicSession || "2026/2027",

      schemeData: [],
      loading: false,
      errorMessage: ""
    };
  },

  created() {
    this.fetchScheme();
  },

  watch: {
    "$route.query": {
      handler() {
        this.term = this.$route.query.term || "First Term";
        this.schoolClass = this.$route.query.class || "JSS 1";
        this.subject = this.$route.query.subject || "Mathematics";
        this.academicSession =
          this.$route.query.academicSession || "2026/2027";

        this.fetchScheme();
      },
      deep: true
    }
  },

  methods: {
    async fetchScheme() {
      this.loading = true;
      this.errorMessage = "";
      this.schemeData = [];

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_BASE_URL}/api/schemes-of-work`,
          {
            params: {
              term: this.term,
              class: this.schoolClass,
              subject: this.subject,
              academicSession: this.academicSession
            }
          }
        );

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Unable to load the scheme."
          );
        }

        const scheme = response.data.scheme;

        this.term = scheme.term;
        this.schoolClass = scheme.class;
        this.subject = scheme.subject;
        this.academicSession = scheme.academicSession;
        this.schemeData = response.data.weeks || [];

        if (this.schemeData.length === 0) {
          this.errorMessage =
            "The scheme exists, but no weekly topics have been added yet.";
        }
      } catch (error) {
        console.error(
          "Error fetching scheme of work:",
          error.response?.data || error.message
        );

        if (error.response?.status === 404) {
          this.errorMessage =
            "No scheme has been saved for this term, class, subject and academic session.";
        } else if (error.response?.status === 400) {
          this.errorMessage =
            error.response.data.message ||
            "Some required scheme details are missing.";
        } else {
          this.errorMessage =
            error.response?.data?.message ||
            "Unable to connect to the backend. Please check your connection and try again.";
        }
      } finally {
        this.loading = false;
      }
    },

    goBack() {
      this.$router.push("/teacher");
    },

    printScheme() {
      window.print();
    }
  }
};
</script>


<style>
.scheme-page {
  min-height: 100vh;
  padding: 30px 20px;
  box-sizing: border-box;
  background: #ffffe0;
  color: #222222;
  font-family: Arial, Helvetica, sans-serif;
}

.scheme-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 25px;
  background: #ffffff;
  border: 1px solid #e1e1cf;
  border-radius: 10px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
}

.scheme-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding-bottom: 22px;
  border-bottom: 2px solid #003366;
}

.school-heading {
  flex: 1;
  text-align: center;
}

.school-heading h1 {
  margin: 0 0 8px;
  color: #003366;
  font-size: 28px;
}

.school-heading p {
  margin: 5px 0;
  font-weight: bold;
}

.school-heading .mock-notice {
  color: #666666;
  font-size: 11px;
  font-weight: normal;
}

.back-button,
.print-button {
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  background: #003366;
  color: #ffffff;
  cursor: pointer;
  white-space: nowrap;
}

.back-button:hover,
.print-button:hover {
  background: #555555;
}

.scheme-details {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 25px 0;
}

.detail-item {
  padding: 15px;
  border: 1px solid #dddddd;
  border-radius: 6px;
  background: #fafafa;
}

.detail-item span {
  display: block;
  margin-bottom: 8px;
  color: #666666;
  font-size: 12px;
  font-weight: bold;
}

.detail-item strong {
  color: #003366;
  overflow-wrap: anywhere;
}

.scheme-introduction {
  margin: 25px 0 18px;
}

.scheme-introduction h2 {
  margin-bottom: 8px;
  color: #003366;
}

.scheme-introduction p {
  line-height: 1.7;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.scheme-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.scheme-table th,
.scheme-table td {
  padding: 13px 12px;
  border: 1px solid #d6d6d6;
  text-align: left;
  vertical-align: top;
  line-height: 1.6;
}

.scheme-message {
  margin: 25px 0;
  padding: 24px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  color: #333333;
  text-align: center;
  line-height: 1.7;
}

.scheme-message h3 {
  margin-top: 0;
  color: #003366;
}

.scheme-message p {
  margin-bottom: 0;
}

.scheme-error {
  border-color: #e2caca;
  background: #fffafa;
}

.scheme-table thead th {
  background: #003366;
  color: #ffffff;
}

.scheme-table tbody tr:nth-child(even) {
  background: #f7f7f7;
}

.scheme-table tbody tr:hover {
  background: #f8f8f8;
}

.week-cell {
  text-align: center !important;
  font-weight: bold;
}

.scheme-footer {
  margin-top: 25px;
  padding-top: 15px;
  border-top: 1px solid #dddddd;
  color: #666666;
  font-size: 12px;
  text-align: center;
}

@media (max-width: 800px) {
  .scheme-header {
    flex-wrap: wrap;
  }

  .school-heading {
    order: -1;
    flex-basis: 100%;
  }

  .school-heading h1 {
    font-size: 23px;
  }

  .scheme-details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .scheme-container {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .scheme-page {
    padding: 12px;
  }

  .scheme-details {
    grid-template-columns: 1fr;
  }
}

@media print {
  .scheme-page {
    padding: 0;
    background: #ffffff;
  }

  .scheme-container {
    max-width: none;
    padding: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  .back-button,
  .print-button {
    display: none;
  }

  .scheme-table {
    font-size: 10px;
  }

  .scheme-table th,
  .scheme-table td {
    padding: 6px;
  }

  .scheme-table thead th {
    background: #eeeeee !important;
    color: #000000 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
