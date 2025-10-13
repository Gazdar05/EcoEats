import { Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Register from "./WebPages/Register-Emmeline/Register";
import LoginPage from "./WebPages/Register-Emmeline/Login";
import VerifyAccountPage from "./WebPages/Register-Emmeline/VerifyAccount";
import ProfilePage from "./WebPages/Register-Emmeline/ProfilePage";
import HomePage from "./WebPages/Register-Emmeline/HomePage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { useEffect } from "react";


// Temporary page components

function BrowsePage() {
  return <h1>Browse Food Items</h1>;
}

function InventoryPage() {
  return <h1>Inventory Management</h1>;
}

function MealsPage() {
  return <h1>Meal Planning</h1>;
}

function DonationPage() {
  return <h1>User Donations</h1>;
}

function NotificationsPage() {
  return <h1>User Notifications</h1>;
}

function AnalyticsPage() {
  return <h1>Track and Record of User</h1>;
}
function SupportPage() {
  return <h1>Support Page</h1>;
}

function AboutPage() {
  return <h1>About EcoEats</h1>;
}

function App() {
  const navigate = useNavigate();
  useEffect(() => {
    // ✅ Auto logout after 15 minutes (15 * 60 * 1000 ms)
    const timeoutDuration = 15 * 60 * 1000; // 15 minutes
    let logoutTimer: NodeJS.Timeout;

    const resetTimer = () => {
       // 🧩 Don't set timer if user is already on login/register
      const excludedPaths = ["/login", "/register"];
      if (excludedPaths.includes(window.location.pathname)) return;
      
      clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        const token = localStorage.getItem("token");
        if (token) {
          // Remove token + user info
          localStorage.clear(); // remove token and all user info
          alert("You have been logged out due to inactivity.");
          navigate("/login");
        }
      }, timeoutDuration);
    };

    // ✅ Reset timer when user interacts
    const activityEvents = ["mousemove", "keydown", "click", "scroll"];
    activityEvents.forEach(event => window.addEventListener(event, resetTimer));

    // Start initial timer
    resetTimer();

    // Cleanup on unmount
    return () => {
      clearTimeout(logoutTimer);
      activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [navigate]);

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes - No login required */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-account" element={<VerifyAccountPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/support" element={<SupportPage />} />

        {/* Protected Routes - Login required */}
        <Route path="/browse" element={
          <ProtectedRoute>
            <BrowsePage />
          </ProtectedRoute>
        } />
        
        <Route path="/inventory" element={
          <ProtectedRoute>
            <InventoryPage />
          </ProtectedRoute>
        } />
        
        <Route path="/meals" element={
          <ProtectedRoute>
            <MealsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/donations" element={
          <ProtectedRoute>
            <DonationPage />
          </ProtectedRoute>
        } />
        
        <Route path="/notifications" element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        <Route path="/analytics" element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        } />
      </Routes>
      <Footer />
    </>
  );
}


export default App;
