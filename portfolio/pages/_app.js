import { Suspense, useState } from "react";
import Head from "next/head";
import Loading from "../components/Loading";
import Socials from "../components/Socials";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/globals.scss";
import "swiper/scss";
import logo from "../assets/logo.svg";

export default function App({ Component, pageProps }) {
  const [showFooter, setShowFooter] = useState(false);

  return (
    <>
      <Suspense fallback={<Loading />}>
        <Head>
          <meta charSet="utf-8" />
          <link rel="icon" href={logo} />
          <link rel="apple-touch-icon" href={logo} />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content="Mehfooz-ur-Rehman" />
          <title>Mehfooz-ur-Rehman</title>
        </Head>
        <div className="App">
          <Socials />
          <Header />
          <Component {...pageProps} setShowFooter={setShowFooter} />
        </div>
        {showFooter ? <Footer /> : null}
      </Suspense>
    </>
  );
}
