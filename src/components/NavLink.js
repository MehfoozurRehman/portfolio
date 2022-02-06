import React from "react";
import { useNavigate } from "react-router-dom";

export default function NavLink({ children, to, id, toSection }) {
  const navigate = useNavigate();
  return (
    <div className="header__wrapper__nav__link">
      <input
        type="radio"
        defaultChecked={to === window.location.pathname}
        className="header__wrapper__nav__link__input"
        name="header__wrapper__nav__link__input"
        id={id}
        onClick={
          toSection
            ? () => {
                navigate("/");
                setTimeout(() => {
                  document.getElementById(toSection).scrollIntoView();
                }, 300);
              }
            : () => {
                navigate(to);
              }
        }
      />
      <div className="header__wrapper__nav__link__content">{children}</div>
    </div>
  );
}
