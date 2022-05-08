import React, { useState } from "react";

export default function Textarea({ label, name, onChange }) {
  const [isFilled, setIfFilled] = useState("");
  return (
    <div className="contact__section__content__left__textarea">
      <label
        htmlFor={name}
        autoComplete="none"
        className="contact__section__content__left__input__label"
        style={isFilled === "" ? null : { top: -10 }}
      >
        {label}
      </label>
      <textarea
        className="contact__section__content__left__input__field"
        name={name}
        id={name}
        onChange={(e) => {
          setIfFilled(e.target.value);
          onChange(e.target.value);
        }}
      />
    </div>
  );
}
