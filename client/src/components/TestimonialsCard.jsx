import React from "react";
import gravatarUrl from "gravatar-url";

export default function TestimonialsCard({ data }) {
  function limit(string = "", limit = 0) {
    return string.substring(0, limit);
  }
  return (
    <div className="testimonials__card">
      <div className="testimonials__card__header">
        <div className="testimonials__card__header__box">
          <img
            src={gravatarUrl(data.email, { size: 200 })}
            alt="pic"
            className="testimonials__card__header__box__img"
          />
        </div>
        <div className="testimonials__card__header__content">
          <div className="testimonials__card__header__content__heading">
            {data.name}
          </div>
          <div className="testimonials__card__header__content__sub__heading">
            {data.designation}
          </div>
        </div>
      </div>
      <div className="testimonials__card__header__info">
        {limit(data.message, 250)}
      </div>
    </div>
  );
}
