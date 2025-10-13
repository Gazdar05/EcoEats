import React from 'react';
import './homepage.css';

const HomePage: React.FC = () => {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to EcoEats</h1>
          <p className="hero-subtitle">Reduce waste, save money, help the planet</p>
          <p className="hero-description">
            Your smart companion for managing food inventory, reducing waste, and making sustainable choices
          </p>
          <div className="hero-buttons">
            <a href="/register" className="btn-primary">Get Started</a>
            <a href="#about" className="btn-secondary">Learn More</a>
          </div>
        </div>
        <div className="hero-image">
          <div className="floating-icon icon-1">🥗</div>
          <div className="floating-icon icon-2">🌱</div>
          <div className="floating-icon icon-3">♻️</div>
          <div className="floating-icon icon-4">🍎</div>
        </div>
      </section>


      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="about-container">
          <div className="about-content">
            <h2 className="section-title">About EcoEats</h2>
            <p className="about-intro">
              EcoEats is more than just a food management app – it's a movement towards sustainable living 
              and conscious consumption.
            </p>
            
            <div className="about-details">
              <div className="about-block">
                <h3>Our Mission</h3>
                <p>
                  To empower households worldwide to reduce food waste, save money, and contribute to 
                  a healthier planet through smart food management and conscious consumption habits.
                </p>
              </div>

              <div className="about-block">
                <h3>Our Vision</h3>
                <p>
                  A world where food waste is minimized, every household makes informed decisions about 
                  their consumption, and sustainable living becomes the norm rather than the exception.
                </p>
              </div>

              <div className="about-block">
                <h3>What We Do</h3>
                <p>
                  EcoEats helps you track your food inventory, plan meals efficiently, and make the most 
                  of what you have. Our intelligent system alerts you before food expires, suggests recipes 
                  based on available ingredients, and tracks your waste reduction progress.
                </p>
              </div>

              
            </div>
          </div>

          </div>
      </section>

      

      
    </div>
  );
};

export default HomePage;