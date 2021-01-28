import React from "react";
import "./Header.scss";

export default function Header() {
  return (
    <div className="header">
      <div className="navbar">
        <a href="index.html" className="brand-name">
          Mehfooz-ur-Rehman
        </a>
        <div className="nav">
          <a href="index.html" className="nav-link">
            Home
          </a>
          <a href="#services" className="nav-link">
            Services
          </a>
          <a href="#story" className="nav-link">
            My Story
          </a>
          <a href="#work" className="nav-link">
            My Work
          </a>
          <a href="#portfolio" className="nav-link">
            Portfolio
          </a>
          <a href="#reviwes" className="nav-link">
            Reviwes
          </a>
        </div>
        <button className="btn-outline cta">Contact</button>
      </div>
    </div>
  );
}
