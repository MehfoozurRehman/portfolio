import ClientCard from "./ClientCard";

export default function Clients({ data }) {
  return (
    <section id="clients__section" className="services__section">
      <div className="services__section__header">
        <div className="home__section__sub__heading">
          Who I have worked with
        </div>
        <div className="home__section__heading">Clients</div>
      </div>
      <div className="services__section__content">
        {data?.map((item) => (
          <ClientCard
            key={item._id}
            name={item.name}
            image={
              "https://res.cloudinary.com/mehfoozurrehman/image/upload/" +
              item.logo
            }
          />
        ))}
      </div>
    </section>
  );
}
