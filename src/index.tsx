import "swiper/scss";
import "./styles.scss";

import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";

import Archive from "./screens/Archive";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Home from "./screens/Home";
import Loading from "./components/Loading";
import { Outlet } from "react-router-dom";
import Socials from "./components/Socials";
import { createRoot } from "react-dom/client";

function App() {
  const [showFooter, setShowFooter] = useState(false);
  useEffect(() => {
    if (window.location.pathname === "/") {
      setShowFooter(true);
    } else {
      setShowFooter(false);
    }
  }, []);

  return (
    <Suspense fallback={<Loading />}>
      <div className="App">
        <Socials />
        <Header />
        <Outlet />
      </div>
      {showFooter ? <Footer /> : null}
    </Suspense>
  );
}

function Routes() {
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
          ],
        },
      ])}
    />
  );
}

createRoot(document.getElementById("root")).render(<Routes />);
