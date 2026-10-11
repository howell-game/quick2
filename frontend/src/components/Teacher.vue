
<template>
  <div class="teacher-page">
    <div class="teacher-container">
      <!-- Header -->
      <header class="teacher-header">
        <button class="back-button" type="button" @click="goBack">
          ← Back
        </button>

        <h1>Education Services</h1>
        <p>Manage and access your teaching resources.</p>
      </header>

      <!-- Welcome section -->
      <section class="welcome-section">
        <h2>Welcome, Teacher</h2>
        <p>
          Choose a resource below to get started. Select the term,
          class, and subject you want to work with.
        </p>
      </section>

      <!-- Resource cards -->
      <section class="resource-grid">
        <button
          v-for="resource in resources"
          :key="resource.id"
          class="resource-card"
          type="button"
          @click="openModal(resource)"
        >
          <span class="resource-icon">{{ resource.icon }}</span>
          <span class="resource-title">{{ resource.name }}</span>
          <span class="resource-description">
            {{ resource.description }}
          </span>
          <span class="resource-action">Open resource →</span>
        </button>
      </section>
    </div>

    <!-- Resource selection modal -->
    <Teleport to="body">
      <div
        v-if="showModal && selectedResource"
        class="teacher-modal-overlay"
        @click.self="closeModal"
      >
        <section
          class="teacher-modal-box"
          role="dialog"
          aria-modal="true"
          :aria-label="selectedResource.name"
        >
          <button
            class="teacher-modal-close"
            type="button"
            aria-label="Close"
            @click="closeModal"
          >
            ×
          </button>

          <div class="modal-heading">
            <span class="modal-icon">{{ selectedResource.icon }}</span>
            <h2>{{ selectedResource.name }}</h2>
            <p>Select the details for this resource.</p>
          </div>

          <form @submit.prevent="openResource">
            <div class="form-field">
              <label for="teacher-term">Term</label>
              <select id="teacher-term" v-model="filters.term" required>
                <option value="" disabled>Select term</option>
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>

            <div class="form-field">
              <label for="teacher-class">Class</label>
              <select id="teacher-class" v-model="filters.class" required>
                <option value="" disabled>Select class</option>
                <option
                  v-for="item in classes"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                </option>
              </select>
            </div>

            <div class="form-field">
              <label for="teacher-subject">Subject</label>
              <select id="teacher-subject" v-model="filters.subject" required>
                <option value="" disabled>Select subject</option>
                <option
                  v-for="item in subjects"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                </option>
              </select>
            </div>

            <button class="modal-open-button" type="submit">
              Open
            </button>

            <button
              class="modal-cancel-button"
              type="button"
              @click="closeModal"
            >
              Cancel
            </button>
          </form>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script>
export default {
  name: "Teacher",

  data() {
    return {
      showModal: false,
      selectedResource: null,

      filters: {
        term: "",
        class: "",
        subject: ""
      },

      resources: [
        {
          id: 1,
          name: "Scheme of Work",
          icon: "📘",
          description: "Prepare and manage schemes of work."
        },
        {
          id: 2,
          name: "Lesson Notes",
          icon: "📝",
          description: "Prepare and organize lesson notes."
        },
        {
          id: 3,
          name: "Question Banks",
          icon: "❓",
          description: "Organize questions for tests and examinations."
        },
        {
          id: 4,
          name: "Assignments",
          icon: "📚",
          description: "Prepare and manage class assignments."
        }
      ],

      classes: [
        "JSS 1",
        "JSS 2",
        "JSS 3",
        "SSS 1",
        "SSS 2",
        "SSS 3"
      ],

      subjects: [
        "Mathematics",
        "English Language",
        "Biology",
        "Chemistry",
        "Physics",
        "Agricultural Science",
        "Basic Science",
        "Basic Technology",
        "Computer Studies",
        "Economics",
        "Government",
        "Geography",
        "Civic Education",
        "Social Studies",
        "Business Studies",
        "Further Mathematics",
        "Literature in English",
        "Christian Religious Studies",
        "Islamic Religious Studies",
        "Home Economics",
        "Physical and Health Education",
        "Other"
      ]
    };
  },

  methods: {
    goBack() {
      this.$router.push("/education");
    },

    openModal(resource) {
      this.selectedResource = resource;

      this.filters = {
        term: "",
        class: "",
        subject: ""
      };

      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.selectedResource = null;
    },

    
openResource() {
  if (this.selectedResource.name === "Scheme of Work") {
    this.$router.push({
      path: "/scheme-of-work",
      query: {
        term: this.filters.term,
        class: this.filters.class,
        subject: this.filters.subject,
        academicSession: "2026/2027"
      }
    });

    this.closeModal();
    return;
  }

  // Other resources will be connected later.
  console.log("Selected education resource:", {
    resource: this.selectedResource.name,
    term: this.filters.term,
    class: this.filters.class,
    subject: this.filters.subject
  });

  this.closeModal();
}

  }
};
</script>


<style>
.teacher-page {
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  padding: 30px 20px 50px;
  background: #ffffe0;
  color: #111111;
  font-family: Arial, Helvetica, sans-serif;
}

.teacher-container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.teacher-header {
  position: relative;
  text-align: center;
  padding: 10px 0 25px;
  border-bottom: 2px solid #d8d8b0;
}

.teacher-header h1 {
  margin: 15px 0 8px;
  color: #003366;
  font-size: 32px;
}

.teacher-header p {
  margin: 0;
  color: #444444;
  font-size: 16px;
}

.back-button {
  display: inline-block;
  padding: 10px 18px;
  border: none;
  border-radius: 6px;
  background: #003366;
  color: #ffffff;
  font-size: 15px;
  cursor: pointer;
}

.back-button:hover {
  background: #00509e;
}

.welcome-section {
  margin: 30px 0;
  text-align: center;
}

.welcome-section h2 {
  margin: 0 0 10px;
  color: #003366;
  font-size: 25px;
}

.welcome-section p {
  max-width: 650px;
  margin: 0 auto;
  line-height: 1.7;
  color: #333333;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
  width: 100%;
}

.resource-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  min-height: 220px;
  padding: 25px 20px;
  border: 1px solid #e2e2e2;
  border-radius: 12px;
  background: #ffffff;
  color: #111111;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.resource-card:hover {
  background: #f8f8f8;
  border-color: #dddddd;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
}

.resource-icon {
  margin-bottom: 12px;
  font-size: 38px;
}

.resource-title {
  margin-bottom: 10px;
  color: #003366;
  font-size: 20px;
  font-weight: bold;
}

.resource-description {
  margin-bottom: 18px;
  color: #444444;
  font-size: 14px;
  line-height: 1.6;
}

.resource-action {
  margin-top: auto;
  color: #003366;
  font-size: 14px;
  font-weight: bold;
}

/* Modal overlay */
.teacher-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.75);
}

/* Modal box */
.teacher-modal-box {
  position: relative;
  display: block;
  flex: 0 1 440px;
  width: 100%;
  max-width: 440px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  margin: auto;
  padding: 30px;
  box-sizing: border-box;
  border: 2px solid #003366;
  border-radius: 12px;
  background: #ffffe0;
  color: #111111;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

.modal-heading {
  text-align: center;
  margin-bottom: 25px;
}

.modal-icon {
  display: block;
  margin-bottom: 8px;
  font-size: 35px;
}

.modal-heading h2 {
  margin: 0 25px 8px;
  color: #003366;
  font-size: 24px;
}

.modal-heading p {
  margin: 0;
  color: #444444;
  font-size: 14px;
  line-height: 1.5;
}

.teacher-modal-close {
  position: absolute;
  top: 8px;
  right: 12px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #111111;
  font-size: 30px;
  line-height: 1;
  cursor: pointer;
}

.teacher-modal-close:hover {
  background: #f5f5f5;
}

.form-field {
  margin-bottom: 18px;
}

.form-field label {
  display: block;
  margin-bottom: 7px;
  color: #111111;
  font-size: 14px;
  font-weight: bold;
}

.form-field select {
  display: block;
  width: 100%;
  min-height: 44px;
  padding: 10px;
  box-sizing: border-box;
  border: 1px solid #999999;
  border-radius: 6px;
  background: #ffffff;
  color: #111111;
  font-size: 15px;
}

.form-field select:focus {
  outline: 2px solid #a6b8ca;
  outline-offset: 1px;
}

.modal-open-button,
.modal-cancel-button {
  display: block;
  width: 100%;
  min-height: 44px;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
}

.modal-open-button {
  margin-top: 25px;
  background: #003366;
  color: #ffffff;
  font-weight: bold;
}

.modal-open-button:hover {
  background: #00509e;
}

.modal-cancel-button {
  margin-top: 10px;
  background: #e5e5c5;
  color: #111111;
}

.modal-cancel-button:hover {
  background: #d6d6b4;
}

@media (max-width: 600px) {
  .teacher-page {
    padding: 20px 14px 35px;
  }

  .teacher-header h1 {
    font-size: 26px;
  }

  .resource-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .resource-card {
    min-height: 190px;
  }

  .teacher-modal-overlay {
    padding: 12px;
  }

  .teacher-modal-box {
    padding: 25px 20px;
    max-height: calc(100vh - 24px);
  }
}
</style>
