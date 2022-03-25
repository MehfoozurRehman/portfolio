import React from "react";

export default function ServicesCard({ name, icon }) {
  return (
    <div className="service__card">
      {icon}
      <div className="service__card__heading">{name}</div>
    </div>
  );
}
