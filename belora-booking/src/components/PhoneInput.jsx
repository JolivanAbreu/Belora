import { IMaskInput } from "react-imask";

// Campo de telefone com máscara brasileira.
// Duplicado do belora-admin: os projetos não compartilham código.
export default function PhoneInput({ value, onChange, className, required, placeholder }) {
  return (
    <IMaskInput
      mask="+55 (00) 00000-0000"
      value={value}
      unmask={false}
      onAccept={(val) => onChange(val)}
      type="tel"
      inputMode="numeric"
      required={required}
      placeholder={placeholder || "+55 (85) 90000-0000"}
      className={className}
    />
  );
}
