<template>
  <div class="admin-chat-page">

    <!-- =========================
         LEFT: UNRESOLVED CHATS
    ========================== -->
    <aside
      class="conversation-list"
      :class="{ 'mobile-hidden': selectedUserId }"
    >

      <div class="list-header">
        <h2>Support Chats</h2>

        <button
          @click="loadConversations"
          class="refresh-btn"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      <div v-if="loading" class="loading">
        Loading conversations...
      </div>

      <div
        v-else-if="conversations.length === 0"
        class="empty-list"
      >
        No unresolved conversations.
      </div>

      <div
        v-for="conversation in conversations"
        :key="conversation.userId"
        class="conversation"
        :class="{
          active: selectedUserId === conversation.userId
        }"
        @click="selectConversation(conversation)"
      >

        <div class="conversation-name">
          {{ conversation.userName || "User" }}
        </div>

        <div class="conversation-userid">
          {{ conversation.userId }}
        </div>

        <div class="conversation-preview">
          {{ conversation.lastMessage || "No message" }}
        </div>

      </div>

    </aside>


    <!-- =========================
         RIGHT: CHAT
    ========================== -->
    <section
      class="chat-section"
      :class="{ 'mobile-visible': selectedUserId }"
    >

      <!-- No chat selected -->
      <div
        v-if="!selectedUserId"
        class="no-chat"
      >

        <div class="no-chat-icon">
          💬
        </div>

        <h2>Select a conversation</h2>

        <p>
          Select an unresolved conversation from the left.
        </p>

      </div>


      <!-- Selected chat -->
      <template v-else>

        <!-- =========================
             CHAT HEADER
        ========================== -->
        <div class="chat-header">

          <div class="chat-user-info">

            <!-- MOBILE BACK BUTTON -->
            <button
              class="back-button"
              @click="closeConversation"
            >
              ←
            </button>

            <div>
              <h2>
                {{ selectedUserName || "User" }}
              </h2>

              <small>
                User ID: {{ selectedUserId }}
              </small>
            </div>

          </div>


          <button
            class="resolve-btn"
            @click="resolveConversation"
            :disabled="resolving"
          >
            {{ resolving ? "Resolving..." : "✓ Resolve Chat" }}
          </button>

        </div>


        <!-- =========================
             MESSAGES
        ========================== -->
        <div
          class="messages-container"
          ref="messagesContainer"
        >

          <div
            v-if="messages.length === 0"
            class="no-messages"
          >
            No messages in this conversation.
          </div>


          <div
            v-for="message in messages"
            :key="message.id || message.timestamp"
            :class="[
              'message',
              message.sender === 'admin'
                ? 'admin-message'
                : 'user-message'
            ]"
          >

            <div class="message-sender">

              {{
                message.sender === "admin"
                  ? "Admin"
                  : (message.userName || selectedUserName || "User")
              }}

            </div>

            <div class="message-text">
              {{ message.message }}
            </div>

            <div class="message-time">
              {{ formatTime(message.timestamp) }}
            </div>

          </div>

        </div>


        <!-- =========================
             ADMIN INPUT
        ========================== -->
        <div class="admin-input-area">

          <input
            v-model="adminMessage"
            type="text"
            placeholder="Type your response to the user..."
            @keyup.enter="sendMessage"
            :disabled="sending"
          />

          <button
            @click="sendMessage"
            :disabled="sending || !adminMessage.trim()"
          >
            {{ sending ? "Sending..." : "Send" }}
          </button>

        </div>

      </template>

    </section>

  </div>
</template>


<script>
import axios from "axios";

export default {

  name: "AdminChat",

  data() {
    return {

      conversations: [],

      loading: false,

      selectedUserId: null,

      selectedUserName: "",

      messages: [],

      adminMessage: "",

      sending: false,

      resolving: false,

      refreshTimer: null,

    };
  },


  mounted() {

    this.loadConversations();

    // Refresh unresolved chats every 3 seconds
    this.refreshTimer = setInterval(() => {

      this.loadConversations();

      // If a conversation is currently open,
      // refresh its messages too.
      if (this.selectedUserId) {
        this.loadSelectedMessages(false);
      }

    }, 3000);

  },


  beforeUnmount() {

    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

  },


  methods: {

    // =====================================================
    // LOAD UNRESOLVED CONVERSATIONS
    // =====================================================
    async loadConversations() {

      try {

        const response = await axios.get(
          `${import.meta.env.VITE_APP_BASE_URL}/api/chat/admin/unresolved`
        );

        this.conversations = response.data;

        /*
         * If the currently selected user is still present,
         * update their username from the conversation list.
         */
        if (this.selectedUserId) {

          const currentConversation =
            this.conversations.find(
              conversation =>
                conversation.userId === this.selectedUserId
            );

          if (currentConversation) {

            this.selectedUserName =
              currentConversation.userName ||
              this.selectedUserName ||
              "User";

          }

        }

      } catch (error) {

        console.error(
          "Failed to load conversations:",
          error
        );

      }

    },


    // =====================================================
    // SELECT CONVERSATION
    // =====================================================
    async selectConversation(conversation) {

      this.selectedUserId = conversation.userId;

      /*
       * First try the username supplied by the
       * unresolved-conversations endpoint.
       */
      this.selectedUserName =
        conversation.userName ||
        "User";

      this.messages = [];

      await this.loadSelectedMessages(true);

    },


    // =====================================================
    // LOAD SELECTED CHAT
    // =====================================================
    async loadSelectedMessages(scrollAfterLoad = false) {

      if (!this.selectedUserId) {
        return;
      }

      try {

        const response = await axios.get(
          `${import.meta.env.VITE_APP_BASE_URL}/api/chat/${this.selectedUserId}`
        );

        const newMessages = response.data || [];

        /*
         * If the conversation endpoint didn't provide
         * a username, get it from the messages.
         */
        if (
          (!this.selectedUserName ||
            this.selectedUserName === "User") &&
          newMessages.length > 0
        ) {

          const userMessage =
            newMessages.find(
              message =>
                message.sender === "user" &&
                message.userName
            );

          if (userMessage) {

            this.selectedUserName =
              userMessage.userName;

          }

        }

        /*
         * Only update the chat if the messages actually
         * changed. This prevents unnecessary visual
         * refreshing every 3 seconds.
         */
        const oldMessages =
          JSON.stringify(this.messages);

        const newMessagesString =
          JSON.stringify(newMessages);

        if (oldMessages !== newMessagesString) {

          this.messages = newMessages;

          if (scrollAfterLoad) {

            this.$nextTick(() => {
              this.scrollToBottom();
            });

          }

        }

      } catch (error) {

        console.error(
          "Failed to load chat:",
          error
        );

      }

    },


    // =====================================================
    // SEND ADMIN MESSAGE
    // =====================================================
    async sendMessage() {

      if (
        !this.adminMessage.trim() ||
        !this.selectedUserId
      ) {
        return;
      }

      this.sending = true;

      const messageText =
        this.adminMessage.trim();

      try {

        await axios.post(
          `${import.meta.env.VITE_APP_BASE_URL}/api/chat/admin/reply`,
          {
            userId: this.selectedUserId,

            userName:
              this.selectedUserName || "User",

            message: messageText
          }
        );

        /*
         * Clear input immediately.
         */
        this.adminMessage = "";

        /*
         * IMPORTANT:
         * Immediately reload the conversation after
         * the admin sends the reply.
         */
        await this.loadSelectedMessages(true);

        /*
         * Also refresh the conversation list immediately.
         */
        await this.loadConversations();

      } catch (error) {

        console.error(
          "Failed to send admin message:",
          error
        );

        alert("Failed to send message.");

      } finally {

        this.sending = false;

      }

    },


    // =====================================================
    // RESOLVE CHAT
    // =====================================================
    async resolveConversation() {

      if (!this.selectedUserId) {
        return;
      }

      const confirmed = confirm(
        "Are you sure you want to resolve this conversation?"
      );

      if (!confirmed) {
        return;
      }

      this.resolving = true;

      try {

        await axios.patch(
          `${import.meta.env.VITE_APP_BASE_URL}/api/chat/admin/resolve/${this.selectedUserId}`
        );

        /*
         * Remove the conversation from the unresolved list.
         */
        this.conversations =
          this.conversations.filter(
            conversation =>
              conversation.userId !== this.selectedUserId
          );

        /*
         * Close the conversation.
         */
        this.closeConversation();

      } catch (error) {

        console.error(
          "Failed to resolve conversation:",
          error
        );

        alert("Failed to resolve conversation.");

      } finally {

        this.resolving = false;

      }

    },


    // =====================================================
    // CLOSE MOBILE CONVERSATION
    // =====================================================
    closeConversation() {

      this.selectedUserId = null;

      this.selectedUserName = "";

      this.messages = [];

      this.adminMessage = "";

    },


    // =====================================================
    // SCROLL TO BOTTOM
    // =====================================================
    scrollToBottom() {

      const container =
        this.$refs.messagesContainer;

      if (container) {

        container.scrollTop =
          container.scrollHeight;

      }

    },


    // =====================================================
    // FORMAT TIME
    // =====================================================
    formatTime(timestamp) {

      if (!timestamp) {
        return "";
      }

      return new Date(timestamp).toLocaleString(
        "en-NG",
        {
          dateStyle: "short",
          timeStyle: "short"
        }
      );

    }

  }

};
</script>


<style scoped>

* {
  box-sizing: border-box;
}


/* ==========================================
   MAIN PAGE
========================================== */

.admin-chat-page {

  width: 100%;

  height: calc(100vh - 80px);

  display: flex;

  background: #f5f6f8;

  overflow: hidden;

}


/* ==========================================
   CONVERSATION LIST
========================================== */

.conversation-list {

  width: 320px;

  min-width: 320px;

  background: #fff;

  border-right: 1px solid #ddd;

  display: flex;

  flex-direction: column;

  overflow-y: auto;

}


.list-header {

  height: 70px;

  min-height: 70px;

  padding: 0 18px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  border-bottom: 1px solid #ddd;

}


.list-header h2 {

  margin: 0;

  font-size: 20px;

  color: #222;

}


.refresh-btn {

  border: none;

  background: transparent;

  font-size: 25px;

  cursor: pointer;

}


.conversation {

  padding: 15px;

  border-bottom: 1px solid #eee;

  cursor: pointer;

  transition: 0.2s;

}


.conversation:hover {

  background: #f5f5f5;

}


.conversation.active {

  background: #fff3cd;

  border-left: 4px solid red;

}


.conversation-name {

  font-weight: bold;

  font-size: 16px;

}


.conversation-userid {

  font-size: 12px;

  color: #777;

  margin-top: 3px;

}


.conversation-preview {

  font-size: 13px;

  color: #666;

  margin-top: 7px;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;

}


/* ==========================================
   CHAT SECTION
========================================== */

.chat-section {

  flex: 1;

  display: flex;

  flex-direction: column;

  min-width: 0;

}


/* ==========================================
   CHAT HEADER
========================================== */

.chat-header {

  height: 70px;

  min-height: 70px;

  background: white;

  border-bottom: 1px solid #ddd;

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 0 25px;

}


.chat-user-info {

  display: flex;

  align-items: center;

  gap: 10px;

}


.chat-header h2 {

  margin: 0;

  font-size: 19px;

}


.chat-header small {

  color: #777;

}


/* ==========================================
   BACK BUTTON
========================================== */

.back-button {

  display: none;

  border: none;

  background: transparent;

  font-size: 25px;

  cursor: pointer;

}


/* ==========================================
   RESOLVE BUTTON
========================================== */

.resolve-btn {

  background: #198754;

  color: white;

  border: none;

  padding: 10px 16px;

  border-radius: 5px;

  cursor: pointer;

  font-weight: bold;

}


.resolve-btn:hover {

  background: #146c43;

}


.resolve-btn:disabled {

  opacity: 0.6;

}


/* ==========================================
   MESSAGES
========================================== */

.messages-container {

  flex: 1;

  overflow-y: auto;

  padding: 25px;

  display: flex;

  flex-direction: column;

  gap: 10px;

}


.message {

  max-width: 70%;

  padding: 10px 14px;

  border-radius: 10px;

}


.user-message {

  align-self: flex-start;

  background: white;

  border: 1px solid #ddd;

}


.admin-message {

  align-self: flex-end;

  background: #ffe0b2;

}


.message-sender {

  font-size: 12px;

  font-weight: bold;

  margin-bottom: 4px;

}


.message-text {

  font-size: 15px;

  line-height: 1.4;

  word-break: break-word;

}


.message-time {

  font-size: 10px;

  color: #777;

  margin-top: 5px;

}


/* ==========================================
   ADMIN INPUT
========================================== */

.admin-input-area {

  min-height: 75px;

  background: white;

  border-top: 1px solid #ddd;

  padding: 12px 20px;

  display: flex;

  gap: 10px;

}


.admin-input-area input {

  flex: 1;

  padding: 13px;

  border: 1px solid #ccc;

  border-radius: 6px;

  font-size: 15px;

  outline: none;

}


.admin-input-area input:focus {

  border-color: red;

}


.admin-input-area button {

  width: 100px;

  border: none;

  border-radius: 6px;

  background: red;

  color: white;

  font-weight: bold;

  cursor: pointer;

}


.admin-input-area button:hover {

  background: #cc0000;

}


.admin-input-area button:disabled {

  opacity: 0.5;

  cursor: not-allowed;

}


/* ==========================================
   EMPTY STATES
========================================== */

.loading,
.empty-list {

  padding: 30px;

  text-align: center;

  color: #777;

}


.no-chat {

  flex: 1;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  color: #777;

  text-align: center;

}


.no-chat-icon {

  font-size: 55px;

  margin-bottom: 10px;

}


.no-chat h2 {

  margin-bottom: 5px;

}


.no-messages {

  text-align: center;

  color: #888;

  margin-top: 50px;

}


/* ==========================================
   MOBILE
========================================== */

@media (max-width: 700px) {

  .admin-chat-page {

    height: calc(100vh - 60px);

    width: 100%;

    position: relative;

  }


  /* LIST TAKES FULL SCREEN */

  .conversation-list {

    width: 100%;

    min-width: 100%;

    height: 100%;

    border-right: none;

  }


  /*
   * IMPORTANT:
   * When a conversation is selected,
   * hide ONLY the list.
   */

  .conversation-list.mobile-hidden {

    display: none;

  }


  /*
   * CHAT TAKES FULL SCREEN
   */

  .chat-section {

    width: 100%;

    height: 100%;

    flex: none;

    display: none;

  }


  /*
   * When a conversation is selected,
   * SHOW THE CHAT.
   */

  .chat-section.mobile-visible {

    display: flex;

  }


  /* SHOW BACK BUTTON ON MOBILE */

  .back-button {

    display: block;

  }


  .chat-header {

    padding: 0 10px;

  }


  .chat-header h2 {

    font-size: 16px;

  }


  .chat-header small {

    font-size: 10px;

  }


  .resolve-btn {

    padding: 8px 10px;

    font-size: 11px;

  }


  .messages-container {

    padding: 12px;

  }


  .message {

    max-width: 85%;

  }


  .admin-input-area {

    padding: 8px;

    min-height: 60px;

  }


  .admin-input-area input {

    min-width: 0;

    padding: 10px;

    font-size: 14px;

  }


  .admin-input-area button {

    width: 70px;

    min-width: 70px;

  }

}

</style>