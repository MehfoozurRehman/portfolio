import "swiper/scss";
import "swiper/scss/autoplay";
import "./styles.scss";

import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { createRoot, hydrateRoot } from "react-dom/client";

import { App } from "./App";
import Loading from "./components/Loading";
import { lazy } from "react";

const Home = lazy(() => import("./screens/Home"));
const Archive = lazy(() => import("./screens/Archive"));

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    errorElement: <Loading />,
    children: [
      {
        path: "/",
        Component: Home,
      },
      {
        path: "/archive",
        Component: Archive,
      },
    ],
  },
]);

const rootElement = document.getElementById("root");

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, <RouterProvider router={router} />);
} else {
  createRoot(document.getElementById("root")).render(
    <RouterProvider router={router} />
  );
}
