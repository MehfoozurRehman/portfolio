import React from "react";

function PortfolioFilters({ children, defaultChecked, onClick }) {
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
export default function Portfolio() {
  return (
    <>
      <div className="screen__header">
        <div className="screen__header__left">
          <div className="screen__header__name">Portfolio</div>
          <div className="screen__header__breadcrum">
            <div className="screen__header__breadcrum__bar"></div> Home /
            Portfolio
          </div>
        </div>
        <div className="screen__header__right">
          <div className="portfolio__filters">
            <PortfolioFilters defaultChecked={true}>All</PortfolioFilters>
            <PortfolioFilters>Web App</PortfolioFilters>
            <PortfolioFilters>Mobile App</PortfolioFilters>
            <PortfolioFilters>UI/UX Design</PortfolioFilters>
          </div>
        </div>
      </div>
      <div className="contact__section"></div>
    </>
  );
}
