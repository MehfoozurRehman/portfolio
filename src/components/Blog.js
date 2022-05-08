import React from "react";
import BlogCard from "./BlogCard";

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
