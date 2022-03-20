import React from "react";
import { Link } from "react-router-dom";
import { pic } from "../assets";

export default function AboutSection() {
  return (
    <section className="about__section" id="about__section">
      <div className="about__section__left">
        <div className="services__section__right__sub__heading">
          <div className="services__section__right__sub__heading__bar"></div>
          About Us
        </div>
        <div className="services__section__right__heading">
          <span>Hey, Im here</span>
          <span>to help your next project</span>
        </div>
        <div
          className="services__section__right__info"
          style={{ marginBottom: "1em" }}
        >
          I'm a Web Developer and UI/UX Designer from Samundri, Pakistan,
          working in web development. I enjoy turning complex problems into
          simple, beautiful and intuitive solutions.
        </div>
        <div className="services__section__right__info">
          My job is to build functional and user-friendly and at the same time
          attractive websites for you. Moreover, I add a personal touch to your
          product and make sure that it is eye-catching and easy to use. My aim
          is to bring across your message and identity in the most creative way.
        </div>
        <div className="home__section__left__buttons" style={{ marginTop: 40 }}>
          <Link
            to="/portfolio"
            onClick={() => {
              document.getElementById("portfolio").checked = true;
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            className="home__section__left__buttons__primary"
          >
            My Portfolio
          </Link>
          <a
            href="https://docs.google.com/document/d/1Z3e-5Ti2Zw9aol5RH5BUoiL8AC7HROHHQQkfvX6MQbQ/edit?usp=sharing"
            className="home__section__left__buttons__secondary"
          >
            Download CV
          </a>
        </div>
      </div>
      <div className="about__section__right">
        <div className="about__section__right__box">
          <img
            src="https://scontent.flhe7-1.fna.fbcdn.net/v/t39.30808-6/268797386_2713631368941015_3386990957194230084_n.jpg?_nc_cat=111&ccb=1-5&_nc_sid=e3f864&_nc_eui2=AeEtp0F0DheoJxsWBQFdsJH1prZUiQGoaP-mtlSJAaho_x-kCZNlCC6OHsvy8kdgA9myBuojeBv6arO8H7pgDDNM&_nc_ohc=kTrnRBy_x4wAX_YG5hS&_nc_ht=scontent.flhe7-1.fna&oh=00_AT-2jms_zFgQ3HkvwPqB1tXrcAaa3yBgMFRlQhkuBuQDPQ&oe=623BE4D0"
            alt="pic"
            className="about__section__right__box__img"
          />
        </div>
        <div className="about__section__right__box">
          <img
            src="https://scontent.flhe7-1.fna.fbcdn.net/v/t39.30808-6/269254259_2713629602274525_2480075525282422773_n.jpg?_nc_cat=108&ccb=1-5&_nc_sid=19026a&_nc_eui2=AeE2CcauD7qz5ZEoc24kfg7RGR32PmqEdO8ZHfY-aoR07-VEUEdnd-mIzEVDE0-z4zQ_osj36SGCCmmQgGxNAlNu&_nc_ohc=ayU4XoaKDmcAX8bA_z0&_nc_ht=scontent.flhe7-1.fna&oh=00_AT-4wZmcXiteEA28GuC5rPI8qEFk64zeqWXHpRS5QKh-Zg&oe=623C3211"
            alt="pic"
            className="about__section__right__box__img"
          />
        </div>
        <div className="about__section__right__box">
          <img
            src="https://scontent.flhe7-2.fna.fbcdn.net/v/t1.6435-9/36652474_1853178834986277_334298457361612800_n.jpg?_nc_cat=103&ccb=1-5&_nc_sid=730e14&_nc_eui2=AeFNhO9vJFsHbRPMeP2rN7Tw4TpsD7rw8hThOmwPuvDyFEcjwzI-YsogkrYOHl32ba-G4rdNjG80-ILNp6yMvoNx&_nc_ohc=SHFEEavY7hUAX9Nap9-&_nc_ht=scontent.flhe7-2.fna&oh=00_AT-zrxfZQvok_9twx4nH9YFI4nZqnmdqxSGkvxMgMttH3Q&oe=625D3396"
            alt="pic"
            className="about__section__right__box__img"
          />
        </div>
        <div className="about__section__right__box">
          <img
            src="https://scontent.flhe7-2.fna.fbcdn.net/v/t1.6435-9/36895766_1858282574475903_3559164176137977856_n.jpg?_nc_cat=109&ccb=1-5&_nc_sid=19026a&_nc_eui2=AeEtZt6Hr4AseM-g_9g9F7ZJYwFa1ACKuc5jAVrUAIq5zpNJPZ8X15c9-kOc-zd4wCAuY7YndpQNfzCiywxIe1dr&_nc_ohc=a0wdEqh7t4oAX-SNZlx&_nc_ht=scontent.flhe7-2.fna&oh=00_AT-wsZ03hFPIM1YgiTo27Tq1PPqGxPuwwe6QxOf6ZGJw3g&oe=625EA7E9"
            alt="pic"
            className="about__section__right__box__img"
          />
        </div>
        <div className="about__section__right__box">
          <img
            src="https://scontent.flhe7-1.fna.fbcdn.net/v/t1.6435-9/84111559_2217934178510739_6426804021658386432_n.jpg?_nc_cat=102&ccb=1-5&_nc_sid=19026a&_nc_eui2=AeH0DMZqW4Yuf8JSdjRDEjvMZwSFMkH7WxJnBIUyQftbElFjzjIV85YzO3CqRmagQop2DtwZivyaKvhrjRIo4KAX&_nc_ohc=pQE6C0P3SwsAX8rQt-X&_nc_ht=scontent.flhe7-1.fna&oh=00_AT8syU9hhF_8N1wKygzDkxM2kidfGbpldsGfNHbmxpmKAA&oe=625B762D"
            alt="pic"
            className="about__section__right__box__img"
          />
        </div>
        <div className="about__section__right__box">
          <img
            src="https://scontent.flhe7-2.fna.fbcdn.net/v/t1.6435-9/36743652_1853177414986419_6191639233464107008_n.jpg?_nc_cat=100&ccb=1-5&_nc_sid=730e14&_nc_eui2=AeFSWZoZJLzlt9Y1DwX3oQBIOJLD5EE5Sug4ksPkQTlK6OSLWvPuOKzF8No3vx_a7IoqQsG13cn7FJhNEn0S8EtE&_nc_ohc=A9NC7mrYSvcAX-QldVa&_nc_ht=scontent.flhe7-2.fna&oh=00_AT-PiNtdhg6UiIoGyZfyv4O6JxLlJC7ntfmZDisVTQC_cQ&oe=625C8DC1"
            alt="pic"
            className="about__section__right__box__img"
          />
        </div>
      </div>
    </section>
  );
}
