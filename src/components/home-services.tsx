import ServicesCard from "./services-card";

const services = [
  {
    title: "Frontend Development",
    skills: [
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "Remix",
      "React Native",
      "Tailwind CSS",
      "Sass",
      "Electron",
      "Responsive Design",
    ],
  },
  {
    title: "Backend Development",
    skills: [
      "Node.js",
      "Express.js",
      "GraphQL",
      "REST APIs",
      "MongoDB",
      "PostgreSQL",
      "Firebase",
      "Prisma",
      "Authentication",
      "Database Design",
    ],
  },
  {
    title: "Tools & Platforms",
    skills: [
      "Vercel",
      "Netlify",
      "Firebase",
      "AWS",
      "Docker",
      "Git",
      "Figma",
      "Vite",
      "webpack",
      "CI/CD",
    ],
  },
];

export default function HomeServices() {
  return (
    <section id="services__section" className="services__section">
      <div className="services__section__header">
        <div className="home__section__sub__heading">
          What can i do for you
        </div>
        <div className="home__section__heading">Services</div>
      </div>
      <div className="services__section__content">
        {services.map((service, index) => (
          <ServicesCard
            key={index}
            title={service.title}
            skills={service.skills}
          />
        ))}
      </div>
    </section>
  );
}
