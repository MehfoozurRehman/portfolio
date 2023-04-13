import { Suspense, lazy } from "react";
import Loading from "./components/Loading";
import { Outlet, useLocation } from "react-router-dom";
import { Server } from "react-feather";
import Footer from "./components/Footer";
import { useIsOnline } from "react-use-is-online";

const Socials = lazy(() => import("./components/Socials"));
const Header = lazy(() => import("./components/Header"));

export function App() {
  const location = useLocation();
  const { isOnline } = useIsOnline();

  return (
    <>
      {isOnline ? (
        <Suspense fallback={<Loading />}>
          <div className="App">
            <Socials />
            <Header />
            <Outlet />
            {location.pathname === "/" && <Footer />}
          </div>
        </Suspense>
      ) : (
        <div className="offline">
          <Server size={40} color="#64ffda" />
          <div className="offline__heading">Oops! You are offline</div>
        </div>
      )}
    </>
  );
}
