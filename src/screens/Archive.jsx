import ArchiveEntry from "../components/ArchiveEntry";
import fetcher from "../utils/fetcher";
import useSWR from "swr";

export default function Archive() {
  const { data: repos } = useSWR(
    "https://api.github.com/users/MehfoozurRehman/repos?sort=updated&per_page=1000",
    fetcher
  );

  return (
    <div className="archive__container">
      <div className="archive__container__heading">
        List of all the projects i have done
      </div>
      <div className="archive__container__content">
        {repos?.map((repo) => (
          <ArchiveEntry repo={repo} key={repo.id} />
        ))}
      </div>
    </div>
  );
}


