import { RouterProvider, createBrowserRouter } from "react-router-dom";

import App from "./App";
import Home from "./screens/Home";
import ProjectDetails from "./screens/ProjectDetails";
import { lazy } from "react";

const Archive = lazy(() => import("./screens/Archive"));

export default function Routes() {
  return (
    <RouterProvider
      router={createBrowserRouter([
        {
          path: "/",
          element: <App />,
          children: [
            {
              path: "/",
              element: <Home />,
            },
            {
              path: "/archive",
              element: <Archive />,
            },
            {
              path: "/details/:id",
              element: <ProjectDetails />,
            },
          ],
        },
      ])}
    />
  );
}
