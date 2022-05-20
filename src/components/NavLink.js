import React from "react";

export default function NavLink({ scrollTo, label, defaultChecked }) {
  return (
    <div className="header__content__nav__links__entry">
      <input
        id={scrollTo}
        type="radio"
        title={scrollTo}
        defaultChecked={defaultChecked}
        name="header__content__nav__links__entry"
        className="header__content__nav__links__entry__input"
        onClick={() => {
          document.getElementById(scrollTo + "__section").scrollIntoView();
        }}
      />
      <div className="header__content__nav__links__entry__content">{label}</div>
    </div>
  );
}
