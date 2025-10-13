import { Routes, Route, useLocation } from "react-router-dom"; // 👈 import useLocation
import Navbar from "./components/navbar";
import Footer from "./components/footer";

// ✅ Import your real feature page
import BrowseFood from "./WebPages/BrowseFood-Zayyan/BrowsePage";

// Temporary page components
function HomePage() {
  return <h1>Welcome to EcoEats!</h1>;
}
function LoginPage() {
  return <h1>Login Page</h1>;
}
function RegisterPage() {
  return <h1>Sign Up Page</h1>;
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
function ProfilePage() {
  return <h1>User Profile</h1>;
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
  const location = useLocation(); // 👈 get location

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ✅ Use your actual feature here */}
        <Route path="/browse" element={<BrowseFood />} />

        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/meals" element={<MealsPage />} />
        <Route path="/donations" element={<DonationPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>

      {/* ✅ Only show footer when NOT on /browse */}
      {location.pathname !== "/browse" && <Footer />}
    </>
  );
}

export default App;
