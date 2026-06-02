import dayjs from "dayjs";
import { useState } from "react";
import { useGithubUser } from "../hooks/use-github";
import CVModal from "./cv-modal";

const getExperience = (dateString?: string | number | Date) => {
  if (!dateString) return 0;
  const years = dayjs().diff(dayjs(dateString), "month") / 12;
  return Math.round(years);
};

export default function HomeAbout() {
  const { data } = useGithubUser();
  const [isCVModalOpen, setIsCVModalOpen] = useState(false);

  return (
    <section id="about__section" className="about__section">
      <div className="about__section__left">
        <div className="about__section__left__content">
          <div className="about__section__left__content__blob">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M61.4,-21.8C67.3,-1.8,51.3,23.4,29.1,39.4C6.9,55.4,-21.5,62,-40.9,49.5C-60.4,37,-70.8,5.3,-62.5,-18C-54.1,-41.3,-27.1,-56.3,0.3,-56.4C27.7,-56.5,55.5,-41.8,61.4,-21.8Z"
                transform="translate(100 100)"
              ></path>
            </svg>
            <div className="about__section__left__content__blob__content">
              {getExperience(data?.created_at)} +
              <span>Years of Experience</span>
            </div>
          </div>
          <div className="about__section__left__content__blob">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M44.3,-14.2C52.2,10.1,50,38,34.9,49.2C19.8,60.5,-8.2,55.2,-24.9,41.4C-41.5,27.6,-46.8,5.3,-40.8,-16.4C-34.7,-38.1,-17.4,-59.3,0.4,-59.4C18.1,-59.6,36.3,-38.6,44.3,-14.2Z"
                transform="translate(100 100)"
              ></path>
            </svg>
            <div className="about__section__left__content__blob__content">
              {(data?.public_repos || 0) + (data?.total_private_repos || 0)} +
              <span>Projects Completed</span>
            </div>
          </div>
          <div className="about__section__left__content__blob">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M54.3,-18.6C59.7,-1.2,45.9,21.5,28.1,33.1C10.3,44.7,-11.5,45.3,-32,33C-52.5,20.7,-71.7,-4.4,-66.2,-22.1C-60.6,-39.8,-30.3,-50,-2.9,-49C24.5,-48.1,49,-36,54.3,-18.6Z"
                transform="translate(100 100)"
              ></path>
            </svg>
            <div className="about__section__left__content__blob__content">
              50 +<span>Happy Clients</span>
            </div>
          </div>
          <img
            src="/pic.webp"
            alt={data?.login}
            className="about__section__left__content__img"
          />
        </div>
      </div>
      <div className="about__section__right">
        <div className="home__section__sub__heading">
          Let me introduce myself
        </div>
        <div
          className="home__section__heading"
          style={{
            marginBottom: -20,
          }}
        >
          About me
        </div>
        <div
          className="home__section__info"
          style={{
            marginBottom: 0,
            maxWidth: "unset",
          }}
        >
          I'm a Full Stack Web Developer with 5+ years of experience building
          scalable, user-centric applications. My philosophy is turning complex
          problems into simple, beautiful, and intuitive solutions that users
          actually enjoy.
        </div>
        <div
          className="home__section__info"
          style={{
            marginTop: 20,
            maxWidth: "unset",
          }}
        >
          I specialize in crafting high-performance web applications using React,
          TypeScript, Node.js, and modern frameworks. Whether it's frontend UI,
          backend APIs, or full-stack development, I focus on clean code,
          responsive design, and delivering measurable business value.
        </div>
        <button
          onClick={() => setIsCVModalOpen(true)}
          className="home__section__button"
          title="View CV"
        >
          View My CV
        </button>
        <CVModal isOpen={isCVModalOpen} onClose={() => setIsCVModalOpen(false)} />
      </div>
    </section>
  );
}
