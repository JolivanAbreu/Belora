import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhoneInput from "./PhoneInput";

describe("PhoneInput", () => {
  test("formata dígitos digitados no padrão +55 (DD) 90000-0000", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    function Wrapper() {
      return <PhoneInput value="" onChange={handleChange} placeholder="telefone" />;
    }
    render(<Wrapper />);

    const input = screen.getByPlaceholderText("telefone");
    await user.type(input, "85999998888");

    // onChange é chamado a cada dígito aceito - o último valor deve estar
    // completamente formatado.
    const lastCallValue = handleChange.mock.calls.at(-1)[0];
    expect(lastCallValue).toBe("+55 (85) 99999-8888");
  });

  test("usa o placeholder padrão quando nenhum é informado", () => {
    render(<PhoneInput value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText("+55 (85) 90000-0000")).toBeInTheDocument();
  });
});
