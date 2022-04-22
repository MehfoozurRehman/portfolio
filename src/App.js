import React from "react";
import About from "./components/About";
import Header from "./components/Header";
import Home from "./components/Home";
import Portfolio from "./components/Portfolio";
import Services from "./components/Services";
import "swiper/scss";
import "swiper/scss/navigation";
import "swiper/scss/pagination";

export default function App() {
  return (
    <>
      <Header />
      <Home />
      <About />
      <Services />
      <Portfolio />
    </>
  );
}
