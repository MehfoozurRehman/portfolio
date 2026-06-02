import { useState } from "react";

interface InputBoxProps {
  placeholder: string;
  type: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export default function InputBox({
  placeholder,
  type,
  name,
  value: externalValue,
  onChange: externalOnChange,
  disabled = false,
  ...props
}: InputBoxProps) {
  const [onFucus, setOnFocus] = useState(false);
  const [internalValue, setInternalValue] = useState("");

  const isControlled = externalValue !== undefined;
  const value = isControlled ? externalValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    externalOnChange?.(e);
  };

  return (
    <div className="services__section__content__right__form__input">
      <label
        className="services__section__content__right__form__input__label"
        style={
          value !== ""
            ? { top: -10, zIndex: 1 }
            : onFucus
              ? { top: -10, zIndex: 1 }
              : null
        }
        htmlFor={placeholder}
      >
        {placeholder}
      </label>
      <input
        name={name}
        type={type}
        id={placeholder}
        value={value}
        disabled={disabled}
        onFocus={() => {
          setOnFocus(true);
        }}
        onBlur={() => {
          setOnFocus(false);
        }}
        onChange={handleChange}
        className="services__section__content__right__form__input__field"
        {...props}
      />
    </div>
  );
}
