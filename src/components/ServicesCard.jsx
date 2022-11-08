import { motion } from "framer-motion";

export default function ServicesCard({ title, skills }) {
  return (
    <motion.div
      initial={{ opacity: 0, translateY: 10 }}
      whileInView={{
        opacity: 1,
        translateY: 0,
      }}
      className="card"
    >
      <div className="card__heading">{title}</div>
      <div className="card__info">
        {skills?.map((skill, i) =>
          i !== skills.length - 1 ? skill + ", " : skill
        )}
      </div>
    </motion.div>
  );
}
