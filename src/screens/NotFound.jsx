import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="not__found__container">
      <img src="/not-found.svg" alt="not found" className="not__found__container__img" />
      <Link to="/" className="not__found__container__link">
        Go to Home
      </Link>
    </div>
  );
}
