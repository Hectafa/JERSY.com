import "./Input.css";

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  disabled = false,
  className = "",
  id,
  ...rest
}) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="input-field"
        {...rest}
      />
    </div>
  );
}
