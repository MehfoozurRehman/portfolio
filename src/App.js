import React from "react";
import GitHubCalendar from "react-github-calendar";
import About from "./components/About";
import Header from "./components/Header";
import Home from "./components/Home";
import Portfolio from "./components/Portfolio";
import Services from "./components/Services";
import Book from "./components/Book";
import Blog from "./components/Blog";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default function App() {
  return (
    <>
      <Header />
      <Home />
      <About />
      <Services />
      <div className="section__wrapper">
        <Portfolio />
        <GitHubCalendar
          username="mehfoozurrehman"
          color="#df3c3c"
          fontSize={14}
          year={new Date().getFullYear()}
          style={{
            color: "white",
            margin: "0em auto",
            marginBottom: "5em",
            padding: "2em",
          }}
          blockSize={18}
        />
        <Book />
        {/* <Clients /> */}
        <Blog />
      </div>
      <Contact />
      <Footer />
      {/* <Chatbot /> */}
    </>
  );
}
