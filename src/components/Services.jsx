import ServicesCard from "./ServicesCard";
import { motion } from "framer-motion";

export default function Services() {
  return (
    <section id="services__section" className="services__section">
      <div className="services__section__header">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{
            opacity: 1,
          }}
          className="home__section__sub__heading"
        >
          What i can do for you
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{
            opacity: 1,
          }}
          className="home__section__heading"
        >
          Services
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{
          opacity: 1,
          transition: {
            staggerChildren: 0.5,
          },
        }}
        className="services__section__content"
      >
        <ServicesCard
          title="Web Development"
          skills={[
            "ReactJS",
            "MongoDB",
            "ExpressJS",
            "NodeJS",
            "Typescript",
            "Graphql",
            "Rest",
          ]}
        />
        <ServicesCard
          title="Application Development"
          skills={[
            "React Native",
            "Electron",
            "MongoDB",
            "ExpressJS",
            "NodeJS",
            "Graphql",
            "Rest",
          ]}
        />
        <ServicesCard
          title="Testing & Analytics"
          skills={["Firebase", "Simple Analytics", "Jest"]}
        />
        <ServicesCard title="UI / UX Design" skills={["Adobe Xd", "Figma"]} />
        <ServicesCard title="Graphic Design" skills={["Illustrator", "Gimp"]} />
      </motion.div>
    </section>
  );
}
