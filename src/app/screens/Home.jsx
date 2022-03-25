import React from "react";
import {
  AboutSection,
  HomeSection,
  PortfolioSection,
  ServicesSection,
  TestimonialsSection,
} from "../components";
import SkillSection from "../components/SkillSection";

export default function Home({ info }) {
  return (
    <>
      <HomeSection info={info} />
      <ServicesSection />
      <AboutSection />
      <SkillSection info={info} />
      <PortfolioSection />
      <TestimonialsSection info={info} />
    </>
  );
}
