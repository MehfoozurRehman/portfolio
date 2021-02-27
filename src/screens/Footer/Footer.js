import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <div className="footer">
      <a href="index.html" className="brand-name">
        Port <span>folio</span>
      </a>
      <div className="footer-row">
        <div className="footer-left">
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Illum ipsam
            odio accusantium error at commodi, expedita obcaecati dolor amet
            debitis?
          </p>
        </div>
        <div className="footer-right">
          <div className="footer-right-col">
            <div className="footer-heading">Send Mail</div>
            <div className="footer-content">mehfoozijaz786@gmail.com</div>
            <div className="footer-content">mehfooz_ur_rehman@outlook.com</div>
          </div>
          <div className="footer-right-col">
            <div className="footer-heading">Make Call</div>
            <div className="footer-content">+92 335 7291419</div>
            <div className="footer-content">+92 313 7178074</div>
          </div>
          <div className="footer-right-col">
            <div className="footer-heading">Get In Touch</div>
            <div className="footer-content">123/A,Hamburger City</div>
            <div className="footer-content">Punjab, Pakistan</div>
          </div>
        </div>
      </div>
    </div>
  );
}
