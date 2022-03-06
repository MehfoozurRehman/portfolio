import React from "react";
import gravatarUrl from "gravatar-url";

export default function TestimonialsCard({ data }) {
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
      <div className="testimonials__card__header__info">{data.message}</div>
    </div>
  );
}
