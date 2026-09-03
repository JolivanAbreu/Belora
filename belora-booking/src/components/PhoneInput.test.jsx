import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhoneInput from "./PhoneInput";

describe("PhoneInput (booking page)", () => {
  test("formata dígitos digitados no padrão +55 (DD) 90000-0000", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<PhoneInput value="" onChange={handleChange} placeholder="telefone" />);

    const input = screen.getByPlaceholderText("telefone");
    await user.type(input, "85999998888");

    const lastCallValue = handleChange.mock.calls.at(-1)[0];
    expect(lastCallValue).toBe("+55 (85) 99999-8888");
  });
});
