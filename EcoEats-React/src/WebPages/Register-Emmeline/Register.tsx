import React, { useState, FormEvent } from "react";
import "./Login.css";

const LoginRegister: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      console.log("Logging in...");
    } else {
      console.log("Registering new user...");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="brand">EcoEats</h1>
        <h2>{isLogin ? "Login" : "Register"}</h2>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <input type="text" placeholder="Full Name" className="input-field" />
          )}

          <input type="email" placeholder="Email" className="input-field" />
          <input type="password" placeholder="Password" className="input-field" />

          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              className="input-field"
            />
          )}

          <button type="submit" className="auth-btn">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="toggle-text">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Register" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginRegister;
