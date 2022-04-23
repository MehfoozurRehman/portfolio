import React from "react";

export default function Blog() {
  return (
    <div id="blog__section" className="blog__section">
      <div className="blog__section__header">
        <div className="blog__section__header__sub__heading">Latest news</div>
        <div className="blog__section__header__heading">Blog</div>
      </div>
      <div className="blog__section__content">
        <BlogCard />
        <BlogCard />
        <BlogCard />
      </div>
    </div>
  );
}

function BlogCard({}) {
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
          Blog name Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet
          consectetur adipisicing elit. Fugit, iure. Lorem ipsum dolor sit amet
          consectetur adipisicing elit. Fugit, iure.
        </div>
        <div className="blog__section__content__entry__content__row">
          <div className="blog__section__content__entry__content__date">
            12th Dec 2022
          </div>
          <div className="blog__section__content__entry__content__dot" />
          <div className="blog__section__content__entry__content__author">
            by Admin
          </div>
        </div>
      </div>
    </a>
  );
}
