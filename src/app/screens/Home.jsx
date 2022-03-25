import React, { useContext } from 'react';
import { AuthContext } from '../App';
import {
  AboutSection,
  HomeSection,
  PortfolioSection,
  ServicesSection,
  TestimonialsSection,
} from '../components';
import SkillSection from '../components/SkillSection';

export default function Home({ info }) {
  const { isUser } = useContext(AuthContext);
  console.log(isUser);
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
