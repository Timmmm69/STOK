import { describe, expect, it } from "vitest";
import {
  categoryKey,
  formatPrice,
  INITIAL_CATEGORIES,
  INITIAL_PRICES,
  normalizeSpaces,
  parsePriceInput,
  validateCategoryName,
  validatePrice,
} from "./model.js";

describe("правила категорий", () => {
  it("нормализует регистр и лишние пробелы", () => {
    expect(normalizeSpaces("  Женская   одежда ")).toBe("Женская одежда");
    expect(categoryKey(" ЖЕНСКАЯ одежда ")).toBe("женская одежда");
  });

  it("не разрешает активный дубль", () => {
    expect(validateCategoryName(" женская   ОДЕЖДА ", INITIAL_CATEGORIES)).toBe(
      "Такая категория уже есть.",
    );
  });

  it("направляет к восстановлению архивного дубля", () => {
    const categories = [{ id: "archived", name: "Детское", archived: true }];
    expect(validateCategoryName("детское", categories)).toBe(
      "Такая категория уже есть в архиве. Восстановите её.",
    );
  });
});

describe("правила цен", () => {
  it("переводит BYN в целые копейки", () => {
    expect(parsePriceInput("15,20")).toEqual({ kopecks: 1520, error: null });
    expect(parsePriceInput("0").error).toBe("Сумма должна быть больше нуля.");
    expect(parsePriceInput("12,345").error).toBe("Введите сумму в формате 15,00.");
  });

  it("не разрешает повтор суммы", () => {
    expect(validatePrice("15", INITIAL_PRICES).error).toBe("Такая сумма уже есть.");
  });

  it("показывает сумму в BYN", () => {
    expect(formatPrice(1520)).toBe("15,20 BYN");
  });
});
