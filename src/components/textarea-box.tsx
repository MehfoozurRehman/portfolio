import { useState } from "react";

interface TextareaBoxProps {
  placeholder: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

export default function TextareaBox({
  placeholder,
  name,
  value: externalValue,
  onChange: externalOnChange,
  disabled = false,
}: TextareaBoxProps) {
  const [onFucus, setOnFocus] = useState(false);
  const [internalValue, setInternalValue] = useState("");

  const isControlled = externalValue !== undefined;
  const value = isControlled ? externalValue : internalValue;

  const isInputFocused = value !== "" || onFucus;
  const inputStyle = isInputFocused ? { top: -10, zIndex: 1 } : null;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    externalOnChange?.(e);
  };

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
        name={name}
        value={value}
        disabled={disabled}
        onFocus={() => {
          setOnFocus(true);
        }}
        onBlur={() => {
          setOnFocus(false);
        }}
        onChange={handleChange}
        id={placeholder}
        className="services__section__content__right__form__input__field services__section__content__right__form__input__field__textarea"
      />
    </div>
  );
}
