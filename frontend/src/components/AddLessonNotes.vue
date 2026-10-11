
<template>
  <div class="add-lesson-page">
    <header class="page-header">
      <div>
        <h1>ETrend Education Services</h1>
        <p>{{ isEditing ? "Edit Lesson Note" : "Add Lesson Note" }}</p>
      </div>

      <button type="button" class="back-btn" @click="$router.back()">
        ← Back
      </button>
    </header>

    <div class="page-intro">
      <h2>{{ isEditing ? "Update Lesson Note" : "Create a New Lesson Note" }}</h2>
      <p>
        Complete Lesson Information and General Lesson Content.
        Teaching Period fields are optional.
      </p>
    </div>

    <div v-if="loadingExisting" class="status-message">
      Loading saved lesson note...
    </div>

    <div v-if="errorMessage" class="status-message error-message">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="status-message success-message">
      {{ successMessage }}
    </div>

    <form v-if="!loadingExisting" @submit.prevent="saveLessonNote">
      <!-- 1. LESSON INFORMATION -->
      <section class="form-card">
        <div class="section-heading">
          <span class="section-number">1</span>
          <div>
            <h2>Lesson Information</h2>
            <p>Identify the class, subject, term and week.</p>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-field">
            <label for="academicSession">Academic Session *</label>
            <input
              id="academicSession"
              v-model.trim="form.academicSession"
              type="text"
              placeholder="e.g. 2026/2027"
              maxlength="20"
              required
            />
          </div>

          <div class="form-field">
            <label for="term">Term *</label>
            <select id="term" v-model="form.term" required>
              <option value="">Select term</option>
              <option>First Term</option>
              <option>Second Term</option>
              <option>Third Term</option>
            </select>
          </div>

          <div class="form-field">
            <label for="className">Class *</label>
            <select id="className" v-model="form.className" required>
              <option value="">Select class</option>
              <option>JSS 1</option>
              <option>JSS 2</option>
              <option>JSS 3</option>
              <option>SS 1</option>
              <option>SS 2</option>
              <option>SS 3</option>
            </select>
          </div>

          <div class="form-field">
            <label for="subject">Subject *</label>
            <select id="subject" v-model="form.subject" required>
              <option value="">Select subject</option>
              <option
                v-for="subject in subjects"
                :key="subject"
                :value="subject"
              >
                {{ subject }}
              </option>
            </select>
          </div>

          <div class="form-field">
            <label for="weekNumber">Week Number *</label>
            <input
              id="weekNumber"
              v-model.number="form.weekNumber"
              type="number"
              min="1"
              max="60"
              step="1"
              required
            />
            <small>Enter a whole number from 1 to 60.</small>
          </div>

          <div class="form-field full-width">
            <label for="topic">Topic *</label>
            <input
              id="topic"
              v-model.trim="form.topic"
              type="text"
              maxlength="255"
              placeholder="Enter the topic for this week"
              required
            />
          </div>
        </div>
      </section>

      <!-- 2. GENERAL LESSON CONTENT -->
      <section class="form-card">
        <div class="section-heading">
          <span class="section-number">2</span>
          <div>
            <h2>General Lesson Content</h2>
            <p>These fields are required. Enter one item per line where appropriate.</p>
          </div>
        </div>

        <div class="form-field">
          <label for="objectives">Learning Objectives *</label>
          <textarea
            id="objectives"
            v-model="form.objectivesText"
            rows="4"
            placeholder="Identify the place value of a digit&#10;Write numbers in expanded form&#10;Compare whole numbers"
            required
          ></textarea>
          <small>Enter at least one objective.</small>
        </div>

        <div class="form-field">
          <label for="materials">Instructional Materials *</label>
          <textarea
            id="materials"
            v-model.trim="form.materials"
            rows="3"
            placeholder="e.g. Whiteboard, textbooks, place-value chart"
            required
          ></textarea>
        </div>

        <div class="form-field">
          <label for="previousKnowledge">Previous Knowledge *</label>
          <textarea
            id="previousKnowledge"
            v-model.trim="form.previousKnowledge"
            rows="3"
            placeholder="Describe what students already know about this topic."
            required
          ></textarea>
        </div>

        <div class="form-field">
          <label for="content">Lesson Content / Key Points *</label>
          <textarea
            id="content"
            v-model="form.contentText"
            rows="5"
            placeholder="Enter the first key point&#10;Enter the second key point"
            required
          ></textarea>
          <small>Enter at least one key point.</small>
        </div>

        <div class="form-field">
          <label for="activities">Teaching and Learning Activities *</label>
          <textarea
            id="activities"
            v-model="form.activitiesText"
            rows="5"
            placeholder="Teacher introduces the topic&#10;Teacher demonstrates examples&#10;Students practise the examples"
            required
          ></textarea>
          <small>Enter at least one activity.</small>
        </div>

        <div class="form-field">
          <label for="evaluation">Evaluation Questions *</label>
          <textarea
            id="evaluation"
            v-model="form.evaluationText"
            rows="4"
            placeholder="What is place value?&#10;Write 3,426 in expanded form."
            required
          ></textarea>
          <small>Enter at least one evaluation question.</small>
        </div>

        <div class="form-field">
          <label for="assignment">Assignment *</label>
          <textarea
            id="assignment"
            v-model.trim="form.assignment"
            rows="3"
            placeholder="Enter the assignment students should complete."
            required
          ></textarea>
        </div>
      </section>

      <!-- 3. OPTIONAL TEACHING PERIODS -->
      <section class="form-card">
        <div class="section-heading">
          <span class="section-number">3</span>
          <div>
            <h2>Teaching Periods</h2>
            <p>
              All fields in this section are optional. You may save the lesson
              with some or all period fields left blank.
            </p>
          </div>
        </div>

        <article
          v-for="period in form.periods"
          :key="period.periodNumber"
          class="period-form"
        >
          <div class="period-heading">
            <div>
              <span class="period-label">PERIOD {{ period.periodNumber }}</span>
              <h3>Period {{ period.periodNumber }} Details</h3>
            </div>
            <span class="duration-badge">
              {{ period.duration || "—" }}{{ period.duration ? " minutes" : "" }}
            </span>
          </div>

          <div class="form-grid">
            <div class="form-field full-width">
              <label :for="'period-title-' + period.periodNumber">
                Period Title
              </label>
              <input
                :id="'period-title-' + period.periodNumber"
                v-model.trim="period.title"
                type="text"
                maxlength="255"
                :placeholder="'Optional title for Period ' + period.periodNumber"
              />
            </div>

            <div class="form-field">
              <label :for="'duration-' + period.periodNumber">
                Duration (minutes)
              </label>
              <input
                :id="'duration-' + period.periodNumber"
                v-model="period.duration"
                type="number"
                min="1"
                max="300"
                step="1"
                placeholder="Optional"
              />
            </div>

            <div class="form-field full-width">
              <label :for="'teacher-' + period.periodNumber">
                Teacher's Activities
              </label>
              <textarea
                :id="'teacher-' + period.periodNumber"
                v-model.trim="period.teacherActivities"
                rows="3"
                placeholder="Optional: describe what the teacher will do."
              ></textarea>
            </div>

            <div class="form-field full-width">
              <label :for="'students-' + period.periodNumber">
                Students' Activities
              </label>
              <textarea
                :id="'students-' + period.periodNumber"
                v-model.trim="period.studentActivities"
                rows="3"
                placeholder="Optional: describe what the students will do."
              ></textarea>
            </div>

            <div class="form-field full-width">
              <label :for="'lesson-' + period.periodNumber">
                Lesson / Period Content
              </label>
              <textarea
                :id="'lesson-' + period.periodNumber"
                v-model.trim="period.lessonContent"
                rows="5"
                placeholder="Optional: enter the detailed content taught during this period."
              ></textarea>
            </div>

            <div class="form-field full-width">
              <label :for="'speedwork-' + period.periodNumber">
                Speed Work {{ period.periodNumber }}
              </label>
              <textarea
                :id="'speedwork-' + period.periodNumber"
                v-model="period.speedWorkText"
                rows="4"
                placeholder="Optional: enter one question or exercise per line."
              ></textarea>
            </div>

            <div class="form-field full-width">
              <label :for="'conclusion-' + period.periodNumber">
                Conclusion
              </label>
              <textarea
                :id="'conclusion-' + period.periodNumber"
                v-model.trim="period.conclusion"
                rows="3"
                placeholder="Optional conclusion or summary."
              ></textarea>
            </div>
          </div>
        </article>
      </section>

      <!-- ACTIONS -->
      <div class="form-actions">
        <button
          type="button"
          class="secondary-btn"
          :disabled="saving"
          @click="$router.back()"
        >
          Cancel
        </button>

        <button
          type="submit"
          class="primary-btn"
          :disabled="saving || loadingExisting"
        >
          {{
            saving
              ? "Saving..."
              : isEditing
                ? "Update Lesson Note"
                : "Save Lesson Note"
          }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import axios from "axios";

function createEmptyPeriod(periodNumber) {
  return {
    periodNumber,
    title: "",
    duration: "",
    teacherActivities: "",
    studentActivities: "",
    lessonContent: "",
    speedWorkText: "",
    conclusion: "",
  };
}

function createEmptyForm() {
  return {
    academicSession: "2026/2027",
    term: "First Term",
    className: "",
    subject: "",
    weekNumber: 1,
    topic: "",

    objectivesText: "",
    materials: "",
    previousKnowledge: "",
    contentText: "",
    activitiesText: "",
    evaluationText: "",
    assignment: "",

    periods: [
      createEmptyPeriod(1),
      createEmptyPeriod(2),
      createEmptyPeriod(3),
      createEmptyPeriod(4),
    ],
  };
}

function linesToArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToLines(value) {
  if (Array.isArray(value)) {
    return value.join("\n");
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

export default {
  name: "AddLessonNotes",

  data() {
    return {
      form: createEmptyForm(),

      subjects: [
        "Mathematics",
        "English Language",
        "Basic Science",
        "Basic Technology",
        "Agricultural Science",
        "Biology",
        "Chemistry",
        "Physics",
        "Further Mathematics",
        "Economics",
        "Civic Education",
        "Government",
        "Geography",
        "Literature in English",
        "Christian Religious Studies",
        "Islamic Religious Studies",
        "Computer Studies",
        "Business Studies",
        "Commerce",
        "Financial Accounting",
        "Social Studies",
        "Home Economics",
        "Physical and Health Education",
        "History",
        "French",
        "Data Processing",
      ],

      saving: false,
      loadingExisting: false,
      errorMessage: "",
      successMessage: "",
    };
  },

  computed: {
    isEditing() {
      return Boolean(this.$route.params.id || this.$route.query.id);
    },

    lessonNoteId() {
      return this.$route.params.id || this.$route.query.id || null;
    },
  },

  methods: {
    getApiBaseUrl() {
      const baseUrl = import.meta.env.VITE_APP_BASE_URL;

      if (!baseUrl) {
        throw new Error(
          "VITE_APP_BASE_URL is missing. Please configure your backend URL."
        );
      }

      return baseUrl.replace(/\/+$/, "");
    },

    buildPayload() {
      return {
        academicSession: this.form.academicSession.trim(),
        term: this.form.term,
        className: this.form.className,
        subject: this.form.subject,
        weekNumber: Number(this.form.weekNumber),
        topic: this.form.topic.trim(),

        objectives: linesToArray(this.form.objectivesText),
        materials: this.form.materials.trim(),
        previousKnowledge: this.form.previousKnowledge.trim(),
        content: linesToArray(this.form.contentText),
        activities: linesToArray(this.form.activitiesText),
        evaluation: linesToArray(this.form.evaluationText),
        assignment: this.form.assignment.trim(),

        // Always send four period records.
        // Their individual fields may be empty.
        periods: this.form.periods.map((period) => {
          const duration =
            period.duration === "" || period.duration == null
              ? null
              : Number(period.duration);

          return {
            periodNumber: Number(period.periodNumber),
            title: period.title.trim(),
            duration,
            teacherActivities: period.teacherActivities.trim(),
            studentActivities: period.studentActivities.trim(),
            lessonContent: period.lessonContent.trim(),
            speedWork: linesToArray(period.speedWorkText),
            conclusion: period.conclusion.trim(),
          };
        }),
      };
    },

    validateForm(payload) {
      // Only Lesson Information is required in this card.
      if (
        !payload.academicSession ||
        !payload.term ||
        !payload.className ||
        !payload.subject ||
        !payload.topic
      ) {
        return "Please complete all required Lesson Information fields.";
      }

      if (
        !Number.isInteger(payload.weekNumber) ||
        payload.weekNumber < 1 ||
        payload.weekNumber > 60
      ) {
        return "Week number must be a whole number between 1 and 60.";
      }

      // Only General Lesson Content is required in this card.
      if (
        payload.objectives.length === 0 ||
        !payload.materials ||
        !payload.previousKnowledge ||
        payload.content.length === 0 ||
        payload.activities.length === 0 ||
        payload.evaluation.length === 0 ||
        !payload.assignment
      ) {
        return "Please complete all required General Lesson Content fields.";
      }

      // The four periods must exist, but their fields are optional.
      if (!Array.isArray(payload.periods) || payload.periods.length !== 4) {
        return "The lesson note must contain four teaching periods.";
      }

      for (let index = 0; index < payload.periods.length; index += 1) {
        const period = payload.periods[index];

        if (period.periodNumber !== index + 1) {
          return "The four teaching periods must be numbered from 1 to 4.";
        }

        // Check duration only when one has been entered.
        if (
          period.duration !== null &&
          (!Number.isInteger(period.duration) ||
            period.duration < 1 ||
            period.duration > 300)
        ) {
          return `Duration for Period ${period.periodNumber} must be a whole number from 1 to 300.`;
        }
      }

      return "";
    },

    async saveLessonNote() {
      this.errorMessage = "";
      this.successMessage = "";

      const payload = this.buildPayload();
      const validationError = this.validateForm(payload);

      if (validationError) {
        this.errorMessage = validationError;
        return;
      }

      this.saving = true;

      try {
        const baseUrl = this.getApiBaseUrl();
        let response;

        if (this.isEditing) {
          response = await axios.put(
            `${baseUrl}/api/lesson-notes/${this.lessonNoteId}`,
            payload
          );
        } else {
          response = await axios.post(
            `${baseUrl}/api/lesson-notes`,
            payload
          );
        }

        this.successMessage =
          response.data?.message ||
          (this.isEditing
            ? "Lesson note updated successfully."
            : "Lesson note saved successfully.");

        if (!this.isEditing) {
          this.form = createEmptyForm();
        }
      } catch (error) {
        console.error("Failed to save lesson note:", error);

        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Unable to save the lesson note. Please try again.";
      } finally {
        this.saving = false;
      }
    },

    async loadExistingLesson() {
      if (!this.isEditing) return;

      this.loadingExisting = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const baseUrl = this.getApiBaseUrl();

        const response = await axios.get(
          `${baseUrl}/api/lesson-notes/${this.lessonNoteId}`
        );

        const lesson = response.data?.lessonNote ?? response.data;

        if (!lesson || lesson.id == null) {
          throw new Error("The requested lesson note was not found.");
        }

        const form = createEmptyForm();

        form.academicSession = lesson.academicSession ?? "";
        form.term = lesson.term ?? "";
        form.className = lesson.className ?? "";
        form.subject = lesson.subject ?? "";
        form.weekNumber = Number(lesson.weekNumber ?? 1);
        form.topic = lesson.topic ?? "";

        form.objectivesText = arrayToLines(lesson.objectives);
        form.materials = lesson.materials ?? "";
        form.previousKnowledge = lesson.previousKnowledge ?? "";
        form.contentText = arrayToLines(lesson.content);
        form.activitiesText = arrayToLines(lesson.activities);
        form.evaluationText = arrayToLines(lesson.evaluation);
        form.assignment = lesson.assignment ?? "";

        const savedPeriods = Array.isArray(lesson.periods)
          ? lesson.periods
          : [];

        form.periods = [1, 2, 3, 4].map((periodNumber) => {
          const saved = savedPeriods.find(
            (item) => Number(item.periodNumber) === periodNumber
          );

          if (!saved) {
            return createEmptyPeriod(periodNumber);
          }

          return {
            periodNumber,
            title: saved.title ?? "",
            duration:
              saved.duration === null || saved.duration === undefined
                ? ""
                : Number(saved.duration),
            teacherActivities: saved.teacherActivities ?? "",
            studentActivities: saved.studentActivities ?? "",
            lessonContent: saved.lessonContent ?? "",
            speedWorkText: arrayToLines(saved.speedWork),
            conclusion: saved.conclusion ?? "",
          };
        });

        this.form = form;
      } catch (error) {
        console.error("Failed to load lesson note:", error);

        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Unable to load this lesson note.";
      } finally {
        this.loadingExisting = false;
      }
    },
  },

  mounted() {
    this.loadExistingLesson();
  },
};
</script>

<style scoped>
.add-lesson-page {
  min-height: 100vh;
  padding: 24px;
  background: #ffffe0;
  color: #111111;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0 auto 28px;
  max-width: 1100px;
  padding: 20px;
  background: #003366;
  color: #ffffff;
  border-radius: 10px;
}

.page-header h1 {
  margin: 0 0 6px;
  font-size: 25px;
}

.page-header p {
  margin: 0;
}

.back-btn,
.primary-btn,
.secondary-btn {
  padding: 11px 18px;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.back-btn {
  background: #ffffff;
  color: #003366;
}

.page-intro,
.add-lesson-page form,
.status-message {
  max-width: 1100px;
  margin-right: auto;
  margin-left: auto;
}

.page-intro {
  margin-bottom: 22px;
}

.page-intro h2 {
  margin-bottom: 8px;
  color: #003366;
}

.page-intro p {
  line-height: 1.6;
}

.form-card {
  max-width: 1100px;
  margin: 0 auto 24px;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #d8dfeb;
  border-radius: 10px;
  box-shadow: 0 3px 12px rgb(0 0 0 / 5%);
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.section-number {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #003366;
  color: #ffffff;
  font-weight: 700;
}

.section-heading h2 {
  margin: 0 0 5px;
  color: #003366;
}

.section-heading p {
  margin: 0;
  line-height: 1.5;
  color: #555555;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 8px;
  margin-bottom: 20px;
}

.form-grid .form-field {
  margin-bottom: 0;
}

.full-width {
  grid-column: 1 / -1;
}

.form-field label {
  font-weight: 600;
}

.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #c5cedb;
  border-radius: 6px;
  background: #ffffff;
  color: #111111;
  font: inherit;
}

.form-field textarea {
  resize: vertical;
  line-height: 1.5;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  outline: 2px solid #80b8ed;
  border-color: #003366;
}

.form-field small {
  color: #555555;
  line-height: 1.5;
}

.period-form {
  margin-top: 22px;
  padding: 20px;
  border: 1px solid #d8dfeb;
  border-radius: 8px;
  background: #fbfcff;
}

.period-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
}

.period-label {
  font-size: 12px;
  font-weight: 700;
  color: #003366;
  letter-spacing: 1px;
}

.period-heading h3 {
  margin: 5px 0 0;
  color: #003366;
}

.duration-badge {
  padding: 7px 10px;
  border-radius: 20px;
  background: #e8f1fb;
  color: #003366;
  font-size: 13px;
  white-space: nowrap;
}

.status-message {
  margin-bottom: 18px;
  padding: 13px 16px;
  border-radius: 6px;
  line-height: 1.5;
}

.error-message {
  background: #ffe8e8;
  color: #9b1c1c;
  border: 1px solid #f0baba;
}

.success-message {
  background: #e8f7e9;
  color: #176b2c;
  border: 1px solid #b8e1bf;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  max-width: 1100px;
  margin: 0 auto 30px;
}

.primary-btn {
  background: #003366;
  color: #ffffff;
}

.secondary-btn {
  background: #e5e7eb;
  color: #111111;
}

.primary-btn:disabled,
.secondary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 700px) {
  .add-lesson-page {
    padding: 12px;
  }

  .page-header {
    align-items: flex-start;
    padding: 16px;
  }

  .page-header h1 {
    font-size: 20px;
  }

  .form-card {
    padding: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }

  .period-form {
    padding: 14px;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>
