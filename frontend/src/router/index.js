import store from '../store'; 
import { createRouter, createWebHashHistory } from "vue-router";
import InvestmentPage from "../components/InvestmentPage.vue";  // Fix: use relative path
import Signup from "../components/Signup.vue";                    // Fix: use relative path
import Terms from '@/components/Terms.vue';
import Chat from '@/components/Chat.vue';
import AboutPage from "../components/AboutPage.vue";   
import Login from "../components/Login.vue";                      // Fix: use relative path
import SummaryPage from "../components/SummaryPage.vue";          // Fix: use relative path
import ProfilePage from "../components/ProfilePage.vue";          // Fix: use relative path
import DepositPage from '@/components/DepositPage.vue';
import WithdrawalPage from '@/components/WithdrawalPage.vue';
import InvestmentDetails from '@/components/InvestmentDetails.vue';
import Timeframe from '@/components/Timeframe.vue';
import BannerCarousel from '@/components/BannerCarousel.vue';
import TrendGraph from '@/components/TrendGraph.vue';
import TrendPage from '@/components/TrendPage.vue';
import TransactionPage from '@/components/TransactionPage.vue';
import PaymentSuccess from '@/components/PaymentSuccess.vue';
import Receipt from '@/components/Receipt.vue';
import InvestmentAdvice from '@/components/InvestmentAdvice.vue';
import VerifyLog from '@/components/VerifyLog.vue';
import ForgotPassword from '@/components/ForgotPassword.vue';
import ResetPassword from '@/components/ResetPassword.vue';
import AdminPage from '@/components/AdminPage.vue';
import AdminChat from '@/components/AdminChat.vue';
import AdminLogin from "../components/AdminLogin.vue";
// Define the routes
const routes = [
  { path: "/forgot-password", component: ForgotPassword },  
  { path: "/reset-password/:token", component: ResetPassword },
  { path: "/verify", component: VerifyLog },
  {path: "/adminlogin", component: AdminLogin},
  { path: "/about", component: AboutPage },
  { path: "/advice", component: InvestmentAdvice },
  { path: "/chat", component: Chat },

  { path: "/terms", component: Terms},
  { path: "/", component: InvestmentPage },
  { path: "/signup", component: Signup },
  { path: "/login", component: Login },
  { path: "/summary", component: SummaryPage },
  { path: "/timeframe", component: Timeframe },
  { path: "/bannercarousel", component: BannerCarousel },
  { path: "/trend", component: TrendGraph },
  { path: "/trend/:categoryId", component: TrendPage },
  { path: '/payment-success', component: PaymentSuccess }, // Add this route
  { path: '/transaction/:userId', component: TransactionPage },
  { path: "/summary", name: "SummaryPage", component: SummaryPage },

  { path: '/profile/:userId', component: ProfilePage },
  {
  path: "/adminchat",
  name: "AdminChat",
  component: AdminChat,
  beforeEnter: () => {

    const adminToken = localStorage.getItem("adminToken");

    if (!adminToken) {
      return "/adminlogin";
    }

    return true;
  }
},
 
  { path: '/verify/:userId', name: 'Verify', component: () => import('../views/Verify.vue') },
  { path: '/deposit/:userId', component: DepositPage },
  { path: '/withdrawal/:userId', component: WithdrawalPage },
  { path: '/receipt/:userId', component: Receipt },
  { path: '/investment-details/:userId', component: InvestmentDetails },
  {path: '/profile', redirect: '/login'},
  {
  path: "/adminpage",
  component: AdminPage,

  beforeEnter: () => {

    const adminLoggedIn =
      localStorage.getItem("adminLoggedIn");

    if (adminLoggedIn !== "true") {
      return "/adminlogin";
    }

    return true;

  },

}

  
];

// Create the router instance
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    if (to.path.startsWith('/profile') && !token) {
      next('/login'); // Redirect to login if not authenticated
    } else {
      next();
    }
  });
  

// Export the router instance
export default router;
