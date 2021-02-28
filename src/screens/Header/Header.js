import React from "react";
import "./Header.css";

export default class Header extends React.Component {
  toggle_theme() {
    var checkbox = document.querySelector("input[name=theme]");

    checkbox.addEventListener("change", function () {
      if (this.checked) {
        trans();
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        trans();
        document.documentElement.setAttribute("data-theme", "light");
      }
    });

    let trans = () => {
      document.documentElement.classList.add("transition");
      window.setTimeout(() => {
        document.documentElement.classList.remove("transition");
      }, 1000);
    };
  }
  render() {
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
            <div className="toggle-container nav-link">
              <input
                type="checkbox"
                id="switch"
                name="theme"
                onClick={this.toggle_theme}
              />
              <label className="label" htmlFor="switch">
                Toggle
              </label>
            </div>
          </div>
          <a href="#contact" className="nav-btn">
            Hire me!
          </a>
        </nav>
      </header>
    );
  }
}
