import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressSteps from "./ProgressSteps";

describe("ProgressSteps", () => {
  test("marca o passo atual e os anteriores como ativos (fundo escuro)", () => {
    render(<ProgressSteps current="datetime" />);

    const stepNumbers = screen.getAllByText(/^[123]$/);
    expect(stepNumbers).toHaveLength(3);

    // "datetime" é o 2º passo (índice 1): passos 1 e 2 ativos, passo 3 não
    expect(stepNumbers[0].className).toContain("bg-(--color-ink)");
    expect(stepNumbers[1].className).toContain("bg-(--color-ink)");
    expect(stepNumbers[2].className).toContain("bg-(--color-line)");
  });

  test("mostra o rótulo de cada etapa", () => {
    render(<ProgressSteps current="service" />);
    expect(screen.getByText("Serviço")).toBeInTheDocument();
    expect(screen.getByText("Horário")).toBeInTheDocument();
    expect(screen.getByText("Seus dados")).toBeInTheDocument();
  });
});
