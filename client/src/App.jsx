import React from "react";
import { Route, Routes } from "react-router-dom";
import "./App.scss";
import { Contact, Home, Portfolio, ProjectDetails } from "./screens";
import { ContactSection, Footer, Header } from "./components";
import { CloudinaryContext } from "cloudinary-react";
import info from "./assets/info.json";

export default function App() {
  return (
    <CloudinaryContext cloudName="mehfoozurrehman">
      <Header info={info} />
      <Routes>
        <Route path="/" element={<Home info={info} />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/project-detail" element={<ProjectDetails />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <ContactSection />
      <Footer />
    </CloudinaryContext>
  );
}
