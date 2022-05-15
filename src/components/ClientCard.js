import React from "react";

export default function ClientCard({ image, url }) {
  return (
    <a
      href={url}
      className="services__section__content__entry"
      style={{ minWidth: "fit-content", minHeight: 120 }}
    >
      <img
        src={image}
        alt={url}
        className="services__section__content__entry__img"
      />
    </a>
  );
}
