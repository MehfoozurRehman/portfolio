import React from "react";
import { Route, Routes } from "react-router-dom";
import "./App.scss";
import {
  AboutUs,
  Contact,
  Home,
  Portfolio,
  ProjectDetails,
  Services,
} from "./screens";
import { ContactSection, Footer, Header } from "./components";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/services" element={<Services />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/project-detail" element={<ProjectDetails />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <ContactSection />
      <Footer />
    </>
  );
}
