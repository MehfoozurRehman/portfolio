import React from "react";
import { Route, Routes } from "react-router-dom";
import "./App.scss";
import { Contact, Home, Portfolio, ProjectDetails } from "./screens";
import { ContactSection, Footer, Header } from "./components";
import { CloudinaryContext } from "cloudinary-react";

export default function App() {
  return (
    <CloudinaryContext cloudName="mehfoozurrehman">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/project-detail" element={<ProjectDetails />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <ContactSection />
      <Footer />
    </CloudinaryContext>
  );
}
