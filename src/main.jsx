import "./styles.scss";

import {
  Outlet,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";

import Archive from "./screens/Archive";
import Home from "./screens/Home";
import NotFound from "./screens/NotFound";
import React from "react";
import { createRoot } from "react-dom/client";
import Header from "./components/Header";

function Root() {
  return (
    <div className="container">
      <Header />
      <Outlet />
      <footer></footer>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/archive", element: <Archive /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);


