export interface GithubRepo {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  homepage: string | null;
  fork: boolean;
}

export interface GithubUser {
  login: string;
  created_at: string;
  public_repos: number;
  total_private_repos: number;
}
