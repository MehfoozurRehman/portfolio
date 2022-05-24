import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import TestimonialsCard from "./TestimonialsCard";
import "swiper/scss";
import axios from "axios";

export default function Testimonials({}) {
  const [testimonials, setTestimonials] = useState([]);
  const [slidesPerView, setSlidesPerView] = useState(2.5);
  useEffect(() => {
    axios.get("https://testimonialapi.toolcarton.com/api").then((res) => {
      setTestimonials(res.data);
    });
  }, []);
  useEffect(() => {
    if (window.innerWidth < 700) {
      setSlidesPerView(1);
    } else if (window.innerWidth < 1000) {
      setSlidesPerView(1.5);
    } else {
      setSlidesPerView(2.4);
    }
    window.addEventListener("resize", () => {
      if (window.innerWidth < 700) {
        setSlidesPerView(1);
      } else if (window.innerWidth < 1000) {
        setSlidesPerView(1.5);
      } else {
        setSlidesPerView(2.4);
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
      <div className="services__section__content services__section__content__test">
        <Swiper slidesPerView={slidesPerView} spaceBetween={30}>
          {testimonials.map((item) => (
            <SwiperSlide key={JSON.stringify(item)}>
              <TestimonialsCard
                imageSrc={item.avatar}
                title={item.name}
                info={item.message}
                designation={item.designation}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
