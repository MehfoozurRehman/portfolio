import React from "react";
import "./App.css";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";
import Contact from "./Contact/Contact";
import Blog from "./Blog/Blog";
import Testimonails from "./Testimonails/Testimonails";
import Services from "./Services/Services";
import Portfolio from "./Porfolio/Portfolio";
import Skills from "./Skills/Skills";
import About from "./About/About";

function App() {
  return (
    <section id="top" className="container">
      <Header />
      hello
      <About />
      <Services />
      <Skills />
      <Portfolio />
      <Testimonails />
      <Blog />
      <Contact />
      <Footer />
    </section>
  );
}

export default App;
