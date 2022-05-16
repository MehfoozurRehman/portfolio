import React from "react";

export default function TestimonialsCard({ title, info }) {
  return (
    <div className="card" style={{ maxWidth: "100%", marginRight: "0em" }}>
      <div className="card__heading">{title}</div>
      <div className="card__info">
        <span style={{ fontSize: 20, fontWeight: "bold", marginRight: 10 }}>
          "
        </span>
        {info}
        <span style={{ fontSize: 20, fontWeight: "bold", marginLeft: 10 }}>
          "
        </span>
      </div>
    </div>
  );
}
