import React from "react";

export default function ClientCard({ image, url }) {
  return (
    <a
      href={url}
      className="card"
      style={{ minWidth: "fit-content", minHeight: 120 }}
    >
      <img src={image} alt={url} className="card__img" />
    </a>
  );
}
