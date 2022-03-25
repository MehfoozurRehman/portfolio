import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CheckCircle,
  Facebook,
  GitHub,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
} from 'react-feather';

export default function ContactSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setSuccess(false);
    }, 1000);
  }, [success]);

  function handleSubmit(e) {
    e.preventDefault();
    // axios
    //   .post("http://localhost:9000/api/v1/set_project", {
    //     name: "Aida Pro",
    //     languages: ["Html", "CSS", "Js", "React"],
    //     image: "AidaPro",
    //     description:
    //       "Lorem ipsum dolor sit amet consectetur adipisicing elit. Vero praesentium nemo harum dignissimos illum voluptas sapiente quia libero laboriosam iusto.",
    //     category: "Web App",
    //     date: Date.now(),
    //     client: "DSME Global",
    //     url: "https://aida-pro.web.app/",
    //   })
    //   .then(() => {
    //     setName("");
    //     setEmail("");
    //     setSubject("");
    //     setMessage("");
    //     setSuccess(true);
    //     window.scrollTo({ top: 0, behavior: "smooth" });
    //   })
    //   .catch((err) => {
    //     console.log("contact error:" + err);
    //   });
    // const fdImage = new FormData();
    // fdImage.append("image", image);
    // fdImage.append("name", "AidaPro");
    // axios
    //   .post("http://localhost:9000/api/v1/upload", fdImage, {
    //     headers: {
    //       "Content-Type": "multipart/form-data",
    //     },
    //   })
    //   .then(() => {
    //     console.log(image);
    //   })
    //   .catch((err) => {
    //     console.log("image error:" + err);
    //   });

    axios
      .post(
        `${
          import.meta.env.PROD
            ? 'https://mehfooz-ur-rehman.herokuapp.com/'
            : 'http://localhost:9000/'
        }api/v1/set_contact`,
        {
          name: name,
          email: email,
          subject: subject,
          message: message,
        }
      )
      .then(() => {
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch((err) => {
        console.log('contact error:' + err);
      });
  }
  return (
    <>
      {success ? (
        <div className="screen__popup">
          <div className="screen__popup__content">
            <CheckCircle size={50} color="currentColor" />
            <div className="screen__popup__content__heading">
              Successfully Sent
            </div>
          </div>
        </div>
      ) : null}
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
        <form onSubmit={handleSubmit} className="contact__section__right">
          <div className="contact__section__right__label">Name</div>
          <input
            type="text"
            placeholder="Name"
            className="contact__section__right__input__box"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            required
          />
          <div className="contact__section__right__label">Email Address</div>
          <input
            type="text"
            placeholder="Email Address"
            className="contact__section__right__input__box"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            required
          />
          <div className="contact__section__right__label">Subject</div>
          <input
            type="text"
            placeholder="Subject"
            className="contact__section__right__input__box"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
            }}
            required
          />

          <div className="contact__section__right__label">Message</div>
          <textarea
            placeholder="Message"
            rows="10"
            className="contact__section__right__input__area"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            required
          />
          <button title="Send" className="contact__section__right__btn">
            Send
          </button>
        </form>
      </div>
    </>
  );
}
