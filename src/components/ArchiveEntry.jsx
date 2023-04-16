import dayjs from "dayjs";

export default function ArchiveEntry({ repo }) {
    return (
        <div className="archive__container__content__entry">
            <div className="archive__container__content__entry__left">
                <a
                    target="_blank"
                    href={repo.html_url}
                    className="archive__container__content__entry__left__title"
                >
                    {repo.name.replace(/-/g, " ").replace(/_/g, " ").replace(".", " ")}
                </a>
                <div className="archive__container__content__entry__left__created__at">
                    {dayjs(repo.created_at).format("MMM D, YYYY")}
                </div>
                {repo.homepage && (
                    <a
                        href={repo.homepage}
                        target="_blank"
                        className="archive__container__content__entry__left__link"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="feather feather-globe"
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                        See Live
                    </a>
                )}
            </div>
            <div className="archive__container__content__entry__right">
                <div className="archive__container__content__entry__right__language">
                    {repo.language ? repo.language : "Html"}
                </div>
                <div className="archive__container__content__entry__right__description">
                    {repo.description
                        ? repo.description
                        : "Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem, fugit fugiat fuga omnis officia esse repudiandae ullam reiciendis maiores rerum provident totam, dicta accusamus quasi cupiditate harum nobis, aspernatur aperiam. Dolore, nesciunt doloremque consequatur obcaecati dicta blanditiis nisi unde magnam fuga ipsam ab alias distinctio molestiae veniam quam. Debitis, corporis."}
                </div>
            </div>
        </div>
    );
}
