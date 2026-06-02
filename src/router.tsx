import Archive from "./screens/archive";
import Home from "./screens/home";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { SWRConfig } from "swr";
import Root from "./root";
import { preloadGithub } from "./hooks/use-github";
import { localStorageProvider } from "./lib/swr-cache";

preloadGithub();

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/archive", element: <Archive /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <SWRConfig
    value={{
      provider: localStorageProvider,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      keepPreviousData: true,
    }}
  >
    <RouterProvider router={router} />
  </SWRConfig>,
);
