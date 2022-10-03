export const mdxFetcher = (...args) => fetch(...args).then((res) => res.text());
