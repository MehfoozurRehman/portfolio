import Image from "next/image";
import SplashSvg from "./SplashSvg";
import dayjs from "dayjs";

export default async function Jumbotron({ dataFromGithub }: any) {
  return (
    <section id="home" className="jumbotron">
      <div className="jumbotron__content">
        <div className="jumbotron__bottom__center">
          <SplashSvg />
          <Image
            fill
            className="jumbotron__bottom__center"
            src="/image.png"
            alt="mehfooz ur rehman"
            style={{
              width: "100%",
              height: "100%",
              transition: "all 1s ease",
            }}
          />
        </div>
        <div className="jumbotron__top__left">
          Let's Build You A Digital Identity
        </div>
        <div className="jumbotron__bottom__left">
          <span>+{dayjs().diff(dataFromGithub?.created_at, "year")}</span> Years
          <br />
          Experience
        </div>
        <div className="jumbotron__top__right">
          <div className="jumbotron__top__right__text">
            <div className="jumbotron__top__right__text__top">
              <span className="jumbotron__top__right__text__top__left">
                Hi, I'm
              </span>
              <span className="jumbotron__top__right__text__top__right">
                <span className="jumbotron__top__right__text__top__right__name">
                  Mehfooz-ur-Rehman
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="jumbotron__bottom__right">
          <div className="jumbotron__bottom__right__content">
            Hi there 👋, I'm Mehfooz-ur-Rehman, a Full Stack Developer 🚀 from
            Pakistan, currently, I'm a Software Engineer at{" "}
            <a href="https://www.10pearls.com/" target="_blank">
              {dataFromGithub?.company}
            </a>
          </div>
          <Image
            fill
            src={
              dataFromGithub?.avatar_url
                ? dataFromGithub?.avatar_url
                : "/image.png"
            }
            alt="mehfooz ur rehman"
          />
        </div>
      </div>
    </section>
  );
}
