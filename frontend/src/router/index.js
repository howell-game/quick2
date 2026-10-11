import store from '../store'; 
import { createRouter, createWebHashHistory } from "vue-router";
import EtrendTransaction from "@/components/EtrendTransaction.vue";
import InvestmentPage from "../components/InvestmentPage.vue";  // Fix: use relative path
import Signup from "../components/Signup.vue"; 
import Education from "../components/Education.vue"; 
import AddScheme from "../components/AddScheme.vue";               // Fix: use relative path
import Terms from '@/components/Terms.vue';
import EtrendSendTo from "@/components/EtrendSendTo.vue";
import Chat from '@/components/Chat.vue';
import AboutPage from "../components/AboutPage.vue";   
import FundAccount from "@/components/FundAccount.vue";
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
import Services from "../components/Services.vue";
import CreateAccount from "../components/CreateAccount.vue";
import SchemeOfWork from "../components/SchemeOfWork.vue";
import Teacher from "../components/Teacher.vue";
// Define the routes
const routes = [
  { path: "/forgot-password", component: ForgotPassword },  
  { path: "/reset-password/:token", component: ResetPassword },
  { path: "/verify", component: VerifyLog },
  {path: "/scheme-of-work",name: "SchemeOfWork",component: SchemeOfWork},
  {path: "/adminlogin", component: AdminLogin},
  {path: "/add-scheme", name: "AddScheme",component: AddScheme},
  { path: "/about", component: AboutPage },
  { path: "/advice", component: InvestmentAdvice },
  {path: "/teacher",name: "Teacher",component: Teacher},
  { path: "/chat", component: Chat },
  {path: "/education",name: "Education",component: Education},
  { path: "/terms", component: Terms},
  { path: "/investment", component: InvestmentPage },
  { path: "/", component: Signup },
  { path: "/login", component: Login },
  { path: "/summary", component: SummaryPage },
  { path: "/timeframe", component: Timeframe },
  { path: "/bannercarousel", component: BannerCarousel },
  { path: "/trend", component: TrendGraph },
  { path: "/trend/:categoryId", component: TrendPage },
  { path: '/payment-success', component: PaymentSuccess }, // Add this route
  { path: '/transaction/:userId', component: TransactionPage },
  { path: "/summary", name: "SummaryPage", component: SummaryPage },
  { path: "/services", component: Services },
  { path: "/create-account", component: CreateAccount },
  {path: "/fund-account", component: FundAccount},
  {path: "/etrend-send-to",component: EtrendSendTo},
  {path: "/etrend-transactions", component: EtrendTransaction},
  { path: '/profile/:userId', component: ProfilePage },
  {
  path: "/adminchat",
  name: "AdminChat",
  component: AdminChat,

  beforeEnter: () => {

    const adminLoggedIn =
      localStorage.getItem("adminLoggedIn");

    if (adminLoggedIn !== "true") {

      return "/adminlogin";

    }

    return true;

  },

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
