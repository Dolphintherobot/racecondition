import { Link } from "react-router-dom";
import './App.css';

function Landing() {
  return (
    <div className="landing-container">
      <div className="hero-card">
        <div className="hero-content">
          <h1 className="hero-title animate-pop-in">
            <span className="gradient-text">Knock Knock</span>
          </h1>
          <h2 className="hero-subtitle animate-pop-in" style={{ animationDelay: '0.3s' }}>
            Who's there?
          </h2>
          <div className="code-container animate-pop-in" style={{ animationDelay: '0.6s' }}>
            <span className="code-bracket">{'{'}</span>
            <span className="code-keyword">RaceCondition</span>
            <span className="code-bracket">{'}'}</span>
          </div>
          <div className="hero-text animate-pop-in" style={{ animationDelay: '0.9s' }}>
            <p>A collaborative platform for developers to</p>
            <p>solve programming challenges together</p>
          </div>
          <div className="cta-buttons animate-pop-in" style={{ animationDelay: '1.2s' }}>
            <Link to="/Login" className="btn btn-glow">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
