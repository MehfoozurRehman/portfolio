import React from "react";

export default function PortfolioFilter({ label, defaultChecked, onClick }) {
  return (
    <div className="portfolio__section__header__middle__entry">
      <input
        type="radio"
        name="portfolio__section__header__middle__entry"
        className="portfolio__section__header__middle__entry__input"
        defaultChecked={defaultChecked}
        onClick={onClick}
        title={label}
      />
      <div className="portfolio__section__header__middle__entry__content">
        {label}
      </div>
    </div>
  );
}
