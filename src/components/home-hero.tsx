export default function HomeHero() {
  return (
    <section id="home__section" className="home__section">
      <div className="home__section__sub__heading">Hi, i am</div>
      <div className="home__section__heading">Mefooz-ur-Rehman</div>
      <div className="home__section__slogan">
        Let's Build Your <span>Digital Identity</span>
      </div>
      <div className="home__section__info">
        I'm a Full Stack Web Developer based in Pakistan. I turn complex
        problems into simple, beautiful, and intuitive solutions. Currently
        building innovative digital products at
        <a href="https://devscot.com/" target="_blank" rel="noreferrer">
          Devscot
        </a>
      </div>
      <button
        className="home__section__button"
        title="Check out my work!"
        onClick={() => {
          document.getElementById("work__section").scrollIntoView();
          (document.getElementById("work") as HTMLInputElement).checked = true;
        }}
      >
        Check out my work!
      </button>
    </section>
  );
}
