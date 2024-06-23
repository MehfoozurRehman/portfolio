import { useRouter } from "next/navigation";

interface NavLinkProps {
  scrollTo: string;
  label: string;
  defaultChecked?: boolean;
}

export default function NavLink({
  scrollTo,
  label,
  defaultChecked,
}: NavLinkProps) {
  const router = useRouter();

  return (
    <div className="header__content__nav__links__entry">
      <input
        id={scrollTo}
        type="radio"
        title={scrollTo}
        defaultChecked={defaultChecked}
        name="header__content__nav__links__entry"
        className="header__content__nav__links__entry__input"
        onClick={() => {
          router.push("/");
          const element = document.getElementById(scrollTo + "__section");
          if (element) {
            element.scrollIntoView();
          }
        }}
      />
      <div className="header__content__nav__links__entry__content">{label}</div>
    </div>
  );
}
