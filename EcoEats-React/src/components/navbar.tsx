import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";
import profileImg from "./profile.jpg";
import Logo from "./logo3.png";

function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const checkAuthStatus = () => {
      const token = localStorage.getItem("token");
      const storedUserName = localStorage.getItem("userName");
      
      if (token) {
        setIsLoggedIn(true);
        setUserName(storedUserName || "User");
      } else {
        setIsLoggedIn(false);
        setUserName("");
      }
    };

    checkAuthStatus();

    // Listen for storage changes (login/logout events)
    window.addEventListener('storage', checkAuthStatus);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  const handleLogout = () => {
    // Clear all user data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    
    // Update state
    setIsLoggedIn(false);
    setUserName("");
    
    // Redirect to login page
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <img src={Logo} alt="EcoEats Logo" className="navbar-logo-img" />
      </div>

      {/* Navigation links */}
      <ul className="navbar-links">
        <li>
          <NavLink to="/" end>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/inventory">Inventory</NavLink>
        </li>
        <li>
          <NavLink to="/browse">Browse</NavLink>
        </li>
        <li>
          <NavLink to="/meals">Meals</NavLink>
        </li>
        <li>
          <NavLink to="/notifications">Notifications</NavLink>
        </li>
        <li>
          <NavLink to="/profile">Profile</NavLink>
        </li>
        <li>
          <NavLink to="/analytics">Analytics</NavLink>
        </li>
      </ul>

      {/* Login & Sign Up / Logout */}
      <div className="navbar-right">
        {isLoggedIn ? (
          <>
            <span className="navbar-username">Hi, {userName}</span>
            <button
              onClick={handleLogout}
              className="navbar-btn logout-btn"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `navbar-btn ${isActive ? "active-btn" : ""}`
              }
            >
              Login
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) =>
                `navbar-btn signup-btn ${isActive ? "active-btn" : ""}`
              }
            >
              Sign Up
            </NavLink>
          </>
        )}
        <img src={profileImg} alt="Profile" className="navbar-profile" />
      </div>
    </nav>
  );
}

export default Navbar;