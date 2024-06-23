interface FooterLinkProps {
  title: string;
  scrollTo: string;
}
function FooterLink({ title, scrollTo }: FooterLinkProps) {
  return (
    <button
      onClick={() => {
        const sectionElement = document.getElementById(scrollTo + "__section");
        const checkboxElement = document.getElementById(
          scrollTo
        ) as HTMLInputElement;
        if (sectionElement) {
          sectionElement.scrollIntoView();
        }
        if (checkboxElement) {
          checkboxElement.checked = true;
        }
      }}
      title={scrollTo}
      className="footer__content__row__link"
    >
      {title}
    </button>
  );
}
