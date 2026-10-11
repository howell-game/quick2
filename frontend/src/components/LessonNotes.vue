
<template>
  <div class="lesson-notes-page">
    <header class="page-header">
      <div>
        <h1>ETrend Education Services</h1>
        <p>Lesson Notes</p>
      </div>
      <button class="back-btn" @click="$router.back()">← Back</button>
    </header>

    <!-- FILTERS -->
    <section class="filter-card">
      <div class="filter-field">
        <label for="session">Academic Session</label>
        <select id="session" v-model="filters.academicSession">
          <option value="">All Sessions</option>
          <option>2026/2027</option>
          <option>2025/2026</option>
        </select>
      </div>

      <div class="filter-field">
        <label for="term">Term</label>
        <select id="term" v-model="filters.term">
          <option value="">All Terms</option>
          <option>First Term</option>
          <option>Second Term</option>
          <option>Third Term</option>
        </select>
      </div>

      <div class="filter-field">
        <label for="className">Class</label>
        <select id="className" v-model="filters.className">
          <option value="">All Classes</option>
          <option>JSS 1</option>
          <option>JSS 2</option>
          <option>JSS 3</option>
          <option>SS 1</option>
          <option>SS 2</option>
          <option>SS 3</option>
        </select>
      </div>

      <div class="filter-field">
        <label for="subject">Subject</label>
        <select id="subject" v-model="filters.subject">
          <option value="">All Subjects</option>
          <option v-for="subject in subjects" :key="subject" :value="subject">
            {{ subject }}
          </option>
        </select>
      </div>

      <button
        class="primary-btn"
        :disabled="loading"
        @click="loadLessonNotes"
      >
        {{ loading ? "Loading..." : "Load Lesson Notes" }}
      </button>
    </section>

    <!-- STATUS MESSAGES -->
    <div v-if="loading" class="message">
      Loading lesson notes from the server...
    </div>

    <div v-else-if="errorMessage" class="message error-message">
      {{ errorMessage }}
      <button class="retry-btn" @click="loadLessonNotes">
        Try Again
      </button>
    </div>

    <div v-else-if="message" class="message">
      {{ message }}
    </div>

    <!-- LESSON LAYOUT -->
    <section class="lesson-layout">
      <!-- WEEK SIDEBAR -->
      <aside class="weeks-panel">
        <h2>Lesson Notes</h2>

        <p v-if="!loading && weeks.length === 0" class="empty-message">
          No lesson notes found for these filters.
        </p>

        <button
          v-for="week in weeks"
          :key="week.id"
          class="week-item"
          :class="{ selected: selectedWeek === week.weekNumber }"
          :disabled="loading"
          @click="selectWeek(week)"
        >
          <strong>Week {{ week.weekNumber }}</strong>
          <span>{{ week.topic }}</span>
        </button>
      </aside>

      <!-- MAIN LESSON CONTENT -->
      <main class="lesson-content">
        <div v-if="detailLoading" class="content-card">
          Loading the selected lesson...
        </div>

        <div v-else-if="detailError" class="content-card error-message">
          {{ detailError }}
          <button class="retry-btn" @click="selectWeek(selectedWeek)">
            Try Again
          </button>
        </div>

        <template v-else-if="currentLesson">
          <div class="lesson-title">
            <span>WEEK {{ currentLesson.weekNumber }}</span>
            <h2>{{ currentLesson.topic }}</h2>
            <p>
              {{ currentLesson.className }} ·
              {{ currentLesson.subject }} ·
              {{ currentLesson.term }}
            </p>
          </div>

          <article class="content-card">
            <h3>1. Learning Objectives</h3>
            <p>At the end of the lesson, students should be able to:</p>
            <ul v-if="asList(currentLesson.objectives).length">
              <li
                v-for="(item, index) in asList(currentLesson.objectives)"
                :key="index"
              >
                {{ item }}
              </li>
            </ul>
            <p v-else class="empty-message">
              No learning objectives have been provided.
            </p>
          </article>

          <article class="content-card">
            <h3>2. Instructional Materials</h3>
            <p>{{ currentLesson.materials || "Not provided." }}</p>
          </article>

          <article class="content-card">
            <h3>3. Previous Knowledge</h3>
            <p>{{ currentLesson.previousKnowledge || "Not provided." }}</p>
          </article>

          <article class="content-card">
            <h3>4. Lesson Content / Key Points</h3>
            <ul v-if="asList(currentLesson.content).length">
              <li
                v-for="(item, index) in asList(currentLesson.content)"
                :key="index"
              >
                {{ item }}
              </li>
            </ul>
            <p v-else class="empty-message">
              No lesson content has been provided.
            </p>
          </article>

          <article class="content-card">
            <h3>5. Teaching and Learning Activities</h3>
            <ol v-if="asList(currentLesson.activities).length">
              <li
                v-for="(item, index) in asList(currentLesson.activities)"
                :key="index"
              >
                {{ item }}
              </li>
            </ol>
            <p v-else class="empty-message">
              No teaching and learning activities have been provided.
            </p>
          </article>

          <article class="content-card">
            <h3>6. Evaluation</h3>
            <ol v-if="asList(currentLesson.evaluation).length">
              <li
                v-for="(item, index) in asList(currentLesson.evaluation)"
                :key="index"
              >
                {{ item }}
              </li>
            </ol>
            <p v-else class="empty-message">
              No evaluation questions have been provided.
            </p>
          </article>

          <article class="content-card">
            <h3>7. Assignment</h3>
            <p>{{ currentLesson.assignment || "No assignment provided." }}</p>
          </article>

          <!-- PERIODS FROM THE DATABASE -->
          <article
            v-for="period in sortedPeriods"
            :key="period.id || period.periodNumber"
            class="content-card period-card"
          >
            <h3>
              {{ 7 + period.periodNumber }}. Period {{ period.periodNumber }}
              <span v-if="period.title">— {{ period.title }}</span>
            </h3>

            <p>
              <strong>Duration:</strong>
              {{ period.duration || 40 }} minutes
            </p>

            <p><strong>Teacher's Activities:</strong></p>
            <p>{{ period.teacherActivities || "Not provided." }}</p>

            <p><strong>Students' Activities:</strong></p>
            <p>{{ period.studentActivities || "Not provided." }}</p>

            <h4 class="lesson-subheading">Lessons</h4>
            <p>{{ period.lessonContent || "Not provided." }}</p>

            <h4 class="lesson-subheading">
              Speed Work {{ period.periodNumber }}
            </h4>

            <ol v-if="asList(period.speedWork).length">
              <li
                v-for="(question, index) in asList(period.speedWork)"
                :key="index"
              >
                {{ question }}
              </li>
            </ol>
            <p v-else class="empty-message">
              No speed work questions provided.
            </p>

            <template v-if="period.conclusion">
              <h4 class="lesson-subheading">Conclusion</h4>
              <p>{{ period.conclusion }}</p>
            </template>
          </article>

          <div v-if="sortedPeriods.length === 0" class="content-card">
            No period details have been saved for this lesson note.
          </div>
        </template>

        <div v-else class="content-card empty-message">
          Select a week to view its lesson note.
        </div>
      </main>

      <!-- INFORMATION PANEL -->
      <aside class="info-panel">
        <div class="info-card">
          <h3>Lesson Note Information</h3>

          <div class="info-row">
            <strong>Academic Session</strong>
            <span>{{ currentLesson?.academicSession || filters.academicSession || "—" }}</span>
          </div>

          <div class="info-row">
            <strong>Term</strong>
            <span>{{ currentLesson?.term || filters.term || "—" }}</span>
          </div>

          <div class="info-row">
            <strong>Class</strong>
            <span>{{ currentLesson?.className || filters.className || "—" }}</span>
          </div>

          <div class="info-row">
            <strong>Subject</strong>
            <span>{{ currentLesson?.subject || filters.subject || "—" }}</span>
          </div>

          <div class="info-row">
            <strong>Week</strong>
            <span>{{ currentLesson?.weekNumber ?? "—" }}</span>
          </div>

          <div class="info-row">
            <strong>Topic</strong>
            <span>{{ currentLesson?.topic || "—" }}</span>
          </div>
        </div>

        <div class="action-card">
          <button
            class="primary-btn full-btn"
            :disabled="!currentLesson || detailLoading"
            @click="printLesson"
          >
            Print Lesson Note
          </button>
          <p class="action-hint">
            Use your browser's print window to print or save as PDF.
          </p>
        </div>
      </aside>
    </section>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "LessonNotes",

  data() {
    return {
      filters: {
        academicSession: this.$route.query.academicSession || "2026/2027",
        term: this.$route.query.term || "First Term",
        className: this.$route.query.class || "JSS 1",
        subject: this.$route.query.subject || "Mathematics",
      },

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

      weeks: [],
      selectedWeek: null,
      selectedLesson: null,

      loading: false,
      detailLoading: false,

      errorMessage: "",
      detailError: "",
      message: "",
      requestNumber: 0,
      detailRequestNumber: 0,
    };
  },

  computed: {
    currentLesson() {
      return this.selectedLesson;
    },

    sortedPeriods() {
      const periods = this.currentLesson?.periods;

      if (!Array.isArray(periods)) {
        return [];
      }

      return [...periods].sort(
        (a, b) => Number(a.periodNumber) - Number(b.periodNumber)
      );
    },
  },

  methods: {
    async loadLessonNotes() {
      const requestNumber = ++this.requestNumber;

      this.loading = true;
      this.errorMessage = "";
      this.detailError = "";
      this.message = "";
      this.weeks = [];
      this.selectedLesson = null;
      this.selectedWeek = null;

      try {
        const baseUrl = import.meta.env.VITE_APP_BASE_URL;

        if (!baseUrl) {
          throw new Error(
            "VITE_APP_BASE_URL is not configured for the frontend."
          );
        }

        const response = await axios.get(
          `${baseUrl.replace(/\/+$/, "")}/api/lesson-notes`,
          {
            params: {
              academicSession: this.filters.academicSession || undefined,
              term: this.filters.term || undefined,
              className: this.filters.className || undefined,
              subject: this.filters.subject || undefined,
            },
          }
        );

        // Ignore an older request if the user loads again.
        if (requestNumber !== this.requestNumber) return;

        const records = response.data.lessonNotes;

        if (!Array.isArray(records)) {
          throw new Error(
            "The server response does not contain a lessonNotes array."
          );
        }

        this.weeks = records
          .filter(
            (item) =>
              item &&
              item.id != null &&
              Number.isFinite(Number(item.weekNumber))
          )
          .sort(
            (a, b) => Number(a.weekNumber) - Number(b.weekNumber)
          );

        if (this.weeks.length > 0) {
          await this.selectWeek(this.weeks[0]);
        } else {
          this.message =
            "No saved lesson notes match the selected filters.";
        }
      } catch (error) {
        if (requestNumber !== this.requestNumber) return;

        console.error("Failed to load lesson notes:", error);

        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Unable to load lesson notes. Please check your backend connection.";
      } finally {
        if (requestNumber === this.requestNumber) {
          this.loading = false;
        }
      }
    },

    async selectWeek(weekOrNumber) {
      const week =
        typeof weekOrNumber === "object"
          ? weekOrNumber
          : this.weeks.find(
              (item) => Number(item.weekNumber) === Number(weekOrNumber)
            );

      if (!week || week.id == null) {
        this.selectedLesson = null;
        this.detailError = "The selected lesson note has no valid database ID.";
        return;
      }

      const requestNumber = ++this.detailRequestNumber;

      this.selectedWeek = Number(week.weekNumber);
      this.selectedLesson = null;
      this.detailError = "";
      this.detailLoading = true;

      try {
        const baseUrl = import.meta.env.VITE_APP_BASE_URL;

        if (!baseUrl) {
          throw new Error(
            "VITE_APP_BASE_URL is not configured for the frontend."
          );
        }

        const response = await axios.get(
          `${baseUrl.replace(/\/+$/, "")}/api/lesson-notes/${week.id}`
        );

        if (requestNumber !== this.detailRequestNumber) return;

        // The prepared backend returns { lessonNote: {...} }.
        // Also accept a direct lesson object for compatibility.
        const lesson = response.data.lessonNote ?? response.data;

        if (!lesson || lesson.id == null) {
          throw new Error("The server did not return the requested lesson.");
        }

        this.selectedLesson = {
          ...lesson,
          objectives: this.asList(lesson.objectives),
          content: this.asList(lesson.content),
          activities: this.asList(lesson.activities),
          evaluation: this.asList(lesson.evaluation),
          periods: Array.isArray(lesson.periods) ? lesson.periods : [],
        };
      } catch (error) {
        if (requestNumber !== this.detailRequestNumber) return;

        console.error("Failed to load selected lesson:", error);

        this.detailError =
          error.response?.data?.message ||
          error.message ||
          "Unable to load the selected lesson note.";
      } finally {
        if (requestNumber === this.detailRequestNumber) {
          this.detailLoading = false;
        }
      }
    },

    asList(value) {
      if (Array.isArray(value)) {
        return value.filter(
          (item) => item !== null && item !== undefined && item !== ""
        );
      }

      if (typeof value === "string" && value.trim()) {
        return value
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean);
      }

      return [];
    },

    printLesson() {
      if (!this.currentLesson) return;
      window.print();
    },
  },

  mounted() {
    this.loadLessonNotes();
  },
};
</script>

<style scoped>
.lesson-notes-page {
  min-height: 100vh;
  padding: 24px;
  color: #111111;
  background: #ffffe0;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  color: #ffffff;
  background: #003366;
  padding: 20px 24px;
  border-radius: 10px;
}

.page-header h1 {
  margin: 0;
  font-size: 25px;
}

.page-header p {
  margin: 6px 0 0;
}

button,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.back-btn {
  border: 1px solid #ffffff;
  border-radius: 6px;
  padding: 10px 16px;
  color: #003366;
  background: #ffffff;
}

.filter-card {
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr)) auto;
  gap: 16px;
  align-items: end;
  margin-bottom: 20px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e2dfb8;
  border-radius: 10px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.filter-field label {
  font-weight: 700;
  font-size: 14px;
}

.filter-field select {
  width: 100%;
  min-width: 0;
  padding: 10px;
  border: 1px solid #c8c8c8;
  border-radius: 6px;
  background: #ffffff;
  color: #111111;
}

.primary-btn {
  border: none;
  border-radius: 6px;
  padding: 11px 16px;
  color: #ffffff;
  background: #003366;
  font-weight: 700;
}

.primary-btn:hover:not(:disabled) {
  background: #064b8b;
}

.message {
  margin: 16px 0;
  padding: 14px;
  border-radius: 7px;
  background: #ffffff;
  border: 1px solid #d7d7d7;
}

.error-message {
  color: #8a1717;
  border-color: #d99a9a;
  background: #fff2f2;
}

.retry-btn {
  margin-left: 10px;
  padding: 7px 10px;
  color: #ffffff;
  background: #003366;
  border: none;
  border-radius: 5px;
}

.lesson-layout {
  display: grid;
  grid-template-columns: minmax(190px, 230px) minmax(0, 1fr) minmax(220px, 260px);
  align-items: start;
  gap: 20px;
}

.weeks-panel,
.info-card,
.action-card {
  padding: 16px;
  border: 1px solid #e2dfb8;
  border-radius: 10px;
  background: #ffffff;
}

.weeks-panel h2 {
  margin: 0 0 14px;
  color: #003366;
  font-size: 19px;
}

.week-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  margin-bottom: 8px;
  padding: 12px;
  border: 1px solid #dddddd;
  border-radius: 7px;
  background: #ffffff;
  text-align: left;
  color: #111111;
}

.week-item span {
  overflow-wrap: anywhere;
  font-size: 13px;
}

.week-item.selected {
  color: #ffffff;
  background: #003366;
  border-color: #003366;
}

.lesson-content {
  min-width: 0;
}

.lesson-title {
  margin-bottom: 18px;
  padding: 22px;
  color: #ffffff;
  background: #003366;
  border-radius: 10px;
}

.lesson-title > span {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
}

.lesson-title h2 {
  margin: 8px 0;
  overflow-wrap: anywhere;
}

.lesson-title p {
  margin-bottom: 0;
}

.content-card {
  margin-bottom: 16px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e2dfb8;
  border-radius: 10px;
  overflow-wrap: anywhere;
}

.content-card h3 {
  margin: 0 0 14px;
  color: #003366;
  font-size: 18px;
}

.content-card h4 {
  color: #003366;
}

.content-card p {
  line-height: 1.7;
  white-space: pre-wrap;
}

.content-card li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.period-card {
  border-left: 5px solid #003366;
}

.lesson-subheading {
  margin-top: 22px;
}

.info-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.info-card h3 {
  margin: 0 0 16px;
  color: #003366;
  font-size: 18px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px 0;
  border-bottom: 1px solid #eeeeee;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row strong {
  font-size: 13px;
  color: #555555;
}

.info-row span {
  overflow-wrap: anywhere;
}

.full-btn {
  width: 100%;
}

.action-hint {
  margin-bottom: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #555555;
}

.empty-message {
  color: #666666;
  line-height: 1.6;
}

@media (max-width: 1100px) {
  .filter-card {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lesson-layout {
    grid-template-columns: minmax(170px, 220px) minmax(0, 1fr);
  }

  .info-panel {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .lesson-notes-page {
    padding: 12px;
  }

  .page-header {
    padding: 16px;
  }

  .page-header h1 {
    font-size: 20px;
  }

  .filter-card,
  .lesson-layout,
  .info-panel {
    grid-template-columns: minmax(0, 1fr);
  }

  .info-panel {
    display: flex;
  }

  .lesson-layout {
    gap: 14px;
  }

  .content-card {
    padding: 15px;
  }
}

@media print {
  .page-header .back-btn,
  .filter-card,
  .weeks-panel,
  .info-panel,
  .message {
    display: none !important;
  }

  .lesson-notes-page {
    padding: 0;
    background: #ffffff;
  }

  .lesson-layout {
    display: block;
  }

  .lesson-title,
  .content-card {
    color: #000000;
    background: #ffffff;
    border: 1px solid #cccccc;
    break-inside: avoid;
  }

  .lesson-title h2,
  .content-card h3,
  .content-card h4 {
    color: #000000;
  }
}
</style>


