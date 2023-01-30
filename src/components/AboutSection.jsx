import { Database, Monitor, Smartphone } from "react-feather";

export default function AboutSection() {
  return (
    <div className="about" id="services">
      <div className="about__left">
        <div className="about__left__entry">
          <div className="about__left__entry__icon">
            <Monitor size={20} color="currentColor" />
          </div>
          <div className="about__left__entry__content">
            <div className="about__left__entry__content__heading">
              Web Development
            </div>
            <div className="about__left__entry__content__info">79 project</div>
          </div>
        </div>
        <div className="about__left__entry">
          <div className="about__left__entry__icon">
            <Smartphone size={20} color="currentColor" />
          </div>
          <div className="about__left__entry__content">
            <div className="about__left__entry__content__heading">
              Mobile Development
            </div>
            <div className="about__left__entry__content__info">79 project</div>
          </div>
        </div>
        <div className="about__left__entry">
          <div className="about__left__entry__icon">
            <Database size={20} color="currentColor" />
          </div>
          <div className="about__left__entry__content">
            <div className="about__left__entry__content__heading">
              Backend Development
            </div>
            <div className="about__left__entry__content__info">79 project</div>
          </div>
        </div>
      </div>
      <div className="about__right">
        <div className="about__right__heading">Let me introduce myself</div>
        <div className="about__right__info">
          I'm a Web Developer based in Pakistan. I enjoy turning complex
          problems into simple, beautiful and intuitive solutions. I like to
          build functional and user-friendly and at the same time attractive
          websites for you. Moreover, I add a personal touch to your product and
          make sure that it is eye-catching and easy to use. My aim is to bring
          across your message and identity in the most creative way.
        </div>
        <div className="about__right__info">
          🦄 Skills: HTML5, CSS3, JavaScript, Bootstrap, ReactJS, MongoDB,
          ExpressJS, NodeJS, Typescript, Graphql, Rest
        </div>
        <div className="about__right__info">
          💼 Tools: Visual Studio Code, Android Studio, GitHub Desktop, Windows
          Terminal, Firebase, Netlify, Adobe XD and Git.
        </div>
        <div className="about__right__stats">
          <div className="about__right__stats__entry">
            <div className="about__right__stats__entry__info">79+</div>
            <div className="about__right__stats__entry__heading">Projects</div>
          </div>
          <div className="about__right__stats__entry">
            <div className="about__right__stats__entry__info">79+</div>
            <div className="about__right__stats__entry__heading">Clients</div>
          </div>
        </div>
      </div>
    </div>
  );
}
