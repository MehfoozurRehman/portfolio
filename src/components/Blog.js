import React from "react";
import { parseDate } from "../utils/function";

export default function Blog() {
  const blogData = [
    {
      heading:
        "Blog name Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet consectetur",
      date: "2022-04-22T00:13:01Z",
      author: "Admin",
    },
    {
      heading:
        "Blog name Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet consectetur",
      date: "2022-04-22T00:13:01Z",
      author: "Admin",
    },
    {
      heading:
        "Blog name Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet consectetur Blog name Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet consectetur",
      date: "2020-04-22T00:13:01Z",
      author: "Arslan",
    },
    {
      heading:
        "Blog name Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet consectetur Blog name Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet consectetur",
      date: "2020-04-22T00:13:01Z",
      author: "Arslan",
    },
  ];
  return (
    <div id="blog__section" className="blog__section section">
      <div className="blog__section__header">
        <div className="blog__section__header__sub__heading">Latest news</div>
        <div className="blog__section__header__heading">Blog</div>
      </div>
      <div className="blog__section__content">
        {blogData.map((blog, i) => {
          return (
            <BlogCard
              key={i}
              heading={blog.heading}
              date={blog.date}
              author={blog.author}
            />
          );
        })}
      </div>
    </div>
  );
}

function BlogCard({ heading, date, author }) {
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
