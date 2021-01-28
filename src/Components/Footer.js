import React from "react";
import "./Footer.scss";

export default function Footer() {
  return (
    <div className="footer">
      <div className="footer-wrap">
        <div className="footer-link-wrap">
          <div className="col">
            <div className="brand-name">Mehfooz-ur-Rehman</div>
            <form action="">
              <label className="label" htmlFor="subscribe">
                Subscribe for Newsletter
              </label>
              <div className="row" style={{ padding: "1em 0em" }}>
                <input
                  type="text"
                  placeholder="Email Address"
                  className="input"
                />
                <button className="btn-filled submit">i</button>
              </div>
            </form>
          </div>
          <div className="col">
            <div className="footer-links-heading">Services</div>
            <a href="#" className="nav-link">
              Web Design
            </a>
            <a href="#" className="nav-link">
              Web Development
            </a>
            <a href="#" className="nav-link">
              Mobile App Desegn
            </a>
            <a href="#" className="nav-link">
              Mobile App Development
            </a>
            <a href="#" className="nav-link">
              Desktop App Desegn
            </a>
            <a href="#" className="nav-link">
              Desktop App Development
            </a>
          </div>
          <div className="col">
            <div className="footer-links-heading">Support</div>
            <a href="#" className="nav-link">
              Get Support
            </a>
            <a href="#" className="nav-link">
              Contact
            </a>
            <a href="#" className="nav-link">
              Mobile App Desegn
            </a>
            <a href="#" className="nav-link">
              My Blog
            </a>
            <a href="#" className="nav-link">
              Privacy Policy
            </a>
            <a href="#" className="nav-link">
              Pricing
            </a>
          </div>
          <div className="col">
            <div className="footer-links-heading">Follow Me</div>
            <a href="#" className="nav-link">
              i
            </a>
            <a href="#" className="nav-link">
              i
            </a>
            <a href="#" className="nav-link">
              i
            </a>
            <a href="#" className="nav-link">
              i
            </a>
            <a href="#" className="nav-link">
              i
            </a>
          </div>
        </div>
        <div className="footer-contact-wrap">
          <div className="row">
            <div className="contact-icon">i</div>
            <div className="col">
              <div className="cat">Phone</div>
              <div className="details">+923357291419</div>
            </div>
          </div>
          <div className="row">
            <div className="contact-icon">i</div>
            <div className="col">
              <div className="cat">Phone</div>
              <div className="details">+923357291419</div>
            </div>
          </div>
          <div className="row">
            <div className="contact-icon">i</div>
            <div className="col">
              <div className="cat">Phone</div>
              <div className="details">+923357291419</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
