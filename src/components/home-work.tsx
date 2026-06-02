import WorkCard from "./work-card";

const works = [
  {
    right: true,
    company: "DSME Global",
    name: "DSMEGlobals.com",
    tech: ["ReactJS", "Sass", "Firebase", "Adobe Xd", "Rest"],
    banner: "/dsmeglobal.png",
    info: "A website for a startup empowering and helping non technical personal to build creative and intuitive digital identity",
    siteLink: "http://www.dsmeglobal.co/",
  },
];

export default function HomeWork() {
  return (
    <section id="work__section" className="work__section">
      <div className="work__section__header">
        <div className="home__section__sub__heading">
          Some Things I've Built
        </div>
        <div className="home__section__heading">Work</div>
      </div>
      {works.map((work, index) => (
        <WorkCard
          key={index}
          company={work.company}
          name={work.name}
          tech={work.tech}
          banner={work.banner}
          info={work.info}
          siteLink={work.siteLink}
          right={work.right}
        />
      ))}
    </section>
  );
}
