import { IMaskInput } from "react-imask";

/**
 * Campo de telefone/WhatsApp com máscara brasileira (+55 (DD) 90000-0000).
 * Aceita props de `value`/`onChange` como um input controlado normal, para
 * minimizar mudanças nos formulários que já usavam <input type="tel">.
 *
 * O valor mascarado (com parênteses, hífen, etc.) é o que fica salvo -
 * o backend trata telefone como texto livre (Client.phone é STRING sem
 * validação de formato), então não há necessidade de "desmascarar" antes
 * de enviar.
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
