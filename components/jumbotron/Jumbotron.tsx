import { JumbotronImage } from "./JumbotronImage";
import dayjs from "dayjs";

export default async function Jumbotron({ dataFromGithub }: any) {
  return (
    <section id="home" className="jumbotron">
      <div className="jumbotron__content">
        <JumbotronImage />
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
        <div className="jumbotron__bottom__right"></div>
      </div>
    </section>
  );
}
