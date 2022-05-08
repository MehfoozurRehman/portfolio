import React, { useState } from "react";
import { Mail, MapPin, Phone } from "react-feather";
import Input from "./Input";
import Textarea from "./Textarea";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  function handleSubmit(e) {
    e.preventDefault();
    console.log({
      name,
      email,
      subject,
      message,
    });
  }
  return (
    <div className="contact__section__wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
        <path
          fillOpacity="1"
          d="M0,0L48,26.7C96,53,192,107,288,138.7C384,171,480,181,576,160C672,139,768,85,864,74.7C960,64,1056,96,1152,112C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
      <div id="contact__section" className="contact__section">
        <div className="contact__section__header">
          <div className="contact__section__header__sub__heading">
            Get in touch
          </div>
          <div className="contact__section__header__heading">Contact</div>
        </div>
        <div className="contact__section__content">
          <form
            onSubmit={handleSubmit}
            className="contact__section__content__left"
          >
            <div className="contact__section__content__left__heading">
              Drop me a line
            </div>
            <Input
              label="Your name"
              type="text"
              name="name"
              onChange={setName}
            />
            <Input
              label="Your email"
              type="email"
              name="email"
              onChange={setEmail}
            />
            <Input
              label="Subject"
              type="text"
              name="subject"
              onChange={setSubject}
            />
            <Textarea
              label="Your message"
              name="message"
              onChange={setMessage}
            />
            <button className="contact__section__content__left__button">
              Send Message
            </button>
          </form>
          <div className="contact__section__content__right">
            <div className="contact__section__content__right__entry">
              <div className="contact__section__content__right__entry__icon">
                <MapPin size={25} color="currentColor" strokeWidth={1.5} />
              </div>
              <div className="contact__section__content__right__entry__content">
                <div className="contact__section__content__right__entry__content__entry">
                  Samundri, Faisalabad, Punjab, Pakistan
                </div>
                <div className="contact__section__content__right__entry__content__entry"></div>
              </div>
            </div>
            <div className="contact__section__content__right__entry">
              <div className="contact__section__content__right__entry__icon">
                <Phone size={25} color="currentColor" strokeWidth={1.5} />
              </div>
              <div className="contact__section__content__right__entry__content">
                <div className="contact__section__content__right__entry__content__entry">
                  +92 313 7178074
                </div>
                <div className="contact__section__content__right__entry__content__entry">
                  +92 335 7291419
                </div>
              </div>
            </div>
            <div className="contact__section__content__right__entry">
              <div className="contact__section__content__right__entry__icon">
                <Mail size={25} color="currentColor" strokeWidth={1.5} />
              </div>
              <div className="contact__section__content__right__entry__content">
                <div className="contact__section__content__right__entry__content__entry">
                  mehfoozijaz786@gmail.com
                </div>
                <div className="contact__section__content__right__entry__content__entry">
                  mehfooz_ur_rehman@outlook.com
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
