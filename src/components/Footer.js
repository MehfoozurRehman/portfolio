import React from "react";
import { Facebook, GitHub, Instagram, Linkedin } from "react-feather";

export default function Footer() {
  return (
    <div className="footer__section__wapper">
      <section id="footer__section" className="footer__section">
        <div className="footer__section__left">
          <a
            href="https://github.com/MehfoozurRehman"
            className="header__content__actions__link"
            title="github"
          >
            <GitHub size={18} color="currentColor" />
            <span>github</span>
          </a>
          <a
            href="https://www.linkedin.com/in/mehfooz-rehman-37a1b0231/"
            className="header__content__actions__link"
            title="linkedin"
          >
            <Linkedin size={18} color="currentColor" />
            <span>linkedin</span>
          </a>
          <a
            href="https://www.instagram.com/mehfoozurrehman___/"
            className="header__content__actions__link"
            title="instagram"
          >
            <Instagram size={18} color="currentColor" />
            <span>instagram</span>
          </a>
          <a
            href="https://www.facebook.com/MehfoozurRehmanIjaz/?_rdc=1&_rdr"
            className="header__content__actions__link"
            title="facebook"
          >
            <Facebook size={18} color="currentColor" />
            <span>facebook</span>
          </a>
        </div>
        <div className="footer__section__right">
          © 2022 - Mehfooz-ur-Rehman. All Rights Reserved
        </div>
      </section>
    </div>
  );
}
