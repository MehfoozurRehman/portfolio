import useSWR, { preload } from "swr";

import type { GithubRepo, GithubUser } from "../types/github";
import {
  GITHUB_REPOS_KEY,
  GITHUB_USER_KEY,
  fetchRepos,
  fetchUser,
} from "../lib/github";

export function useGithubUser() {
  return useSWR<GithubUser>(GITHUB_USER_KEY, fetchUser);
}

export function useGithubRepos() {
  return useSWR<GithubRepo[]>(GITHUB_REPOS_KEY, fetchRepos);
}

export function preloadGithub() {
  preload(GITHUB_USER_KEY, fetchUser);
  preload(GITHUB_REPOS_KEY, fetchRepos);
}
