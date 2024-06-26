import { useState } from "react";

interface TextareaBoxProps {
  placeholder: string;
}

export default function TextareaBox({ placeholder }: TextareaBoxProps) {
  const [onFucus, setOnFocus] = useState(false);
  const [value, setValue] = useState("");

  const isInputFocused = value !== "" || onFucus;
  const inputStyle = isInputFocused ? { top: -10, zIndex: 1 } : {};

  return (
    <div className="services__section__content__right__form__input">
      <label
        className="services__section__content__right__form__input__label"
        style={inputStyle}
        htmlFor={placeholder}
      >
        {placeholder}
      </label>
      <textarea
        name={placeholder}
        value={value}
        onFocus={() => {
          setOnFocus(true);
        }}
        onBlur={() => {
          setOnFocus(false);
        }}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        id={placeholder}
        className="services__section__content__right__form__input__field services__section__content__right__form__input__field__textarea"
      />
    </div>
  );
}
