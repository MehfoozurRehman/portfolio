console.log(process.env.NEXT_PUBLIC_GITHUB_TOKEN);

export default (args: any) =>
  fetch(args, {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
    },
  }).then((res) => res.json());
