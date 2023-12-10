export default function Contact() {
  return (
    <section id="contact" className="contact">
      <div className="contact__heading">Get in touch</div>
      <div className="contact__info">
        I will be happy to work with you. Feel free to contact me.
      </div>
      <div className="contact__content">
        <div className="contact__content__left">
          <div className="contact__content__left__entry">
            <div className="contact__content__left__entry__icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="contact__content__left__entry__text">
              Samundri, Faisalabad, Punjab, Pakistan
            </div>
          </div>
          <div className="contact__content__left__entry">
            <div className="contact__content__left__entry__icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div className="contact__content__left__entry__text">
              +92 313 7178074
            </div>
          </div>
          <div className="contact__content__left__entry">
            <div className="contact__content__left__entry__icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div className="contact__content__left__entry__text">
              mehfoozijaz786@gmail.com
            </div>
          </div>
        </div>
        <div className="contact__content__right">
          <div className="contact__content__right__heading">
            Send me a message
          </div>
          <div className="contact__content__right__input">
            <label htmlFor="" className="contact__content__right__input__label">
              Name
            </label>
            <input
              type="text"
              placeholder="Name"
              className="contact__content__right__input__field"
            />
          </div>
          <div className="contact__content__right__input">
            <label htmlFor="" className="contact__content__right__input__label">
              Email
            </label>
            <input
              type="email"
              placeholder="Email"
              className="contact__content__right__input__field"
            />
          </div>
          <div className="contact__content__right__input">
            <label htmlFor="" className="contact__content__right__input__label">
              Subject
            </label>
            <input
              type="text"
              placeholder="Subject"
              className="contact__content__right__input__field"
            />
          </div>
          <div className="contact__content__right__input">
            <label htmlFor="" className="contact__content__right__input__label">
              Message
            </label>
            <textarea
              placeholder="Message"
              className="contact__content__right__input__textarea"
            />
          </div>
          <button className="contact__content__right__button">
            Send Message
          </button>
        </div>
      </div>
    </section>
  );
}
