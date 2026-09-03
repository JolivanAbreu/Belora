import { describe, test, expect } from "vitest";
import {
  toDateParam,
  formatTime,
  minutesSinceLocalMidnight,
  isToday,
} from "./format";

describe("formatTime", () => {
  test("formata um instante UTC no fuso do tenant (America/Fortaleza, UTC-3)", () => {
    // 12:00 UTC = 09:00 em Fortaleza
    expect(formatTime("2026-08-24T12:00:00.000Z", "America/Fortaleza")).toBe("09:00");
  });

  test("o mesmo instante formatado em fusos diferentes dá resultados diferentes", () => {
    const iso = "2026-08-24T12:00:00.000Z";
    expect(formatTime(iso, "America/Fortaleza")).toBe("09:00");
    expect(formatTime(iso, "UTC")).toBe("12:00");
  });
});

describe("minutesSinceLocalMidnight", () => {
  test("09:00 local (12:00 UTC) é 540 minutos após a meia-noite local", () => {
    const minutes = minutesSinceLocalMidnight(
      "2026-08-24T12:00:00.000Z",
      "2026-08-24",
      "America/Fortaleza"
    );
    expect(minutes).toBe(9 * 60);
  });

  test("meia-noite local é 0 minutos", () => {
    // 00:00 em Fortaleza (UTC-3) = 03:00 UTC
    const minutes = minutesSinceLocalMidnight(
      "2026-08-24T03:00:00.000Z",
      "2026-08-24",
      "America/Fortaleza"
    );
    expect(minutes).toBe(0);
  });
});

describe("toDateParam", () => {
  test("formata uma data no padrão yyyy-MM-dd", () => {
    const date = new Date(2026, 7, 24); // 24 de agosto de 2026 (mês 0-indexado)
    expect(toDateParam(date)).toBe("2026-08-24");
  });
});

describe("isToday", () => {
  test("retorna true para a data de hoje", () => {
    expect(isToday(new Date())).toBe(true);
  });

  test("retorna false para uma data no passado", () => {
    expect(isToday(new Date(2020, 0, 1))).toBe(false);
  });
});
