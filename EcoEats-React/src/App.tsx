import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";

// Temporary page components
function HomePage() {
  return <h1>Welcome to EcoEats!</h1>;
}

function LoginPage() {
  return <h1>Login Page</h1>;
}

function BrowsePage() {
  return <h1>Browse Food Items</h1>;
}

function InventoryPage() {
  return <h1>Inventory Management</h1>;
}

function App() {
  return (
    <>
      <Navbar /> {/* 👈 Should always show */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/inventory" element={<InventoryPage />} />
      </Routes>
    </>
  );
}

export default App;
