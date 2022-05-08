import React from "react";
import { Box, Layout, Package, Shield } from "react-feather";
import ServicesCard from "./ServicesCard";

export default function Services() {
  return (
    <div className="services__section__wrapper">
      <div id="services__section" className="services__section">
        <div className="services__section__sub__heading">
          What i will do for you
        </div>
        <div className="services__section__heading">Services</div>
        <div className="services__section__content section">
          <ServicesCard
            icon={<Layout size={80} color="currentColor" strokeWidth={1} />}
            projects={39}
            title="Web Development"
            info="Web development, also known as website development, refers to the tasks associated with creating, building, and maintaining websites and web applications that run online on a browser. It may, however, also include web design, web programming, and database management."
          />
          <ServicesCard
            icon={<Box size={80} color="currentColor" strokeWidth={1} />}
            projects={39}
            title="Mobile Development"
            info="Mobile application development is the process of creating software applications that run on a mobile device, and a typical mobile application utilizes a network connection to work with remote computing resources."
          />
          <ServicesCard
            icon={<Package size={80} color="currentColor" strokeWidth={1} />}
            projects={39}
            title="UI / UX Design"
            info="User interface (UI) design refers to the aesthetic elements by which people interact with a product, such as buttons, icons, menu bars, typography, colors, and more. User experience (UX) design refers to the experience a user has when interacting with a product."
          />
          <ServicesCard
            icon={<Shield size={90} color="currentColor" strokeWidth={1} />}
            projects={39}
            title="SEO / Security"
            info="SEO security is the use of SEO metrics to identify flaws in a site's security, to act to solve those issues and to monitor site activity with security in mind. Good SEO practitioners follow security news closely and should increase their clients' site security by a significant factor."
          />
        </div>
      </div>
    </div>
  );
}
