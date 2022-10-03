import { Box, GitHub, Globe, Layout } from "react-feather";
import { motion } from "framer-motion";

export default function ProjectCard({ item }) {
  return (
    <motion.div
      initial={{ opacity: 0, translateY: 10 }}
      whileInView={{
        opacity: 1,
        translateY: 0,
      }}
      className="card"
    >
      <div className="card__heading">
        {item.homepage && item.homepage !== null ? (
          <Layout size={30} color="currentColor" />
        ) : (
          <Box size={30} color="currentColor" />
        )}

        <span>{item.name.replace(/-/g, " ").replace(/_/g, " ")}</span>
      </div>
      <div
        className="card__info"
        style={{
          minHeight: 100,
        }}
      >
        {item.description && item.description.length > 120
          ? item.description.substring(0, 120) + "..."
          : item.description}
      </div>
      <div className="portfolio__section__content__entry__content">
        {item.language !== null ? item.language : "HTML"}
      </div>
      <div className="portfolio__section__content__entry__buttons">
        <a
          href={item.html_url}
          className="portfolio__section__content__entry__button"
        >
          <GitHub size={20} color="currentColor" />
          Github
        </a>
        {item.homepage && item.homepage !== null ? (
          <a
            href={item.homepage}
            className="portfolio__section__content__entry__button"
          >
            <Globe size={20} color="currentColor" />
            Website
          </a>
        ) : null}
      </div>
    </motion.div>
  );
}
