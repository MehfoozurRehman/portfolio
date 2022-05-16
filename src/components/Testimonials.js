import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import TestimonialsCard from "./TestimonialsCard";
import "swiper/scss";

export default function Testimonials({}) {
  const [slidesPerView, setSlidesPerView] = useState(2.5);
  useEffect(() => {
    if (window.innerWidth < 700) {
      setSlidesPerView(1);
    } else if (window.innerWidth < 1000) {
      setSlidesPerView(1.5);
    } else {
      setSlidesPerView(2.8);
    }
    window.addEventListener("resize", () => {
      if (window.innerWidth < 700) {
        setSlidesPerView(1);
      } else if (window.innerWidth < 1000) {
        setSlidesPerView(1.5);
      } else {
        setSlidesPerView(2.8);
      }
    });
  }, []);

  return (
    <section id="testimonials__section" className="services__section">
      <div className="services__section__header">
        <div className="home__section__sub__heading">
          Feedback from my clients & team
        </div>
        <div className="home__section__heading">Testimonials</div>
      </div>
      <div
        className="services__section__content"
        style={{ marginRight: "0em" }}
      >
        <Swiper slidesPerView={slidesPerView} spaceBetween={30}>
          <SwiperSlide>
            <TestimonialsCard
              title="Web Development"
              info="Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium maiores corporis nulla unde architecto modi iste quasi ea laudantium quam!"
            />
          </SwiperSlide>
          <SwiperSlide>
            <TestimonialsCard
              title="App Development"
              info="Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium maiores corporis nulla unde architecto modi iste quasi ea laudantium quam!"
            />
          </SwiperSlide>
          <SwiperSlide>
            <TestimonialsCard
              title="Net Development"
              info="Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium maiores corporis nulla unde architecto modi iste quasi ea laudantium quam!"
            />
          </SwiperSlide>
          <SwiperSlide>
            <TestimonialsCard
              title="Sold Development"
              info="Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium maiores corporis nulla unde architecto modi iste quasi ea laudantium quam!"
            />
          </SwiperSlide>
          <SwiperSlide>
            <TestimonialsCard
              title="Z Development"
              info="Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium maiores corporis nulla unde architecto modi iste quasi ea laudantium quam!"
            />
          </SwiperSlide>
        </Swiper>
      </div>
    </section>
  );
}
