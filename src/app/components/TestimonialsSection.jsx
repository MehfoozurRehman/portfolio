import React, { useEffect, useState } from 'react';
import { TestimonialsCard } from '../components';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function TestimonialsSection({ info }) {
  const [testimonialData, setTestimonialData] = useState([]);
  const [screenSize, setScreenSize] = useState('large');
  useEffect(() => {
    if (window.innerWidth < 600) {
      setScreenSize('small');
    } else if (window.innerWidth < 1100) {
      setScreenSize('medium');
    } else {
      setScreenSize('large');
    }
    window.addEventListener('resize', () => {
      if (window.innerWidth < 600) {
        setScreenSize('small');
      } else if (window.innerWidth < 1100) {
        setScreenSize('medium');
      } else {
        setScreenSize('large');
      }
    });
  }, []);

  useEffect(() => {
    axios
      .get(
        `${
          import.meta.env.PROD
            ? 'https://mehfooz-ur-rehman.herokuapp.com/'
            : 'http://localhost:9000/'
        }api/v1/get_testimonial`
      )
      .then((res) => {
        setTestimonialData(res.data);
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
            screenSize === 'large'
              ? 3.5
              : screenSize === 'medium'
              ? 2
              : screenSize === 'small'
              ? 1
              : 3.5
          }
          // onSlideChange={() => console.log("slide change")}
          // onSwiper={(swiper) => console.log(swiper)}
        >
          {testimonialData.map((data, i) => (
            <SwiperSlide key={i}>
              <TestimonialsCard data={data} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <div className="porfolio__loadmore" style={{ marginTop: -50 }}>
        <Link
          to="/write-testimonial"
          onClick={() => {
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 10);
          }}
          title="load more"
          className="contact__section__right__btn"
          style={{
            textDecoration: 'none',
          }}
        >
          Write Testimonial
        </Link>
      </div>
    </section>
  );
}
