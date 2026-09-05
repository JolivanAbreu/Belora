import { IMaskInput } from "react-imask";

// Campo de telefone com máscara brasileira. O valor mascarado é o que fica
// salvo: o backend trata telefone como texto livre.
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
