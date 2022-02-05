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
import { Footer, Header } from "./components";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/" element={<AboutUs />} />
        <Route path="/" element={<Services />} />
        <Route path="/" element={<Portfolio />} />
        <Route path="/" element={<ProjectDetails />} />
        <Route path="/" element={<Contact />} />
      </Routes>
      <Footer />
    </>
  );
}
