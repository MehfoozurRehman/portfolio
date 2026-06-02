export default async () => {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  let allRepos = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(
      `https://api.github.com/user/repos?sort=updated&per_page=100&page=${page}&visibility=all`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      hasMore = false;
    } else {
      const filteredRepos = data.filter((repo) => !repo.fork);
      allRepos = [...allRepos, ...filteredRepos];
      page++;
    }
  }

  return allRepos;
};
