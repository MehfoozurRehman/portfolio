import React from "react";
import ClientCard from "./ClientCard";

export default function Clients({}) {
  return (
    <section id="clients__section" className="services__section">
      <div className="services__section__header">
        <div className="home__section__sub__heading">
          Who I have worked with
        </div>
        <div className="home__section__heading">Clients</div>
      </div>
      <div
        className="services__section__content services__section__content__reverse"
        style={{ marginRight: "-2em" }}
      >
        <div className="services__section__content__col">
          <ClientCard
            image="https://dsmeglobals.web.app/static/media/logo.0806177f9fd861de2386.png"
            url="https://dsmeglobals.web.app/"
          />
        </div>
        <div className="services__section__content__col">
          <ClientCard
            image="https://dsmeglobals.web.app/static/media/logo.0806177f9fd861de2386.png"
            url="https://dsmeglobals.web.app/"
          />
          <ClientCard
            image="https://dsmeglobals.web.app/static/media/logo.0806177f9fd861de2386.png"
            url="https://dsmeglobals.web.app/"
          />
        </div>
        <div className="services__section__content__col">
          <ClientCard
            image="https://dsmeglobals.web.app/static/media/logo.0806177f9fd861de2386.png"
            url="https://dsmeglobals.web.app/"
          />
          <ClientCard
            image="https://dsmeglobals.web.app/static/media/logo.0806177f9fd861de2386.png"
            url="https://dsmeglobals.web.app/"
          />
          <ClientCard
            image="https://dsmeglobals.web.app/static/media/logo.0806177f9fd861de2386.png"
            url="https://dsmeglobals.web.app/"
          />
        </div>
        <div className="services__section__content__col">
          <ClientCard
            image="https://dsmeglobals.web.app/static/media/logo.0806177f9fd861de2386.png"
            url="https://dsmeglobals.web.app/"
          />
          <ClientCard
            image="https://dsmeglobals.web.app/static/media/logo.0806177f9fd861de2386.png"
            url="https://dsmeglobals.web.app/"
          />
        </div>
        <div className="services__section__content__col">
          <ClientCard
            image="https://dsmeglobals.web.app/static/media/logo.0806177f9fd861de2386.png"
            url="https://dsmeglobals.web.app/"
          />
        </div>
      </div>
    </section>
  );
}
