const experience = [
  {
    title: "Full Stack Developer",
    company: "Devscot",
    date: "Dec 2020 - Present",
    description: [
      "Worked on a project for a client in the US, which is a platform for people to create and share their own recipes.",
      "Worked on a project for a client in the US, which is a platform for people to create and share their own recipes.",
    ],
  },
  {
    title: "Full Stack Developer",
    company: "LeadProfit inc.",
    date: "Feb 2023 - July 2020",
    description: [
      "Worked on a project for a client in the US, which is a platform for people to create and share their own recipes.",
    ],
  },
  {
    title: "Frontend Developer",
    company: "Self Employed",
    date: "Jan 2019 - Feb 2020",
    description: [
      "Worked on a project for a client in the US, which is a platform for people to create and share their own recipes.",
    ],
  },
];

export default function Experience() {
  return (
    <section id="experience" className="experience">
      <div className="experience__heading">Work Experience</div>
      <div className="experience__content">
        {experience.map((exp) => (
          <div className="experience__content__entry">
            <div className="experience__content__entry__left">
              <div className="experience__content__entry__title">
                {exp.company}
              </div>
              <div className="experience__content__entry__company">
                {exp.date}
              </div>
            </div>
            <div className="experience__content__entry__right">
              <div className="experience__content__entry__date">
                {exp.title}
              </div>
              <div className="experience__content__entry__description">
                {exp.description.map((desc, index) => (
                  <div
                    key={index}
                    className="experience__content__entry__description__desc"
                  >
                    {desc}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
