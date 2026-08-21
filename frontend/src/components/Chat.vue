<template>
  <div class="chat-container">

    <h2>Support Chat</h2>

    <!-- ========================= -->
    <!-- CHAT MESSAGES -->
    <!-- ========================= -->

    <div
      class="chat-box"
      ref="chatBox"
    >

      <div
        v-for="(message, index) in chatMessages"
        :key="message.id || index"
        :class="[
          'message',
          message.sender === 'user' ? 'user' : 'admin'
        ]"
      >

        <!-- USER MESSAGE -->
        <template v-if="message.sender === 'user'">

          <span class="sender-name">
            {{ message.userName || userName }}
          </span>

          <p>
            {{ message.message }}
          </p>

        </template>


        <!-- ADMIN MESSAGE -->
        <template v-else>

          <span class="sender-name">
            Admin
          </span>

          <p>
            {{ message.message }}
          </p>

        </template>

      </div>


      <!-- NO MESSAGES -->
      <div
        v-if="chatMessages.length === 0 && !loading"
        class="empty-chat"
      >
        <p>
          No messages yet.
        </p>

        <p>
          Send us a message and our support team will respond.
        </p>
      </div>


      <!-- LOADING -->
      <div
        v-if="loading"
        class="loading"
      >
        Loading messages...
      </div>

    </div>


    <!-- ========================= -->
    <!-- MESSAGE INPUT -->
    <!-- ========================= -->

    <div class="chat-input">

      <input
        v-model="userMessage"
        @keyup.enter="sendMessage"
        placeholder="Type your message..."
        class="chat-input-field"
        :disabled="sending"
      />

      <button
        @click="sendMessage"
        :disabled="sending"
      >
        {{ sending ? "Sending..." : "Send" }}
      </button>

    </div>

  </div>
</template>


<script>

import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick
} from "vue";

import {
  useStore
} from "vuex";

import axios from "axios";

import {
  useToast
} from "vue-toastification";


export default {

  name: "Chat",


  setup() {

    // ==========================================
    // STORE
    // ==========================================

    const store = useStore();

    const toast = useToast();


    // ==========================================
    // USER INFORMATION FROM VUEX
    // ==========================================

    const userId = computed(() => store.state.userId);

    const userName = computed(() => store.state.userName);


    // ==========================================
    // CHAT DATA
    // ==========================================

    const chatMessages = ref([]);

    const userMessage = ref("");

    const loading = ref(false);

    const sending = ref(false);

    const chatBox = ref(null);

    let refreshTimer = null;


    // ==========================================
    // API BASE URL
    // ==========================================

    const API_URL =
      import.meta.env.VITE_APP_BASE_URL;


    // ==========================================
    // SCROLL TO BOTTOM
    // ==========================================

    const scrollToBottom = async () => {

      await nextTick();

      if (chatBox.value) {

        chatBox.value.scrollTop =
          chatBox.value.scrollHeight;

      }

    };


    // ==========================================
    // LOAD CHAT MESSAGES
    // ==========================================

    const loadMessages = async (showLoading = true) => {

      if (!userId.value) {
        console.warn("No user ID available.");
        return;
      }


      try {

        if (showLoading) {
          loading.value = true;
        }


        const response = await axios.get(
          `${API_URL}/api/chat/${userId.value}`,
          {
            headers: {
              Authorization:
                `Bearer ${store.getters.token}`,
            },
          }
        );


        const oldLength =
          chatMessages.value.length;


        chatMessages.value =
          response.data;


        await scrollToBottom();


        // ------------------------------------------
        // Notify user if a new message arrived
        // ------------------------------------------

        if (
          !showLoading &&
          response.data.length > oldLength
        ) {

          const newestMessage =
            response.data[response.data.length - 1];


          if (
            newestMessage &&
            newestMessage.sender === "admin"
          ) {

            toast.success(
              "You have a new support message."
            );

          }

        }

      } catch (error) {

        console.error(
          "Failed to load chat messages:",
          error
        );

      } finally {

        loading.value = false;

      }

    };


    // ==========================================
    // SEND USER MESSAGE
    // ==========================================

    const sendMessage = async () => {

      const message =
        userMessage.value.trim();


      if (!message) {
        return;
      }


      if (!userId.value) {

        toast.error(
          "Unable to identify your account."
        );

        return;

      }


      if (!userName.value) {

        toast.error(
          "Unable to identify your name."
        );

        return;

      }


      try {

        sending.value = true;


        const response = await axios.post(
          `${API_URL}/api/chat`,
          {
            userId: userId.value,
            userName: userName.value,
            message: message,
          },
          {
            headers: {
              Authorization:
                `Bearer ${store.getters.token}`,
            },
          }
        );


        // ------------------------------------------
        // Add saved message immediately
        // ------------------------------------------

        if (response.data.chatMessage) {

          chatMessages.value.push(
            response.data.chatMessage
          );

        }


        // Clear input

        userMessage.value = "";


        await scrollToBottom();


      } catch (error) {

        console.error(
          "Failed to send message:",
          error
        );


        toast.error(
          error.response?.data?.error ||
          "Failed to send message."
        );

      } finally {

        sending.value = false;

      }

    };


    // ==========================================
    // START AUTOMATIC REFRESH
    // ==========================================

    const startMessageRefresh = () => {

      refreshTimer =
        setInterval(() => {

          loadMessages(false);

        }, 3000);

    };


    // ==========================================
    // STOP AUTOMATIC REFRESH
    // ==========================================

    const stopMessageRefresh = () => {

      if (refreshTimer) {

        clearInterval(refreshTimer);

        refreshTimer = null;

      }

    };


    // ==========================================
    // ON MOUNT
    // ==========================================

    onMounted(async () => {

      console.log(
        "Chat user ID:",
        userId.value
      );

      console.log(
        "Chat user name:",
        userName.value
      );


      await loadMessages();


      startMessageRefresh();

    });


    // ==========================================
    // BEFORE UNMOUNT
    // ==========================================

    onBeforeUnmount(() => {

      stopMessageRefresh();

    });


    return {

      userId,
      userName,

      chatMessages,
      userMessage,

      loading,
      sending,

      chatBox,

      sendMessage,
      loadMessages,

    };

  },

};

</script>


<style scoped>

.chat-container {

  width: 100%;

  max-width: 800px;

  margin: 20px auto;

  padding: 20px;

  border: 1px solid #ccc;

  border-radius: 8px;

  background: lightyellow;

  display: flex;

  flex-direction: column;

  height: 80vh;

}


.chat-container h2 {

  margin-top: 0;

  text-align: center;

}


/* ============================= */
/* CHAT BOX */
/* ============================= */

.chat-box {

  flex-grow: 1;

  overflow-y: auto;

  margin-bottom: 10px;

  padding: 10px;

  background: #fff;

  border-radius: 5px;

  border: 1px solid #ddd;

}


/* ============================= */
/* MESSAGE */
/* ============================= */

.message {

  max-width: 75%;

  padding: 10px;

  margin: 8px 0;

  border-radius: 8px;

  word-wrap: break-word;

}


.message p {

  margin: 5px 0 0;

}


/* ============================= */
/* USER MESSAGE */
/* ============================= */

.message.user {

  background: #e1f5fe;

  margin-left: auto;

  text-align: right;

}


/* ============================= */
/* ADMIN MESSAGE */
/* ============================= */

.message.admin {

  background: #c8e6c9;

  margin-right: auto;

  text-align: left;

}


/* ============================= */
/* SENDER NAME */
/* ============================= */

.sender-name {

  font-weight: bold;

  font-size: 13px;

}


/* ============================= */
/* EMPTY CHAT */
/* ============================= */

.empty-chat {

  text-align: center;

  margin: auto;

  color: #777;

}


/* ============================= */
/* LOADING */
/* ============================= */

.loading {

  text-align: center;

  padding: 10px;

  color: #777;

}


/* ============================= */
/* INPUT */
/* ============================= */

.chat-input {

  display: flex;

  gap: 8px;

  padding-top: 10px;

}


.chat-input-field {

  flex-grow: 1;

  padding: 12px;

  border: 1px solid #ccc;

  border-radius: 5px;

  font-size: 16px;

  outline: none;

}


.chat-input-field:focus {

  border-color: #888;

}


.chat-input button {

  padding: 12px 20px;

  background: red;

  color: lightyellow;

  border: none;

  border-radius: 5px;

  cursor: pointer;

}


.chat-input button:disabled {

  opacity: 0.6;

  cursor: not-allowed;

}

</style>
