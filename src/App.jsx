import React from "react";
import { Route, Routes } from "react-router-dom";
import { Header } from "./components";
import { Home } from "./screens";
import "./App.scss";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  );
}
