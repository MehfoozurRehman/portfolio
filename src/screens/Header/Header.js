import React from "react";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <a href="index.html" className="brand-name">
        Port <span>folio</span>
      </a>
      <div className="nav-mobile-btn">i</div>
      <nav className="nav">
        <div className="nav-links">
          <a href="index.html" className="nav-link">
            Home
          </a>
          <a href="#about" className="nav-link">
            About Us
          </a>
          <a href="#portfolio" className="nav-link">
            Portfolio
          </a>
          <a href="#blog" className="nav-link">
            Blog
          </a>
          <a href="#contact" className="nav-link">
            Contact Us
          </a>
        </div>
        <a href="#contact" className="nav-btn">
          Hire me!
        </a>
      </nav>
    </header>
  );
}
