import React, { useEffect, useState } from "react";
import { TestimonialsCard } from "../components";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function TestimonialsSection({ info }) {
  const [screenSize, setScreenSize] = useState("large");
  useEffect(() => {
    if (window.innerWidth < 600) {
      setScreenSize("small");
    } else if (window.innerWidth < 1100) {
      setScreenSize("medium");
    } else {
      setScreenSize("large");
    }
    window.addEventListener("resize", () => {
      if (window.innerWidth < 600) {
        setScreenSize("small");
      } else if (window.innerWidth < 1100) {
        setScreenSize("medium");
      } else {
        setScreenSize("large");
      }
    });
  }, []);
  return (
    <section className="testimonials__section" id="testimonials__section">
      <div className="services__section__right__sub__heading">
        <div className="services__section__right__sub__heading__bar"></div>
        Testimonials
      </div>
      <div className="services__section__right__heading">What clients say</div>
      <div className="testimonials__section__content">
        <Swiper
          spaceBetween={50}
          slidesPerView={
            screenSize === "large"
              ? 3.5
              : screenSize === "medium"
              ? 2
              : screenSize === "small"
              ? 1
              : 3.5
          }
          // onSlideChange={() => console.log("slide change")}
          // onSwiper={(swiper) => console.log(swiper)}
        >
          {info.testimonials.map((data) => (
            <SwiperSlide>
              <TestimonialsCard data={data} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
