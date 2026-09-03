import { IMaskInput } from "react-imask";

/**
 * Campo de telefone/WhatsApp com máscara brasileira (+55 (DD) 90000-0000).
 * Ver mesma implementação em belora-admin/src/components/PhoneInput.jsx -
 * duplicado aqui porque os dois frontends não compartilham código (projetos
 * separados, sem monorepo).
 */
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
