
<template>
  <div class="add-scheme-page">
    <header class="page-header">
      <div>
        <h1>ETrend Education Services</h1>
        <p>Add Scheme of Work</p>
      </div>

      <button class="btn btn-secondary" @click="goBack">
        Back
      </button>
    </header>

    <form class="scheme-form" @submit.prevent="saveScheme">
      <section class="form-section">
        <h2>Scheme Details</h2>
        <p class="section-description">
          Enter the details for the scheme you want to prepare.
        </p>

        <div class="details-grid">
          <div class="form-group">
            <label for="academicSession">Academic Session</label>
            <input
              id="academicSession"
              v-model.trim="form.academicSession"
              type="text"
              placeholder="e.g. 2026/2027"
              required
              maxlength="20"
            />
          </div>

          <div class="form-group">
            <label for="term">Term</label>
            <select id="term" v-model="form.term" required>
              <option value="" disabled>Select term</option>
              <option>First Term</option>
              <option>Second Term</option>
              <option>Third Term</option>
            </select>
          </div>

          <div class="form-group">
            <label for="schoolClass">Class</label>
            <select id="schoolClass" v-model="form.className" required>
              <option value="" disabled>Select class</option>
              <option>JSS 1</option>
              <option>JSS 2</option>
              <option>JSS 3</option>
              <option>SS 1</option>
              <option>SS 2</option>
              <option>SS 3</option>
            </select>
          </div>

          <div class="form-group">
            <label for="subject">Subject</label>
            <input
              id="subject"
              v-model.trim="form.subject"
              type="text"
              placeholder="e.g. Mathematics"
              required
              maxlength="100"
            />
          </div>
        </div>
      </section>

      <section class="form-section">
        <div class="weeks-heading">
          <div>
            <h2>Weekly Scheme</h2>
            <p class="section-description">
              Add the topic, learning objectives, activities and evaluation
              for each week.
            </p>
          </div>

          <button
            type="button"
            class="btn btn-secondary add-week-btn"
            @click="addWeek"
            :disabled="weeks.length >= 60"
          >
            + Add Week
          </button>
        </div>

        <div
          v-for="(week, index) in weeks"
          :key="week.key"
          class="week-card"
        >
          
<div class="week-card-heading">
  <div class="week-number-field">
    <label :for="`week-${week.key}`">Week Number</label>

    <input
      :id="`week-${week.key}`"
      v-model.number="week.week"
      type="number"
      min="1"
      max="60"
      step="1"
      required
      aria-label="Week number"
    />
  </div>

  <button
    v-if="weeks.length > 1"
    type="button"
    class="remove-week-btn"
    @click="removeWeek(index)"
  >
    Remove
  </button>
</div>


          <div class="form-group">
            <label :for="`topic-${week.key}`">Topic</label>
            <input
              :id="`topic-${week.key}`"
              v-model.trim="week.topic"
              type="text"
              placeholder="Enter the topic for this week"
              required
              maxlength="255"
            />
          </div>

          <div class="form-group">
            <label :for="`objectives-${week.key}`">
              Learning Objectives
            </label>
            <textarea
              :id="`objectives-${week.key}`"
              v-model.trim="week.objectives"
              placeholder="What should students be able to do?"
              required
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label :for="`activities-${week.key}`">
              Teaching and Learning Activities
            </label>
            <textarea
              :id="`activities-${week.key}`"
              v-model.trim="week.activities"
              placeholder="Describe the teaching and learning activities"
              required
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label :for="`evaluation-${week.key}`">Evaluation</label>
            <textarea
              :id="`evaluation-${week.key}`"
              v-model.trim="week.evaluation"
              placeholder="How will students' understanding be assessed?"
              required
              rows="2"
            ></textarea>
          </div>
        </div>
      </section>

      <div v-if="message" class="form-message" :class="messageType">
        {{ message }}
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary"
          @click="goBack"
          :disabled="saving"
        >
          Cancel
        </button>

        <button
          type="submit"
          class="btn btn-primary"
          :disabled="saving"
        >
          {{ saving ? "Saving Scheme..." : "Save Scheme of Work" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import axios from "axios";

let nextWeekKey = 1;

function createWeek(weekNumber) {
  return {
    key: nextWeekKey++,
    week: weekNumber,
    topic: "",
    objectives: "",
    activities: "",
    evaluation: ""
  };
}

export default {
  name: "AddScheme",

  data() {
    return {
      form: {
        academicSession:
          this.$route.query.academicSession || "2026/2027",
        term: this.$route.query.term || "",
        className: this.$route.query.class || "",
        subject: this.$route.query.subject || ""
      },

      weeks: Array.from({ length: 12 }, (_, index) =>
        createWeek(index + 1)
      ),

      saving: false,
      message: "",
      messageType: "error"
    };
  },

  methods: {
    addWeek() {
      if (this.weeks.length >= 60) return;

      const nextNumber =
        this.weeks.length > 0
          ? Math.max(...this.weeks.map((week) => week.week)) + 1
          : 1;

      this.weeks.push(createWeek(nextNumber));
    },

    removeWeek(index) {
      this.weeks.splice(index, 1);
    },

    async saveScheme() {
      this.message = "";

      const academicSession = this.form.academicSession.trim();
      const subject = this.form.subject.trim();

      if (
        !academicSession ||
        !this.form.term ||
        !this.form.className ||
        !subject
      ) {
        this.message = "Please complete all scheme details.";
        this.messageType = "error";
        return;
      }

      if (this.weeks.length === 0) {
        this.message = "Please add at least one week.";
        this.messageType = "error";
        return;
      }

      const weekNumbers = this.weeks.map((week) => Number(week.week));

      if (
        weekNumbers.some(
          (number) =>
            !Number.isInteger(number) || number < 1 || number > 60
        ) ||
        new Set(weekNumbers).size !== weekNumbers.length
      ) {
        this.message = "Each week must have a unique number from 1 to 60.";
        this.messageType = "error";
        return;
      }

      const incompleteWeek = this.weeks.find(
        (week) =>
          !week.topic.trim() ||
          !week.objectives.trim() ||
          !week.activities.trim() ||
          !week.evaluation.trim()
      );

      if (incompleteWeek) {
        this.message =
          `Please complete all fields for Week ${incompleteWeek.week}.`;
        this.messageType = "error";
        return;
      }

      this.saving = true;

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_APP_BASE_URL}/api/schemes-of-work`,
          {
            academicSession,
            term: this.form.term,
            className: this.form.className,
            subject,
            weeks: this.weeks.map((week) => ({
              week: Number(week.week),
              topic: week.topic.trim(),
              objectives: week.objectives.trim(),
              activities: week.activities.trim(),
              evaluation: week.evaluation.trim()
            }))
          }
        );

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Unable to save the scheme."
          );
        }

        const savedScheme = response.data.scheme;

        this.$router.push({
          path: "/scheme-of-work",
          query: {
            term: savedScheme.term,
            class: savedScheme.class,
            subject: savedScheme.subject,
            academicSession: savedScheme.academicSession
          }
        });
      } catch (error) {
        console.error(
          "Error saving scheme of work:",
          error.response?.data || error.message
        );

        if (error.response?.status === 409) {
          this.message =
            error.response.data.message ||
            "A scheme already exists for these details.";
        } else if (error.response?.status === 400) {
          this.message =
            error.response.data.message ||
            "Please check the information you entered.";
        } else {
          this.message =
            error.response?.data?.message ||
            "Unable to save the scheme. Check your connection and try again.";
        }

        this.messageType = "error";
      } finally {
        this.saving = false;
      }
    },

    goBack() {
      this.$router.push("/adminpage");
    }
  }
};
</script>

<style scoped>
.add-scheme-page {
  min-height: 100vh;
  padding: 24px;
  background: #ffffe0;
  color: #111111;
  box-sizing: border-box;
}

.page-header {
  max-width: 1200px;
  margin: 0 auto 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.page-header h1 {
  margin: 0;
  color: #003366;
  font-size: 27px;
}

.page-header p {
  margin: 6px 0 0;
  color: #444444;
}

.scheme-form {
  max-width: 1200px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 22px;
  padding: 22px;
  background: #ffffff;
  border: 1px solid #e4e4d0;
  border-radius: 10px;
}

.form-section h2 {
  margin: 0 0 8px;
  color: #003366;
  font-size: 21px;
}

.section-description {
  margin: 0 0 20px;
  color: #555555;
  line-height: 1.5;
  font-size: 14px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 17px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  font-weight: 600;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid #cccccc;
  border-radius: 6px;
  box-sizing: border-box;
  color: #111111;
  background: #ffffff;
  font: inherit;
}

.form-group textarea {
  resize: vertical;
  line-height: 1.5;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: 2px solid #9cbce0;
  border-color: #003366;
}

.weeks-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.weeks-heading .section-description {
  margin-bottom: 0;
}

.week-card {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid #dddddd;
  border-radius: 8px;
  background: #fcfcfc;
}

.week-card-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.week-card-heading h3 {
  margin: 0;
  color: #003366;
  font-size: 17px;
}

.btn {
  border: 0;
  border-radius: 6px;
  padding: 11px 16px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  color: #ffffff;
  background: #003366;
}

.btn-primary:hover:not(:disabled) {
  background: #004985;
}

.btn-secondary {
  color: #003366;
  background: #eeeeee;
  border: 1px solid #cccccc;
}

.btn-secondary:hover:not(:disabled) {
  background: #f8f8f8;
}

.remove-week-btn {
  padding: 7px 10px;
  border: 1px solid #cccccc;
  border-radius: 5px;
  background: #ffffff;
  color: #333333;
  cursor: pointer;
}

.remove-week-btn:hover {
  background: #f8f8f8;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-bottom: 30px;
}

.form-message {
  margin: 16px 0;
  padding: 13px 15px;
  border-radius: 6px;
  line-height: 1.5;
}

.form-message.error {
  background: #fff0f0;
  border: 1px solid #e3b8b8;
  color: #8b1d1d;
}

@media (max-width: 650px) {
  .add-scheme-page {
    padding: 14px;
  }

  .page-header {
    align-items: flex-start;
  }

  .page-header h1 {
    font-size: 22px;
  }

  .form-section {
    padding: 15px;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .weeks-heading {
    flex-direction: column;
  }

  .add-week-btn {
    align-self: flex-start;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
