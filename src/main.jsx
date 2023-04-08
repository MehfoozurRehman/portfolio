import "./style.scss";

import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";

import Archive from "./screens/Archive";
import Category from "./screens/Category";
import Clients from "./screens/Clients";
import Contact from "./screens/Contact";
import Content from "./screens/Content";
import DashboardHome from "./screens/Dashboard";
import Experience from "./screens/Experience";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Home from "./screens/Home";
import NotFound from "./screens/NotFound";
import Projects from "./screens/Projects";
import Sidebar from "./components/Sidebar";
import Testimonials from "./screens/Testimonials";
import { createRoot } from "react-dom/client";

function Root() {
  return (
    <div className="container">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}

function Dashboard() {
  return (
    <div className="container__dashbaord">
      <Sidebar />
      <div className="container__dashbaord__main">
        <Outlet />
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        path: "",
        Component: Home,
      },
      {
        path: "archive",
        Component: Archive,
      },
    ],
  },
  {
    path: "/dashboard",
    Component: Dashboard,
    children: [
      {
        path: "",
        Component: DashboardHome,
      },
      {
        path: "projects",
        Component: Projects,
      },
      {
        path: "experience",
        Component: Experience,
      },
      {
        path: "testimonials",
        Component: Testimonials,
      },
      {
        path: "content",
        Component: Content,
      },
      {
        path: "clients",
        Component: Clients,
      },
      {
        path: "category",
        Component: Category,
      },
      {
        path: "contact",
        Component: Contact,
      },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
