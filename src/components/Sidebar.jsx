import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const links = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Projects", path: "/dashboard/projects" },
    { name: "Experience", path: "/dashboard/experience" },
    { name: "Testimonials", path: "/dashboard/testimonials" },
    { name: "Content", path: "/dashboard/content" },
    { name: "Clients", path: "/dashboard/clients" },
    { name: "Category", path: "/dashboard/category" },
    { name: "Contact", path: "/dashboard/contact" },
  ];
  return (
    <div>
      Sidebar
      {links.map((link) => (
        <NavLink to={link.path}>{link.name}</NavLink>
      ))}
    </div>
  );
}
