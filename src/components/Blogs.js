import React from "react";
import BlogCard from "./BlogCard";

export default function Blogs({}) {
  return (
    <section id="blog__section" className="services__section">
      <div className="services__section__header">
        <div className="home__section__sub__heading">
          If you interested to know how i do this
        </div>
        <div className="home__section__heading">Blogs</div>
      </div>
      <div className="services__section__content">
        <BlogCard
          title="Web Development"
          info="Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quam, natus earum magnam animi molestias quisquam obcaecati ipsum non nulla consequatur"
        />
        <BlogCard
          title="Application Development"
          info="Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quam, natus earum magnam animi molestias quisquam obcaecati ipsum non nulla consequatur"
        />
        <BlogCard
          title="Testing & Analytics"
          info="Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quam, natus earum magnam animi molestias quisquam obcaecati ipsum non nulla consequatur"
        />
      </div>
    </section>
  );
}
