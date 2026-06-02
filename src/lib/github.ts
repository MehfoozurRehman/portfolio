import type { GithubRepo, GithubUser } from "../types/github";

export const GITHUB_USERNAME = "MehfoozurRehman";
export const GITHUB_API = "https://api.github.com";

export const GITHUB_USER_KEY = "github-user";
export const GITHUB_REPOS_KEY = "github-repos";

async function githubFetch<T>(path: string): Promise<T> {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`GitHub request failed (${res.status}): ${path}`);
  }

  return res.json() as Promise<T>;
}

export function fetchUser(): Promise<GithubUser> {
  return githubFetch<GithubUser>(`/users/${GITHUB_USERNAME}`);
}

export async function fetchRepos(): Promise<GithubRepo[]> {
  const repos: GithubRepo[] = [];
  let page = 1;

  while (true) {
    const data = await githubFetch<GithubRepo[]>(
      `/user/repos?sort=updated&per_page=100&page=${page}&visibility=all`,
    );

    if (!Array.isArray(data) || data.length === 0) break;

    repos.push(...data.filter((repo) => !repo.fork));
    page++;
  }

  return repos;
}
