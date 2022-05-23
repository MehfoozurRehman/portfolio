export default function BlogCard({ title, info }) {
  return (
    <a href="#" className="card" style={{ padding: 0 }}>
      <img
        src="https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
        alt="banner"
        className="card__banner"
      />
      <div style={{ padding: "2em" }}>
        <div className="card__heading">{title}</div>
        <div className="card__info">{info}</div>
        <div
          className="portfolio__section__content__entry__content"
          style={{ marginBottom: "0em" }}
        >
          20/10/2022 - By Admin
        </div>
      </div>
    </a>
  );
}
