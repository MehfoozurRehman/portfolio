import React from "react";

export default function Clients() {
  return (
    <section id="clients__section" className="clients__section section">
      <div className="clients__section__header">
        <div className="clients__section__header__left">
          <div className="clients__section__header__left__sub__heading">
            Teams & Companies i worked with
          </div>
          <div className="clients__section__header__left__heading">Clients</div>
        </div>
        <button
          onClick={() => {
            document.getElementById("contact__section").scrollIntoView();
          }}
          className="clients__section__header__right"
        >
          Hire me
        </button>
      </div>
      <div className="clients__section__content"></div>
    </section>
  );
}
