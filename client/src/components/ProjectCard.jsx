import React from "react";
import { Image } from "cloudinary-react";
import { Link } from "react-router-dom";

export default function ProjectCard({ data }) {
  return (
    <Link
      to="/project-detail"
      state={{ state: data }}
      onClick={() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }}
      className="project__card"
    >
      <div className="project__card__name">{data.name}</div>
      <div className="project__card__description">{data.description}</div>
      <div className="project__card__languages">
        {data.languages.map((item, i) => (
          <div key={i} className="project__card__languages__entry">
            {item}
          </div>
        ))}
      </div>
      <Image
        publicId={data.image}
        alt={data.image}
        className="project__card__image"
      />
    </Link>
  );
}
