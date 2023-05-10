import "swiper/scss";
import "swiper/scss/autoplay";
import "./styles.scss";

import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { App } from "./App";
import Archive from "./screens/Archive";
import Home from "./screens/Home";
import Loading from "./components/Loading";
import { createRoot } from "react-dom/client";

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

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
