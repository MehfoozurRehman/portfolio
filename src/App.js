import React from "react";
import { Route, Routes } from "react-router-dom";
import "./App.scss";
import { Contact, Home, Portfolio, ProjectDetails } from "./screens";
import { ContactSection, Footer, Header } from "./components";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/project-detail" element={<ProjectDetails />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <ContactSection />
      <Footer />
    </>
  );
}
