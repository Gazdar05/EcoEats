import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Navbar from "./components/navbar";
import Footer from "./components/footer";
import ProtectedRoute from "./components/ProtectedRoute";

// Feature pages
import FoodInventory from "./WebPages/FoodInventory-Mamoudou/FoodInventory";
import Register from "./WebPages/Register-Emmeline/Register";
import LoginPage from "./WebPages/Register-Emmeline/Login";
import VerifyAccountPage from "./WebPages/Register-Emmeline/VerifyAccount";
import ProfilePage from "./WebPages/Register-Emmeline/ProfilePage";
import HomePage from "./WebPages/Register-Emmeline/HomePage";
import BrowseFood from "./WebPages/BrowseFood-Zayyan/BrowsePage";

import FoodAnalytics from "./WebPages/Analytics-Emmeline/FoodAnalytics";
import PlanWeeklyMeals from "./WebPages/PlanWeeklyMeals/PlanWeeklyMeals";

import Notifications from "./WebPages/Notification-Mamoudou/Notifications";

// Temporary placeholder pages
function DonationPage() {
  return <h1>User Donations</h1>;
}

function SupportPage() {
  return <h1>Support Page</h1>;
}

function AboutPage() {
  return <h1>About EcoEats</h1>;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide navbar only on /inventory and /food-inventory
  const hideNavbar =
    location.pathname === "/inventory" ||
    location.pathname === "/food-inventory";

  // Hide footer on /inventory, /food-inventory and /browse
  const hideFooter =
    location.pathname === "/inventory" ||
    location.pathname === "/food-inventory" ||
    location.pathname === "/browse";

  useEffect(() => {
    // Auto logout after 15 minutes of inactivity
    const timeoutDuration = 15 * 60 * 1000;
    let logoutTimer: NodeJS.Timeout;

    const resetTimer = () => {
      const excludedPaths = ["/login", "/register"];
      if (excludedPaths.includes(window.location.pathname)) return;

      clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        const token = localStorage.getItem("token");
        if (token) {
          localStorage.clear();
          alert("You have been logged out due to inactivity.");
          navigate("/login");
        }
      }, timeoutDuration);
    };

    const activityEvents = ["mousemove", "keydown", "click", "scroll"];
    activityEvents.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );
    resetTimer();

    return () => {
      clearTimeout(logoutTimer);
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [navigate]);

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-account" element={<VerifyAccountPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/support" element={<SupportPage />} />

        {/* Protected Routes */}
        <Route
          path="/browse"
          element={
            <ProtectedRoute>
              <BrowseFood />
            </ProtectedRoute>
          }
        />

        {/* Food Inventory */}
        <Route
          path="/food-inventory"
          element={
            <ProtectedRoute>
              <FoodInventory />
            </ProtectedRoute>
          }
        />

        {/* Legacy route support */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <FoodInventory />
            </ProtectedRoute>
          }
        />

        {/* Weekly meals */}
        <Route
          path="/meals"
          element={
            <ProtectedRoute>
              <PlanWeeklyMeals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plan-meals"
          element={
            <ProtectedRoute>
              <PlanWeeklyMeals />
            </ProtectedRoute>
          }
        />

        {/* Donations */}
        <Route
          path="/donations"
          element={
            <ProtectedRoute>
              <DonationPage />
            </ProtectedRoute>
          }
        />

        {/* Real Notifications Page */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Analytics */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <FoodAnalytics />
            </ProtectedRoute>
          }
        />
      </Routes>

      {location.pathname === "/" && !hideFooter && <Footer />}
    </>
  );
}

export default App;
