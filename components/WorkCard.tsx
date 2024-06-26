import { Link } from "react-feather";
import { memo } from "react";

interface WorkCardProps {
  tech: string[];
  right?: boolean;
  banner?: string;
  info?: string;
  siteLink?: string;
  name: string;
  company: string;
}

const WorkCard = memo(
  ({ tech, right, banner, info, siteLink, name, company }: WorkCardProps) => (
    <div
      className="work__section__entry"
      style={right ? { justifyContent: "flex-end" } : {}}
    >
      <a
        href={siteLink}
        className="work__section__entry__left"
        title={name.replace(".com", "")}
      >
        <img
          loading="lazy"
          src={banner}
          alt={name.replace(".com", "")}
          className="work__section__entry__left__img"
        />
      </a>
      <div
        className="work__section__entry__right"
        style={right ? { left: 0, alignItems: "flex-start" } : {}}
      >
        <div className="work__section__entry__right__sub__heading">
          {company}
        </div>
        <div className="work__section__entry__right__heading">
          {name.replace(".com", "")}
        </div>
        <div
          className="work__section__entry__right__info"
          style={right ? { textAlign: "left" } : {}}
        >
          {info ? info : ""}
        </div>
        <div
          className="work__section__entry__right__tech"
          style={right ? { textAlign: "left" } : {}}
        >
          {tech?.map((item, i) => (i !== tech.length - 1 ? item + ", " : item))}
        </div>
        <div className="work__section__entry__right__links">
          <a
            href={siteLink}
            className="work__section__entry__right__links__link"
            title="website"
          >
            <Link size={20} color="currentColor" />
          </a>
        </div>
      </div>
    </div>
  )
);

export default WorkCard;
