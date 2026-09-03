import { describe, test, expect } from "vitest";
import {
  toDateParam,
  formatTime,
  formatWeekdayShort,
  nextDays,
  isSameCalendarDay,
} from "./format";

describe("formatTime", () => {
  test("formata no fuso do TENANT, não no fuso de quem está olhando", () => {
    // 12:00 UTC = 09:00 em Fortaleza, mas 12:00 em UTC puro
    const iso = "2026-08-24T12:00:00.000Z";
    expect(formatTime(iso, "America/Fortaleza")).toBe("09:00");
    expect(formatTime(iso, "UTC")).toBe("12:00");
  });
});

describe("toDateParam", () => {
  test("formata no padrão yyyy-MM-dd", () => {
    const date = new Date(2026, 7, 24);
    expect(toDateParam(date)).toBe("2026-08-24");
  });
});

describe("nextDays", () => {
  test("retorna a quantidade certa de dias, começando hoje", () => {
    const days = nextDays(7);
    expect(days).toHaveLength(7);
    expect(toDateParam(days[0])).toBe(toDateParam(new Date()));
  });
});

describe("formatWeekdayShort", () => {
  test("capitaliza a primeira letra e remove o ponto final", () => {
    const monday = new Date(2026, 7, 24); // 24 de agosto de 2026 é uma segunda-feira
    const label = formatWeekdayShort(monday);
    expect(label[0]).toBe(label[0].toUpperCase());
    expect(label.endsWith(".")).toBe(false);
  });
});

describe("isSameCalendarDay", () => {
  test("mesma data, horas diferentes, ainda é o mesmo dia", () => {
    const a = new Date(2026, 7, 24, 8, 0);
    const b = new Date(2026, 7, 24, 23, 0);
    expect(isSameCalendarDay(a, b)).toBe(true);
  });

  test("dias diferentes retornam false", () => {
    const a = new Date(2026, 7, 24);
    const b = new Date(2026, 7, 25);
    expect(isSameCalendarDay(a, b)).toBe(false);
  });
});
