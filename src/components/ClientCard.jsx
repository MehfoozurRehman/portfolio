export default function ClientCard({ image, name }) {
  return (
    <div
      className="card"
      style={{
        minWidth: "fit-content",
        maxWidth: "fit-content",
        minHeight: 100,
      }}
    >
      <img src={image} alt={name} className="card__img" loading="lazy" />
    </div>
  );
}
