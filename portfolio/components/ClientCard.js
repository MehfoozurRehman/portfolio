import Image from "next/future/image";

export default function ClientCard({ image, url }) {
  return (
    <a
      href={url}
      className="card"
      style={{
        minWidth: "fit-content",
        minHeight: 100,
      }}
    >
      <Image
        src={image}
        alt={url}
        className="card__img"
        loading="lazy"
        width={100}
        height={50}
      />
    </a>
  );
}
