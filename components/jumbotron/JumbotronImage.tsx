"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

export function JumbotronImage() {
  const [radius, setRadius] = useState("33%");

  useEffect(() => {
    const interval = setInterval(() => {
      const horizontalRadius = `${Math.floor(Math.random() * 50) + 30}%`;
      const verticalRadius = `${Math.floor(Math.random() * 50) + 30}%`;
      const radiusString = `${horizontalRadius} ${verticalRadius}`;
      setRadius(radiusString);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Image
      fill
      className="jumbotron__bottom__center"
      src="/image.png"
      alt="mehfooz ur rehman"
      style={{
        width: "100%",
        height: "100%",
        transition: "all 1s ease",
        borderRadius: radius,
      }}
    />
  );
}
