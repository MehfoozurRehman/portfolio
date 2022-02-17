import React from "react";

export default function PortfolioFilter({ children, defaultChecked, onClick }) {
  return (
    <div className="header__wrapper__nav__link">
      <input
        type="radio"
        defaultChecked={defaultChecked}
        className="header__wrapper__nav__link__input"
        name="portfolio__filters__input"
        onClick={onClick}
      />
      <div className="header__wrapper__nav__link__content">{children}</div>
    </div>
  );
}
