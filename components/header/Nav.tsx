"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import ClickAwayListener from "react-click-away-listener";

const links = [
  {
    name: "About",
    id: "about",
  },
  {
    name: "Experience",
    id: "experience",
  },
  {
    name: "Work",
    id: "work",
  },
  {
    name: "Contact",
    id: "contact",
  },
];

export default function Nav() {
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [activeLink, setActiveLink] = useState(links[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveLink(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );
    links.forEach((link) => {
      observer.observe(document.getElementById(link.id)!);
    });
  }, []);

  const handleResize = useCallback(() => {
    if (window.innerWidth >= 768) {
      setIsNavOpen(true);
    } else {
      setIsNavOpen(false);
    }
  }, []);

  useLayoutEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize);
    };
  }, []);

  return (
    <ClickAwayListener
      onClickAway={() => {
        if (window.innerWidth < 768) setIsNavOpen(false);
      }}
    >
      <div className="header__nav">
        {isNavOpen && (
          <nav className="header__nav__content">
            {links.map((link) => (
              <button
                key={link.id}
                className={`header__nav__link ${
                  activeLink === link.id ? "active" : ""
                }`}
                onClick={() => {
                  document.getElementById(link.id)?.scrollIntoView();
                  setActiveLink(link.id);
                }}
              >
                {link.name}
              </button>
            ))}
          </nav>
        )}
        <button
          className="header__nav__toggle"
          onClick={() => setIsNavOpen(!isNavOpen)}
        >
          {isNavOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>
    </ClickAwayListener>
  );
}
