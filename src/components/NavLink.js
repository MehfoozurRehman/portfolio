import React from "react";

export default function NavLink({ children, defaultChecked, scrollTo }) {
  return (
    <div className="header__nav__link">
      <input
        id={scrollTo}
        type="radio"
        name="header__nav__link"
        className="header__nav__link__input"
        defaultChecked={defaultChecked}
        onClick={() => {
          document.getElementById(scrollTo).scrollIntoView();
        }}
      />
      <div className="header__nav__link__content">{children}</div>
    </div>
  );
}
