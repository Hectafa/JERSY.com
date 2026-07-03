import "./ErrorMessage.css";

export default function ErrorMessage({ children, "data-testid": testId }) {
  return (
    <div className="error-message" data-testid={testId || "error-message"}>
      {children}
    </div>
  );
}
