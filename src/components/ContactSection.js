import React from "react";
import {
  Facebook,
  GitHub,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
} from "react-feather";

export default function ContactSection() {
  return (
    <div className="contact__section">
      <div className="contact__section__left">
        <div className="contact__section__left__sub__heading">
          <div className="contact__section__left__sub__heading__bar"></div>
          Contact Me
        </div>
        <div className="contact__section__left__heading">Contact With Me</div>
        <div className="contact__section__left__info">
          Let's build you simple, beautiful and intuitive solutions
        </div>
        <div className="contact__section__left__link">
          <div className="contact__section__left__link__icon">
            <MapPin size={20} color="currentColor" />
          </div>
          <span>Samundri - Faisalabad - Pakistan</span>
        </div>
        <div className="contact__section__left__link">
          <div className="contact__section__left__link__icon">
            <Mail size={20} color="currentColor" />
          </div>
          <span>mehfoozijaz786@gmail.com</span>
        </div>
        <div className="contact__section__left__link">
          <div className="contact__section__left__link__icon">
            <Phone size={20} color="currentColor" />
          </div>
          <span>+92 313 7178074</span>
        </div>
        <div className="contact__section__left__socials">
          <a
            href="https://github.com/MehfoozurRehman"
            className="contact__section__left__socials__link"
          >
            <GitHub size={20} color="currentColor" />
          </a>
          <a
            href="https://web.facebook.com/MehfoozurRehmanIjaz/"
            className="contact__section__left__socials__link"
          >
            <Facebook size={20} color="currentColor" />
          </a>
          <a
            href="https://www.instagram.com/mehfoozurrehman___/"
            className="contact__section__left__socials__link"
          >
            <Instagram size={20} color="currentColor" />
          </a>
          <a
            href="https://www.linkedin.com/in/mehfooz-rehman-37a1b0231/"
            className="contact__section__left__socials__link"
          >
            <Linkedin size={20} color="currentColor" />
          </a>
        </div>
      </div>
      <form className="contact__section__right">
        <div className="contact__section__right__label">Name</div>
        <input
          type="text"
          placeholder="Name"
          className="contact__section__right__input__box"
        />
        <div className="contact__section__right__label">Email Address</div>
        <input
          type="text"
          placeholder="Email Address"
          className="contact__section__right__input__box"
        />
        <div className="contact__section__right__label">Subject</div>
        <input
          type="text"
          placeholder="Subject"
          className="contact__section__right__input__box"
        />
        <div className="contact__section__right__label">Message</div>
        <textarea
          placeholder="Message"
          rows="10"
          className="contact__section__right__input__area"
        />
        <button className="contact__section__right__btn">Send</button>
      </form>
    </div>
  );
}
