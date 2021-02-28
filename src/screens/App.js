import React from "react";
import "./App.css";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";
import Contact from "./Contact/Contact";
import Blog from "./Blog/Blog";
import Testimonails from "./Testimonails/Testimonails";
import Services from "./Services/Services";

function App() {
  return (
    <section id="top" className="container">
      <Header />
      hello
      <Services />
      <Testimonails />
      <Blog />
      <Contact />
      <Footer />
    </section>
  );
}

export default App;
