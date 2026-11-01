// Refreshes src/data/github.json (contribution calendar and public repositories) before each build,
// so the GitHub Garden grows with real activity. If GitHub cannot be reached, the existing file is kept.
import fs from 'node:fs';
import path from 'node:path';

const USER = 'MehfoozurRehman';
const out = path.resolve(import.meta.dirname, '../src/data/github.json');

async function getJSON(url) {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'launch-isles-build' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

try {
  const [contrib, repos, user] = await Promise.all([
    getJSON(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`),
    getJSON(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`),
    getJSON(`https://api.github.com/users/${USER}`),
  ]);
  const data = {
    user: { login: user.login, name: user.name, publicRepos: user.public_repos, followers: user.followers, since: user.created_at?.slice(0, 10) },
    total: contrib.total,
    days: contrib.contributions.map((d) => [d.date, d.count, d.level]),
    repos: repos.filter((r) => !r.fork).map((r) => ({ name: r.name, description: r.description, language: r.language, stars: r.stargazers_count, url: r.html_url, pushed: r.pushed_at?.slice(0, 10) })),
    fetchedAt: new Date().toISOString().slice(0, 10),
  };
  if (!data.days.length) throw new Error('empty contribution calendar');
  fs.writeFileSync(out, JSON.stringify(data));
  console.log(`github.json updated: ${data.days.length} days, ${data.repos.length} repos`);
} catch (e) {
  console.warn(`GitHub data not refreshed (${e.message}); keeping the existing file.`);
}
