import { motion } from "framer-motion";
export default function HomeSection() {
  return (
    <section id="home__section" className="home__section">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="home__section__sub__heading"
      >
        Hi, i am
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="home__section__heading"
      >
        Mefooz-ur-Rehman
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="home__section__slogan"
      >
        Let's Build You A <span>Digital Identity</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="home__section__info"
      >
        I'm a Web Developer based in Pakistan. Proficent in web and mobile
        deveopment. I enjoy turning complex problems into simple, beautiful and
        intuitive solutions. Working at this time for
        <a href="https://crazybeings.com/" target="_blank">
          Crazybeings Studio
        </a>
      </motion.div>
      <motion.button
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="home__section__button"
        title="Check out my work!"
        onClick={() => {
          document.getElementById("work__section").scrollIntoView();
          document.getElementById("work").checked = true;
        }}
      >
        Check out my work!
      </motion.button>
    </section>
  );
}
