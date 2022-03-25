import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle } from 'react-feather';

export default function TestimonialFormSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setSuccess(false);
    }, 1000);
  }, [success]);

  function handleSubmit(e) {
    e.preventDefault();
    axios
      .post(
        `${
          import.meta.env.PROD
            ? 'https://mehfooz-ur-rehman.herokuapp.com/'
            : 'http://localhost:9000/'
        }api/v1/set_testimonial`,
        {
          name: name,
          email: email,
          designation: designation,
          message: message,
        }
      )
      .then(() => {
        setName('');
        setEmail('');
        setDesignation('');
        setMessage('');
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch((err) => {
        console.log('testimonial error:' + err);
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
      <div className="screen__header">
        <div className="screen__header__left">
          <div className="screen__header__name">
            Send me your valuable comments
          </div>
          <div className="screen__header__breadcrum">
            <div className="screen__header__breadcrum__bar"></div> Home / Write
            Testimonials
          </div>
        </div>
        <div className="screen__header__left__right"></div>
      </div>
      <div className="contact__section">
        <form
          onSubmit={handleSubmit}
          className="contact__section__right"
          style={{ width: '100%' }}
        >
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
          <div className="contact__section__right__label">Designation</div>
          <input
            type="text"
            placeholder="Designation"
            className="contact__section__right__input__box"
            value={designation}
            onChange={(e) => {
              setDesignation(e.target.value);
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
