import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Register from "./WebPages/Register-Emmeline/Register";
import LoginPage from "./WebPages/Register-Emmeline/Login";

// Temporary page components
function HomePage() {
  return <h1>Welcome to EcoEats!</h1>;
}


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
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/meals" element={<MealsPage />} />
        <Route path="/donations" element={<DonationPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
