import React from "react";
import { parseDate } from "../utils/function";

export default function BlogCard({ heading, date, author }) {
  return (
    <a href="#" className="blog__section__content__entry">
      <div className="blog__section__content__entry__image">
        <img
          src="https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
          alt=""
          className="blog__section__content__entry__image__img"
        />
      </div>
      <div className="blog__section__content__entry__content">
        <div className="blog__section__content__entry__heading">
          {heading && heading.length > 100
            ? heading.substring("", 100) + "..."
            : heading}
        </div>
        <div className="blog__section__content__entry__content__row">
          <div className="blog__section__content__entry__content__date">
            {date && parseDate(date)}
          </div>
          <div className="blog__section__content__entry__content__dot" />
          <div className="blog__section__content__entry__content__author">
            by {author}
          </div>
        </div>
      </div>
    </a>
  );
}
