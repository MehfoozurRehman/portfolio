import React from "react";
import "./Contact.css";

export default class Contact extends React.Component {
  render() {
    return (
      <section className="section" id="contact">
        <div className="section-header">
          <div className="section-heading">Contact Me</div>
          <div className="section-about">Send Me a Message</div>
        </div>
        <div className="section-content">
          <form className="contact-form">
            <div className="form-row">
              <div className="input-box">
                <label htmlFor="user-name" className="input-label">
                  Name
                </label>
                <input type="text" className="input-field" />
              </div>
              <div className="input-box">
                <label htmlFor="email-name" className="input-label">
                  Email
                </label>
                <input type="email" className="input-field" />
              </div>
              <div className="input-box">
                <label htmlFor="user-name" className="input-label">
                  Phone#
                </label>
                <input type="phone" className="input-field" />
              </div>
              <div className="input-box">
                <label htmlFor="email-name" className="input-label">
                  Budjet
                </label>
                <input type="email" className="input-field" />
              </div>
              <div className="input-box">
                <label htmlFor="email-name" className="input-label">
                  Message
                </label>
                <textarea
                  className="input-field"
                  cols="30"
                  rows="10"
                ></textarea>
              </div>
            </div>
            <input type="button" value="Send Message" className="input-btn" />
          </form>
        </div>
      </section>
    );
  }
}
