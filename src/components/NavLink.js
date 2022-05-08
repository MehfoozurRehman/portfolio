import React from "react";

export default function NavLink({ children, defaultChecked, scrollTo }) {
  return (
    <div className="header__content__nav__link">
      <input
        id={scrollTo}
        type="radio"
        name="header__content__nav__link"
        title={scrollTo}
        className="header__content__nav__link__input"
        defaultChecked={defaultChecked}
        onClick={() => {
          document.getElementById(scrollTo + "__section").scrollIntoView();
        }}
      />
      <div className="header__content__nav__link__content">{children}</div>
    </div>
  );
}
