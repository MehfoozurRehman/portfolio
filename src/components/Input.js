import React, { useState } from "react";

export default function Input({ label, type, name, onChange }) {
  const [isFilled, setIfFilled] = useState("");
  return (
    <div className="contact__section__content__left__input">
      <label
        htmlFor={name}
        autoComplete="none"
        className="contact__section__content__left__input__label"
        style={isFilled === "" ? null : { top: -10, zIndex: 10 }}
      >
        {label}
      </label>
      <input
        type={type}
        name={name}
        id={name}
        onChange={(e) => {
          setIfFilled(e.target.value);
          onChange(e.target.value);
        }}
        className="contact__section__content__left__input__field"
      />
    </div>
  );
}
