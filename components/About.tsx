import Link from "next/link";

const services = [
  {
    title: "Frontend Development",
    skills: [
      "ReactJS",
      "NextJS",
      "Remix",
      "Jotai",
      "Typescript",
      "React Native",
      "Electron",
      "Redux",
      "Netlify",
      "Vercel",
    ],
  },
  {
    title: "Backend Development",
    skills: [
      "MongoDB",
      "PostgreSQL",
      "ExpressJS",
      "NodeJS",
      "Graphql",
      "Rest",
      "Firebase",
      "Railway",
      "Heroku",
      "AWS ec2",
    ],
  },
  {
    title: "General",
    skills: ["Adobe Xd", "Figma", "Illustrator", "Gimp", "Git", "yarn", "npm"],
  },
];

export default function About({ dataFromGithub }: any) {
  return (
    <section id="about" className="about">
      <div className="about__content">
        <div className="about__content__left">
          {services.map((service) => (
            <div className="about__content__left__entry" key={service.title}>
              <div className="about__content__left__entry__title">
                {service.title}
              </div>
              <div className="about__content__left__entry__skills">
                {service.skills.map((skill) => (
                  <div
                    key={skill}
                    className="about__content__left__entry__skills__skill"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="about__content__right">
          <div className="about__content__right__heading">
            How can i help you?
          </div>
          <div className="about__content__right__text">
            I'm a Web Developer based in Pakistan. I enjoy turning complex
            problems into simple, beautiful and intuitive solutions.
          </div>
          <div className="about__content__right__text">
            I like to build functional and user-friendly and at the same time
            attractive websites for you. Moreover, I add a personal touch to
            your product and make sure that it is eye-catching and easy to use.
            My aim is to bring across your message and identity in the most
            creative way.
          </div>
          <div className="about__content__right__row">
            <div className="about__content__right__row__left">
              <div className="about__content__right__row__left__heading">
                +{dataFromGithub?.public_repos}
              </div>
              <div className="about__content__right__row__left__text">
                Projects Completed
              </div>
            </div>
            <div className="about__content__right__row__right">
              <div className="about__content__right__row__right__heading">
                +{dataFromGithub?.followers}
              </div>
              <div className="about__content__right__row__right__text">
                Satisfied Clients
              </div>
            </div>
          </div>
          <Link
            href="https://docs.google.com/document/d/1Z3e-5Ti2Zw9aol5RH5BUoiL8AC7HROHHQQkfvX6MQbQ/edit"
            target="_blank"
            className="about__content__right__button"
          >
            Download Resume
          </Link>
        </div>
      </div>
    </section>
  );
}
