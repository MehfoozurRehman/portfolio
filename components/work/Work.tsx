import Link from "next/link";
import WorkSlider from "./WorkSlider";

export default function Work() {
  return (
    <section id="work" className="work">
      <div className="work__header">
        <div className="work__header__left">
          <div className="work__header__left__title">My Latest Work</div>
          <div className="work__header__left__subtitle">
            Some of my projects
          </div>
        </div>
        <div className="work__header__right">
          <Link href="/projects">Explore All Projects</Link>
        </div>
      </div>
      <div className="work__content">
        <WorkSlider />
      </div>
    </section>
  );
}
