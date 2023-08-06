export default function HomeSection() {
  return (
    <section id="home__section" className="home__section">
      <div className="home__section__sub__heading">Hi, i am</div>
      <div className="home__section__heading">Mefooz-ur-Rehman</div>
      <div className="home__section__slogan">
        Let's Build You A <span>Digital Identity</span>
      </div>
      <div className="home__section__info">
        I'm a Web Developer based in Pakistan. Proficient in web and mobile
        development. I enjoy turning complex problems into simple, beautiful and
        intuitive solutions. Working at this time for
        <a href="https://crazybeingstudio.com/" target="_blank">
          Crazybeings Studio
        </a>
      </div>
      <button
        className="home__section__button"
        title="Check out my work!"
        onClick={() => {
          document.getElementById("work__section").scrollIntoView();
          document.getElementById("work").checked = true;
        }}
      >
        Check out my work!
      </button>
    </section>
  );
}
