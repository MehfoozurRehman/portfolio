import { Link, NavLink } from "react-router-dom";

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
    <div className="container__dashbaord__sidebar">
      <Link to="/dashboard" className="container__dashbaord__sidebar__logo">
        <img
          src="/favicon.svg"
          alt="logo"
          className="container__dashbaord__sidebar__logo__img"
        />
        Mehfooz-ur-Rehman
      </Link>
      <div className="container__dashbaord__sidebar__content">
        {links.map((link,index) => (
          <NavLink
            className="container__dashbaord__sidebar__content__link"
            to={link.path}
            end={index === 0}
          >
            {link.name}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
