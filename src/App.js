import React from "react";
import About from "./components/About";
import Header from "./components/Header";
import Home from "./components/Home";
import Portfolio from "./components/Portfolio";
import Services from "./components/Services";
import "swiper/scss";
import "swiper/scss/navigation";
import "swiper/scss/pagination";
import GitHubCalendar from "react-github-calendar";
import Book from "./components/Book";
import Clients from "./components/Clients";
import Blog from "./components/Blog";

export default function App() {
  return (
    <>
      <Header />
      <Home />
      <About />
      <Services />
      <Portfolio />
      <GitHubCalendar
        username="mehfoozurrehman"
        color="#eb4a4a"
        fontSize={14}
        year={new Date().getFullYear()}
        style={{
          color: "white",
          margin: "0em auto",
          marginBottom: "3em",
          padding: "2em",
        }}
        blockSize={18}
      />
      <Book />
      <Clients />
      <Blog />
    </>
  );
}
