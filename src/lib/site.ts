import { profile } from '../data';

export const SITE_URL = 'https://mehfoozurrehmanv8.web.app';
export const SITE_NAME = profile.name;
export const DEFAULT_TITLE = 'Mehfooz-ur-Rehman | Full-stack Product Developer';
export const DEFAULT_DESCRIPTION = 'Portfolio of Mehfooz-ur-Rehman, a full-stack product developer building web, mobile, desktop and AI-powered business systems.';

export const personJsonLd = {
  '@type': 'Person',
  '@id': `${SITE_URL}/#person`,
  name: profile.name,
  jobTitle: profile.role,
  url: SITE_URL,
  image: `${SITE_URL}/og.png`,
  description: profile.headline,
  worksFor: { '@type': 'Organization', name: profile.company },
  address: { '@type': 'PostalAddress', addressLocality: 'Faisalabad', addressCountry: 'PK' },
  sameAs: [profile.github, profile.linkedin, profile.instagram, profile.codesandbox],
  knowsAbout: ['React', 'Next.js', 'React Native', 'TypeScript', 'Convex', 'AI agents', 'Electron'],
};
