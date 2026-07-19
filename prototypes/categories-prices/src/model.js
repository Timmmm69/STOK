export const INITIAL_CATEGORIES = [
  { id: "category-women", name: "Женская одежда", archived: false },
  { id: "category-men", name: "Мужская одежда", archived: false },
  { id: "category-shoes", name: "Обувь", archived: false },
  { id: "category-accessories", name: "Аксессуары", archived: false },
];

export const INITIAL_PRICES = [500, 1000, 1500, 2000, 2500].map((kopecks) => ({
  id: `price-${kopecks}`,
  kopecks,
  archived: false,
}));

export function normalizeSpaces(value) {
  return value.trim().replace(/\s+/g, " ");
}

export function categoryKey(value) {
  return normalizeSpaces(value).toLocaleLowerCase("ru");
}

export function validateCategoryName(value, categories, currentId = null) {
  const normalized = normalizeSpaces(value);

  if (!normalized) return "Введите название категории.";
  if (normalized.length > 80) return "Название должно быть не длиннее 80 символов.";

  const duplicate = categories.find(
    (category) =>
      category.id !== currentId && categoryKey(category.name) === categoryKey(normalized),
  );

  if (duplicate?.archived) return "Такая категория уже есть в архиве. Восстановите её.";
  if (duplicate) return "Такая категория уже есть.";

  return null;
}

export function parsePriceInput(value) {
  const normalized = value.trim().replace(",", ".");

  if (!normalized) return { kopecks: null, error: "Введите сумму." };
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return { kopecks: null, error: "Введите сумму в формате 15,00." };
  }

  const kopecks = Math.round(Number(normalized) * 100);
  if (!Number.isSafeInteger(kopecks) || kopecks <= 0) {
    return { kopecks: null, error: "Сумма должна быть больше нуля." };
  }
  if (kopecks > 9_999_999) {
    return { kopecks: null, error: "Сумма слишком большая для ценовой заготовки." };
  }

  return { kopecks, error: null };
}

export function validatePrice(value, prices, currentId = null) {
  const parsed = parsePriceInput(value);
  if (parsed.error) return parsed;

  const duplicate = prices.find(
    (price) => price.id !== currentId && price.kopecks === parsed.kopecks,
  );

  if (duplicate?.archived) {
    return {
      kopecks: parsed.kopecks,
      error: "Такая сумма уже есть в архиве. Восстановите её.",
    };
  }
  if (duplicate) {
    return { kopecks: parsed.kopecks, error: "Такая сумма уже есть." };
  }

  return parsed;
}

export function formatPrice(kopecks) {
  const formatted = new Intl.NumberFormat("ru-BY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(kopecks / 100)
    .replace(/\u00a0/g, " ");

  return `${formatted} BYN`;
}

export function categoryFormValue(category) {
  return category?.name ?? "";
}

export function priceFormValue(price) {
  if (!price) return "";
  return (price.kopecks / 100).toFixed(2).replace(".", ",");
}
