import { createStore } from "vuex";
import { io } from "socket.io-client";
import sanitizeHtml from "sanitize-html"; // Import sanitize-html for security
import axios from "axios"; // Import axios for API requests

const store = createStore({
  state: {
    trendCache:{},
    isLoggedIn: localStorage.getItem("token") ? true : false,
    userName: localStorage.getItem("userName") || null,
    memberName: localStorage.getItem("memberName") || null,
    memberId: localStorage.getItem("memberId") || null,
    userId: localStorage.getItem("userId") || null,
    balance: parseFloat(localStorage.getItem("balance")) || 0,
    shareBalance: parseFloat(localStorage.getItem("shareBalance")) || 0,
    contributedShare: parseFloat(localStorage.getItem("contributedShare")) || 0,
    sharePercentage: parseFloat(localStorage.getItem("sharePercentage")) || 0,
    token: localStorage.getItem("token") || null,
    chatMessages: [],
    socket: null,
  },
  mutations: {
    SET_TRENDS(state,trends){
      state.trendCache = trends;
  },
    setUser(state, userData) {
      state.isLoggedIn = true;
      state.userName = userData.name;
      state.userId = userData.userId;
      state.balance = userData.balance;
      state.token = userData.token;


      localStorage.setItem("token", userData.token);
      localStorage.setItem("userName", userData.name);
      localStorage.setItem("userId", userData.userId);
      localStorage.setItem("balance", userData.balance);
    },
    setMember(state, memberData) {
      state.isLoggedIn = true;
      state.memberName = memberData.name;
      state.memberId = memberData.memberId;
      state.shareBalance = memberData.shareBalance;
      state.contributedShare = memberData.contributedShare;
      state.sharePercentage = memberData.sharePercentage;
      state.token = memberData.token;

      localStorage.setItem("token", memberData.token);
      localStorage.setItem("memberName", memberData.name);
      localStorage.setItem("memberId", memberData.memberId);
      localStorage.setItem("shareBalance", memberData.shareBalance);
      localStorage.setItem("contributedShare", memberData.contributedShare);
      localStorage.setItem("sharePercentage", memberData.sharePercentage);
    },

    updateShareBalance(state, newShareBalance) {
      state.shareBalance = newShareBalance;
      localStorage.setItem("shareBalance", newShareBalance);
    },

    updateContributedShare(state, newContributedShare) {
      state.contributedShare = newContributedShare;
      localStorage.setItem("contributedShare", newContributedShare);
    },

    updateSharePercentage(state, newSharePercentage) {
      state.sharePercentage = newSharePercentage;
      localStorage.setItem("sharePercentage", newSharePercentage);
    },

    updateBalance(state, newBalance) {
      state.balance = newBalance;
      localStorage.setItem("balance", newBalance);
    },

    logOut(state) {
      console.log("🚪 Logging out user due to inactivity...");
      state.isLoggedIn = false;
      state.userName = null;
      state.memberName = null;
      state.userId = null;
      state.memberId = null;
      state.balance = 0;
      state.shareBalance = 0;
      state.contributedShare = 0;
      state.sharePercentage = 0;
      state.token = null;

      localStorage.removeItem("token");
      localStorage.removeItem("userName");
      localStorage.removeItem("userId");
      localStorage.removeItem("shareBalance");
      localStorage.removeItem("memberName");
      localStorage.removeItem("memberId");
      localStorage.removeItem("balance");
      localStorage.removeItem("sharePercentage");
      localStorage.removeItem("contributedShare");

      if (state.socket) {
        state.socket.disconnect();
        state.socket = null;
      }
    },

    ADD_CHAT_MESSAGE(state, message) {
      // Sanitize incoming messages before storing
      const sanitizedMessage = {
        sender: message.sender,
        text: sanitizeHtml(message.text, {
          allowedTags: ["b", "i", "em", "strong", "a", "p", "br", "u"],
          allowedAttributes: {
            a: ["href", "target"],
          },
        }),
      };
      state.chatMessages.push(sanitizedMessage);
    },

    SET_SOCKET(state, socket) {
      state.socket = socket;
    },
  },
  actions: {
    logIn({ commit }, userData) {
      commit("setUser", userData);
    },

    logOut({ commit }) {
      commit("logOut");
    },

    async loadTrendCache({ commit }) {

  try {

    const response = await axios.get(
      `${import.meta.env.VITE_APP_BASE_URL}/api/investments/trend-data`
    );

    if (response.data.success) {

      commit("SET_TRENDS", response.data.trends);

      console.log("Trend cache loaded.");

    }

  } catch (err) {

    console.error("Trend cache error:", err);

  }

},

    async fetchShareBalance({ commit, state }) {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_BASE_URL}/api/members/${state.memberId}/details`,
          {
            headers: { Authorization: `Bearer ${state.token}` },
          }
        );
        

        const { shareBalance, contributedShare, sharePercentage } = response.data;

        // Commit to Vuex store
        commit("updateShareBalance", shareBalance);
        commit("updateContributedShare", contributedShare);
        commit("updateSharePercentage", sharePercentage);
      } catch (error) {
        console.error("Error fetching share balance:", error);
      }
    },

    connectWebSocket({ commit, state }) {
      if (!state.userId || state.socket) return;

      const socket = io(`${import.meta.env.VITE_APP_BASE_URL}`);


      socket.on("connect", () => {
        console.log("Connected to WebSocket");
      });

      socket.on("message", (receivedMessage) => {
        commit("ADD_CHAT_MESSAGE", receivedMessage);
      });

      socket.on("disconnect", () => {
        console.log("WebSocket Disconnected");
      });

      commit("SET_SOCKET", socket);
    },

    sendMessage({ state, commit }, messageText) {
      if (!state.socket) return;

      // Sanitize user input before sending
      const sanitizedText = sanitizeHtml(messageText, {
        allowedTags: ["b", "i", "em", "strong", "a", "p", "br", "u"],
        allowedAttributes: {
          a: ["href", "target"],
        },
      });

      const messageData = {
        userId: state.userId,
        text: sanitizedText,
        sender: "user",
        token: state.token,
      };

      state.socket.emit("message", messageData);
      commit("ADD_CHAT_MESSAGE", { text: sanitizedText, sender: "user" });
    },
  },
  getters: {
    trendCache(state){
      return state.trendCache;
    },
    isLoggedIn: (state) => state.isLoggedIn,
    userId: (state) =>state.userId,
    userName: (state) => state.userName,
    memberName: (state) => state.memberName,
    memberId: (state) => state.memberId,
    balance: (state) => state.balance,
    shareBalance: (state) => state.shareBalance,
    contributedShare: (state) => state.contributedShare,
    sharePercentage: (state) => state.sharePercentage,
    token: (state) => state.token,
    chatMessages: (state) => state.chatMessages,
  },
});

export default store;
