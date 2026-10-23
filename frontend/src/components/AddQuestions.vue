
<template>
  <div class="add-questions-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">ETREND EDUCATION SERVICES</p>
        <h1>Add Questions</h1>
        <p class="subtitle">
          Create and save questions to your school question bank.
        </p>
      </div>
      <div class="header-icon">✎</div>
    </header>

    <form class="question-form" @submit.prevent="saveQuestion">
      <section class="form-section">
        <h2>1. Question Details</h2>

        <div class="form-grid">
          <div class="field">
            <label for="className">Class *</label>
            <select id="className" v-model="form.className" required>
              <option value="">Select class</option>
              <option v-for="item in classes" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </div>

          <div class="field">
            <label for="subject">Subject *</label>
            <select id="subject" v-model="form.subject" required>
              <option value="">Select subject</option>
              <option v-for="item in subjects" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </div>

          <div class="field">
            <label for="topic">Topic *</label>
            <input
              id="topic"
              v-model="form.topic"
              type="text"
              maxlength="200"
              placeholder="e.g. Number and Numeration"
              required
            />
          </div>

          <div class="field">
            <label for="questionType">Question Type *</label>
            <select id="questionType" v-model="form.questionType" required>
              <option value="objective">Objective</option>
              <option value="theory">Theory</option>
            </select>
          </div>
        </div>
      </section>

      <section class="form-section">
        <div class="section-title-row">
          <h2>2. Write the Question</h2>
          <span class="format-badge">Text preserved</span>
        </div>

        <p class="help-text">
          Type your question exactly as you want it saved. Use ^ for powers
          such as 2^2, or paste symbols such as x² and H₂O.
        </p>

        <div class="field">
          <label for="questionText">Question *</label>
          <textarea
            id="questionText"
            v-model="form.text"
            rows="5"
            placeholder="Enter the full question here..."
            required
          ></textarea>
        </div>

        <div v-if="form.questionType === 'objective'" class="options-area">
          <h3>Answer Options</h3>
          <p class="help-text">
            Enter each option exactly as it should appear.
          </p>

          <div
            v-for="(option, index) in form.options"
            :key="index"
            class="option-row"
          >
            <span class="option-letter">
              {{ String.fromCharCode(65 + index) }}
            </span>
            <input
              v-model="form.options[index]"
              type="text"
              :aria-label="`Option ${String.fromCharCode(65 + index)}`"
              :placeholder="`Enter option ${String.fromCharCode(65 + index)}`"
              required
            />
          </div>

          <div class="field correct-answer-field">
            <label for="answer">Correct Answer *</label>
            <select id="answer" v-model="form.answer" required>
              <option value="">Choose correct option</option>
              <option value="A">Option A</option>
              <option value="B">Option B</option>
              <option value="C">Option C</option>
              <option value="D">Option D</option>
            </select>
          </div>
        </div>

        <div v-else class="field theory-answer">
          <label for="answer">Model Answer (optional)</label>
          <textarea
            id="answer"
            v-model="form.answer"
            rows="4"
            placeholder="Enter the suggested answer or marking guide..."
          ></textarea>
        </div>
      </section>

      <div v-if="message.text" class="message" :class="message.type">
        {{ message.text }}
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="reset-button"
          @click="resetForm"
          :disabled="saving"
        >
          Clear Form
        </button>

        <button type="submit" class="save-button" :disabled="saving">
          {{ saving ? "Saving..." : "Save Question" }}
        </button>
      </div>
    </form>

    <section class="format-note">
      <strong>Important:</strong>
      Questions, options, and answers are stored as text. The system does not
      automatically convert mathematical expressions or remove symbols.
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/$/,
  ""
);

const QUESTION_BANK_URL = `${API_BASE_URL}/api/question-bank`;

const classes = [
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SS 1",
  "SS 2",
  "SS 3",
];

const subjects = [
  "Mathematics",
  "English Language",
  "Basic Science",
  "Biology",
  "Agricultural Science",
];

const createEmptyForm = () => ({
  className: "",
  subject: "",
  topic: "",
  questionType: "objective",
  text: "",
  options: ["", "", "", ""],
  answer: "",
});

const form = reactive(createEmptyForm());
const saving = ref(false);
const message = reactive({
  text: "",
  type: "",
});

async function saveQuestion() {
  message.text = "";
  message.type = "";

  // Validate without modifying the text that will be saved.
  if (
    !form.className ||
    !form.subject ||
    !form.topic.trim() ||
    !form.text.trim()
  ) {
    message.text = "Please complete all required question details.";
    message.type = "error";
    return;
  }

  if (form.questionType === "objective") {
    if (form.options.some((option) => !option.trim())) {
      message.text = "Please fill in all four answer options.";
      message.type = "error";
      return;
    }

    if (!["A", "B", "C", "D"].includes(form.answer)) {
      message.text = "Please choose the correct answer.";
      message.type = "error";
      return;
    }
  }

  const payload = {
    className: form.className,
    subject: form.subject,
    topic: form.topic,
    questionType: form.questionType,
    text: form.text,
    options:
      form.questionType === "objective"
        ? [...form.options]
        : [],
    answer: form.answer,
  };

  saving.value = true;

  try {
    const response = await fetch(QUESTION_BANK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to save the question.");
    }

    message.text = "Question saved successfully.";
    message.type = "success";

    // Clear the form only after the server confirms the save.
    Object.assign(form, createEmptyForm());
  } catch (error) {
    message.text =
      error.message || "A network error occurred while saving the question.";
    message.type = "error";
  } finally {
    saving.value = false;
  }
}

function resetForm() {
  Object.assign(form, createEmptyForm());
  message.text = "";
  message.type = "";
}
</script>

<style scoped>
.add-questions-page {
  min-height: 100vh;
  padding: 28px;
  background: #fff9db;
  color: #111111;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  max-width: 1050px;
  margin: 0 auto 24px;
  padding: 26px 30px;
  background: #003366;
  color: #ffffff;
  border-radius: 14px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #ffed9e;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(25px, 4vw, 34px);
}

.subtitle {
  margin: 9px 0 0;
  color: #e6edf7;
  line-height: 1.5;
}

.header-icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 14px;
  background: #ffed9e;
  color: #003366;
  font-size: 30px;
}

.question-form,
.format-note {
  max-width: 1050px;
  margin: 0 auto 18px;
}

.form-section {
  margin-bottom: 20px;
  padding: 25px;
  border: 1px solid #e6dca7;
  border-radius: 12px;
  background: #ffffff;
}

.form-section h2 {
  margin: 0 0 20px;
  color: #003366;
  font-size: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  margin-bottom: 18px;
}

.field label {
  font-size: 14px;
  font-weight: 700;
}

.field input,
.field select,
.field textarea,
.option-row input {
  width: 100%;
  min-width: 0;
  padding: 12px 13px;
  border: 1px solid #c9ced6;
  border-radius: 7px;
  background: #ffffff;
  color: #111111;
  font: inherit;
  line-height: 1.5;
}

.field textarea {
  resize: vertical;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.field input:focus,
.field select:focus,
.field textarea:focus,
.option-row input:focus {
  outline: 2px solid #003366;
  outline-offset: 1px;
  border-color: #003366;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.format-badge {
  padding: 6px 10px;
  border-radius: 20px;
  background: #fff1b8;
  color: #003366;
  font-size: 12px;
  font-weight: 800;
}

.help-text {
  margin: -8px 0 18px;
  color: #555555;
  font-size: 13px;
  line-height: 1.6;
}

.options-area {
  margin-top: 24px;
}

.options-area h3 {
  margin: 0 0 18px;
  color: #003366;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.option-letter {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 7px;
  background: #003366;
  color: #ffffff;
  font-weight: 800;
}

.correct-answer-field {
  max-width: 350px;
  margin-top: 22px;
}

.theory-answer {
  margin-top: 24px;
}

.message {
  max-width: 1050px;
  margin: 0 auto 16px;
  padding: 13px 15px;
  border-radius: 8px;
  font-size: 14px;
}

.message.success {
  background: #e6f5e8;
  border: 1px solid #8ac79a;
  color: #145c2c;
}

.message.error {
  background: #fff0f0;
  border: 1px solid #e5a1a1;
  color: #8b1717;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  margin: 20px 0;
}

.form-actions button {
  min-width: 145px;
  padding: 13px 20px;
  border: 0;
  border-radius: 8px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.save-button {
  background: #003366;
  color: #ffffff;
}

.save-button:hover {
  background: #004786;
}

.reset-button {
  background: #ffed9e;
  color: #111111;
}

.form-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.format-note {
  padding: 17px 20px;
  border-left: 5px solid #003366;
  border-radius: 6px;
  background: #ffffff;
  font-size: 14px;
  line-height: 1.7;
}

@media (max-width: 650px) {
  .add-questions-page {
    padding: 14px;
  }

  .page-header {
    padding: 20px;
  }

  .header-icon {
    width: 44px;
    height: 44px;
    font-size: 24px;
  }

  .form-section {
    padding: 18px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>
