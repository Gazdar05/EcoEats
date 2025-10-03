import { NavLink } from "react-router-dom";
import "./Navbar.css";
import profileImg from "./profile.jpg";
import Logo from "./logo2.png";

function Navbar() {
  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <img src={Logo} alt="EcoEats Logo" className="navbar-logo-img" />
        <span className="navbar-logo-text">EcoEats</span>
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
          <NavLink to="/donations">Donations</NavLink>
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

{/* Login & Sign Up */}
      {/* Login & Sign Up */}
      <div className="navbar-right">
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
        <img src={profileImg} alt="Profile" className="navbar-profile" />
      </div>
    </nav>
  );
}

export default Navbar;
