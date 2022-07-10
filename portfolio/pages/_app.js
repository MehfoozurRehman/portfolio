import { Suspense, useState } from "react";
import Loading from "../components/Loading";
import dynamic from "next/dynamic";
import Head from "next/head";
import "../styles/globals.scss";
import "swiper/scss";

const Socials = dynamic(() => import("../components/Socials"), {
  suspense: true,
});
const Header = dynamic(() => import("../components/Header"), {
  suspense: true,
});
const Footer = dynamic(() => import("../components/Footer"), {
  suspense: true,
});

export default function App({ Component, pageProps }) {
  const [showFooter, setShowFooter] = useState(false);

  return (
    <>
      <Head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Mehfooz-ur-Rehman" />
        <title>Mehfooz-ur-Rehman</title>
      </Head>
      <Suspense fallback={<Loading />}>
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
