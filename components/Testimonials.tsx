import Image from "next/image";

const testimonials = [
  {
    id: 1,
    name: "John Doe",
    job: "CEO",
    message:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam voluptatibus, voluptates, quibusdam, quidem quod voluptatem voluptate voluptatum dolorum quae voluptas quis.",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 2,
    name: "John Doe",
    job: "CEO",
    message:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam voluptatibus, voluptates, quibusdam, quidem quod voluptatem voluptate voluptatum dolorum quae voluptas quis.",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 3,
    name: "John Doe",
    job: "CEO",
    message:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam voluptatibus, voluptates, quibusdam, quidem quod voluptatem voluptate voluptatum dolorum quae voluptas quis.",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonial" className="testimonial">
      <div className="testimonial__heading">People task about me</div>
      <div className="testimonial__content">
        {testimonials.map((testimonial, index) => (
          <div className="testimonial__content__entry" key={index}>
            <Image
              fill
              src={testimonial.image}
              alt={testimonial.name}
              className="testimonial__content__entry__img"
            />
            <div className="testimonial__content__entry__message">
              {testimonial.message}
            </div>
            <div className="testimonial__content__entry__name">
              {testimonial.name}
            </div>
            <div className="testimonial__content__entry__job">
              {testimonial.job}
            </div>
          </div>
        ))}
      </div>
      <div className="testimonial__content__bottom">
        <button className="testimonial__content__bottom__btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button className="testimonial__content__bottom__btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
