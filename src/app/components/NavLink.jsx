import React from "react";
import { useNavigate } from "react-router-dom";

export default function NavLink({ children, to, id, toSection, setIsNavOpen }) {
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
                if (window.innerWidth < 1100) {
                  setIsNavOpen(false);
                } else {
                  setIsNavOpen(true);
                }
              }
            : () => {
                navigate(to);
                if (window.innerWidth < 1100) {
                  setIsNavOpen(false);
                } else {
                  setIsNavOpen(true);
                }
              }
        }
      />
      <div className="header__wrapper__nav__link__content">{children}</div>
    </div>
  );
}
