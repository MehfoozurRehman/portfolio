"use client";

import "react-indiana-drag-scroll/dist/style.css";

import { ScrollContainer } from "react-indiana-drag-scroll";

export function WorkSlider({}) {
  return (
    <ScrollContainer className="work__content__slider">
      <div className="work__content__slider__entry"></div>
    </ScrollContainer>
  );
}
