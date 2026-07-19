import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconArchive,
  IconArrowLeft,
  IconCheck,
  IconChevronRight,
  IconClipboardText,
  IconFlask,
  IconGripVertical,
  IconMenu2,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconRestore,
  IconSettings,
  IconShoppingBag,
  IconTag,
  IconX,
} from "@tabler/icons-react";
import {
  categoryFormValue,
  formatPrice,
  INITIAL_CATEGORIES,
  INITIAL_PRICES,
  normalizeSpaces,
  priceFormValue,
  validateCategoryName,
  validatePrice,
} from "./model.js";

const WORKSPACES = [
  {
    id: "intake",
    label: "Приёмка",
    icon: IconShoppingBag,
    title: "Путь приёмки",
    description: "От поставщика и партии до готовой к продаже вещи.",
    steps: [
      ["Поставщики и партии", "Создать черновик партии и записать её стоимость."],
      ["Массовое создание вещей", "Выбрать категорию, цену и количество."],
      ["Этикетки", "Напечатать, допечатать и сверить этикетки."],
      ["Активация", "Подтвердить фактическое количество и открыть товар для продажи."],
    ],
  },
  {
    id: "sales",
    label: "Продажа",
    icon: IconTag,
    title: "Путь продажи",
    description: "Быстро провести вещь от сканирования до подтверждённой оплаты.",
    steps: [
      ["Корзина и сканирование", "Собрать продажу и не допустить повторный скан."],
      ["Наличные", "Принять сумму и рассчитать сдачу."],
      ["Карта", "Дождаться терминала и подтвердить результат."],
      ["Восстановление кода", "Найти вещь по короткому номеру или создать исключение."],
    ],
  },
  {
    id: "control",
    label: "Контроль",
    icon: IconClipboardText,
    title: "Контроль магазина",
    description: "Разобрать остаток, смену и операции, требующие внимания.",
    steps: [
      ["Остаток", "Проверить, какие вещи доступны к продаже."],
      ["Смены", "Открыть работу и сверить деньги при закрытии."],
      ["Исключения", "Исправить продажу без кода или расхождение."],
      ["Журнал операций", "Увидеть подтверждённую историю действий."],
    ],
  },
  {
    id: "settings",
    label: "Настройки",
    icon: IconSettings,
    title: "Категории и цены",
    description: "Подготовить короткие списки для быстрой приёмки вещей.",
    steps: [],
  },
];

let sequence = 0;

function nextId(prefix) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

function Navigation({ activeWorkspace, onNavigate, mobileOpen, onCloseMobile, onOpenScenarios }) {
  return (
    <>
      <button
        className={`nav-scrim ${mobileOpen ? "is-visible" : ""}`}
        aria-label="Закрыть меню"
        onClick={onCloseMobile}
      />
      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`} aria-label="Основная навигация">
        <div className="brand-row">
          <div className="brand">«Лучок»</div>
          <button
            className="icon-button mobile-only"
            onClick={onCloseMobile}
            aria-label="Закрыть меню"
          >
            <IconX aria-hidden="true" />
          </button>
        </div>

        <nav className="workspace-nav">
          {WORKSPACES.map((workspace) => {
            const Icon = workspace.icon;
            return (
              <button
                key={workspace.id}
                className={`nav-item ${activeWorkspace === workspace.id ? "is-active" : ""}`}
                onClick={() => onNavigate(workspace.id)}
                aria-current={activeWorkspace === workspace.id ? "page" : undefined}
              >
                <Icon stroke={1.8} aria-hidden="true" />
                <span>{workspace.label}</span>
              </button>
            );
          })}
        </nav>

        <button className="scenario-entry" onClick={onOpenScenarios}>
          <IconFlask stroke={1.8} aria-hidden="true" />
          <span>Сценарии макета</span>
        </button>
      </aside>
    </>
  );
}

function MobileHeader({ onOpenMenu }) {
  return (
    <header className="mobile-header">
      <button className="icon-button" onClick={onOpenMenu} aria-label="Открыть меню">
        <IconMenu2 aria-hidden="true" />
      </button>
      <span>«Лучок»</span>
      <span className="prototype-mark">Макет</span>
    </header>
  );
}

function EmptyState({ kind, onCreate, archived = false, onBack }) {
  if (archived) {
    return (
      <div className={`empty-state empty-state-${kind}`}>
        <p className="empty-title">В архиве ничего нет</p>
        <p>
          {kind === "category"
            ? "Архивированные категории появятся здесь и их можно будет восстановить."
            : "Архивированные суммы появятся здесь и их можно будет восстановить."}
        </p>
        <button className="text-action" onClick={onBack}>
          <IconArrowLeft aria-hidden="true" />К активным
        </button>
      </div>
    );
  }

  return (
    <div className={`empty-state empty-state-${kind}`}>
      <p className="empty-title">{kind === "category" ? "Категорий пока нет" : "Цен пока нет"}</p>
      <p>
        {kind === "category"
          ? "Создайте первую категорию — она появится в этом списке."
          : "Добавьте часто используемую сумму в BYN."}
      </p>
      <button className="text-action" onClick={onCreate}>
        <IconPlus aria-hidden="true" />
        {kind === "category" ? "Создать категорию" : "Создать цену"}
      </button>
    </div>
  );
}

function CategoryWorkspace({
  categories,
  prices,
  showArchivedCategories,
  showArchivedPrices,
  onToggleCategoryArchive,
  onTogglePriceArchive,
  onCreateCategory,
  onCreatePrice,
  onEditCategory,
  onEditPrice,
  onArchiveCategory,
  onArchivePrice,
  onRestoreCategory,
  onRestorePrice,
}) {
  const visibleCategories = categories.filter(
    (category) => category.archived === showArchivedCategories,
  );
  const visiblePrices = prices
    .filter((price) => price.archived === showArchivedPrices)
    .sort((left, right) => left.kopecks - right.kopecks);
  const archivedCategoryCount = categories.filter((category) => category.archived).length;
  const archivedPriceCount = prices.filter((price) => price.archived).length;

  return (
    <main className="catalog-page" id="main-content">
      <section className="category-area" aria-labelledby="catalog-heading">
        <header className="page-heading">
          <h1 id="catalog-heading">Категории и цены</h1>
        </header>

        <div className="section-actions">
          <button className="primary-button" onClick={onCreateCategory}>
            <IconPlus aria-hidden="true" />
            Создать категорию
          </button>
          <button className="quiet-button" onClick={onToggleCategoryArchive}>
            {showArchivedCategories ? (
              <IconArrowLeft aria-hidden="true" />
            ) : (
              <IconArchive aria-hidden="true" />
            )}
            {showArchivedCategories
              ? "К активным"
              : `Архив${archivedCategoryCount ? ` (${archivedCategoryCount})` : ""}`}
          </button>
        </div>

        <div
          className="category-table"
          role="table"
          aria-label={showArchivedCategories ? "Архив категорий" : "Активные категории"}
        >
          <div className="category-table-head" role="row">
            <span role="columnheader">Категория</span>
            <span role="columnheader">Статус</span>
            <span role="columnheader">Действия</span>
          </div>

          {visibleCategories.length === 0 ? (
            <EmptyState
              kind="category"
              archived={showArchivedCategories}
              onBack={onToggleCategoryArchive}
              onCreate={onCreateCategory}
            />
          ) : (
            visibleCategories.map((category, index) => (
              <div
                className={`category-row ${index === 1 && !showArchivedCategories ? "is-highlighted" : ""}`}
                role="row"
                key={category.id}
              >
                <span className="category-name" role="cell">
                  <IconGripVertical className="grip" stroke={1.8} aria-hidden="true" />
                  <strong>{category.name}</strong>
                </span>
                <span role="cell">
                  <span className={`status-pill ${category.archived ? "status-archived" : ""}`}>
                    {category.archived ? "В архиве" : "Активна"}
                  </span>
                </span>
                <span className="row-actions" role="cell">
                  {category.archived ? (
                    <button onClick={() => onRestoreCategory(category)}>
                      <IconRestore aria-hidden="true" />
                      Восстановить
                    </button>
                  ) : (
                    <>
                      <button onClick={() => onEditCategory(category)}>
                        <IconPencil aria-hidden="true" />
                        Изменить
                      </button>
                      <span className="action-divider" aria-hidden="true" />
                      <button onClick={() => onArchiveCategory(category)}>
                        <IconArchive aria-hidden="true" />В архив
                      </button>
                    </>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <aside className="price-area" aria-labelledby="price-heading">
        <header className="price-heading">
          <h2 id="price-heading">Ценовые заготовки (BYN)</h2>
          <button className="primary-button price-create" onClick={onCreatePrice}>
            <IconPlus aria-hidden="true" />
            Создать цену
          </button>
        </header>

        <button className="archive-switch" onClick={onTogglePriceArchive}>
          {showArchivedPrices
            ? "Показать активные"
            : `Показать архив${archivedPriceCount ? ` (${archivedPriceCount})` : ""}`}
        </button>

        <div className="price-list" aria-label={showArchivedPrices ? "Архив цен" : "Активные цены"}>
          {visiblePrices.length === 0 ? (
            <EmptyState
              kind="price"
              archived={showArchivedPrices}
              onBack={onTogglePriceArchive}
              onCreate={onCreatePrice}
            />
          ) : (
            visiblePrices.map((price) => (
              <div className="price-row" key={price.id}>
                <span className="price-value">
                  <IconGripVertical className="grip" stroke={1.8} aria-hidden="true" />
                  {formatPrice(price.kopecks)}
                </span>
                <span className="price-actions">
                  {price.archived ? (
                    <button
                      onClick={() => onRestorePrice(price)}
                      aria-label={`Восстановить ${formatPrice(price.kopecks)}`}
                    >
                      <IconRestore aria-hidden="true" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onEditPrice(price)}
                        aria-label={`Изменить ${formatPrice(price.kopecks)}`}
                      >
                        <IconPencil aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => onArchivePrice(price)}
                        aria-label={`В архив ${formatPrice(price.kopecks)}`}
                      >
                        <IconArchive aria-hidden="true" />
                      </button>
                    </>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </aside>
    </main>
  );
}

function JourneyWorkspace({ workspace, selectedStep, onSelectStep, onBack, onOpenCatalog }) {
  if (selectedStep) {
    return (
      <main className="journey-page" id="main-content">
        <button className="back-button" onClick={onBack}>
          <IconArrowLeft aria-hidden="true" />К списку этапов
        </button>
        <p className="eyebrow">Карта пилота · ещё не реализовано</p>
        <h1>{selectedStep[0]}</h1>
        <p className="journey-lead">{selectedStep[1]}</p>
        <div className="future-notice">
          <strong>Что здесь будет</strong>
          <p>
            Этот экран показывает место этапа в будущем продукте. Подробное поведение будет
            спроектировано после проверки категорий и цен в «Лучке».
          </p>
        </div>
        <button className="primary-button" onClick={onOpenCatalog}>
          Открыть готовый макет категорий и цен
          <IconChevronRight aria-hidden="true" />
        </button>
      </main>
    );
  }

  return (
    <main className="journey-page" id="main-content">
      <p className="eyebrow">Карта пилота</p>
      <h1>{workspace.title}</h1>
      <p className="journey-lead">{workspace.description}</p>
      <div className="journey-list">
        {workspace.steps.map((step, index) => (
          <button key={step[0]} onClick={() => onSelectStep(step)}>
            <span className="journey-number">{String(index + 1).padStart(2, "0")}</span>
            <span>
              <strong>{step[0]}</strong>
              <small>{step[1]}</small>
            </span>
            <IconChevronRight aria-hidden="true" />
          </button>
        ))}
      </div>
    </main>
  );
}

function EditorDialog({ form, categories, prices, onChange, onTouch, onCancel, onSubmit }) {
  const isCategory = form.kind === "category";
  const validation = isCategory
    ? { error: validateCategoryName(form.value, categories, form.id) }
    : validatePrice(form.value, prices, form.id);
  const changed = form.value !== form.initialValue;
  const showError = Boolean(
    form.serverError || ((form.touched || form.value.trim().length > 0) && validation.error),
  );
  const error = form.serverError || validation.error;
  const canSave = changed && !validation.error && !form.saving;

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="dialog-layer" role="presentation">
      <button className="dialog-backdrop" aria-label="Закрыть форму" onClick={onCancel} />
      <section
        className="editor-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
        aria-describedby="editor-description"
      >
        <header>
          <div>
            <p className="eyebrow">
              {form.mode === "create" ? "Новое значение" : "Редактирование"}
            </p>
            <h2 id="editor-title">
              {form.mode === "create" ? "Создать" : "Изменить"} {isCategory ? "категорию" : "цену"}
            </h2>
          </div>
          <button className="icon-button light-icon" onClick={onCancel} aria-label="Закрыть форму">
            <IconX aria-hidden="true" />
          </button>
        </header>

        <p id="editor-description" className="dialog-description">
          {isCategory
            ? "Короткое название будет доступно при приёмке вещей."
            : "Сумма используется как быстрая заготовка и не меняет цену существующих вещей."}
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onTouch();
            if (canSave) onSubmit(validation);
          }}
        >
          <label htmlFor="editor-value">{isCategory ? "Название" : "Сумма, BYN"}</label>
          <div className={`field-shell ${showError ? "has-error" : ""}`}>
            <input
              id="editor-value"
              autoFocus
              autoComplete="off"
              inputMode={isCategory ? "text" : "decimal"}
              maxLength={isCategory ? 81 : 12}
              value={form.value}
              disabled={form.saving}
              onBlur={onTouch}
              onChange={(event) => onChange(event.target.value)}
              aria-invalid={showError}
              aria-describedby={showError ? "editor-error" : "editor-hint"}
            />
            {!isCategory && <span>BYN</span>}
          </div>
          <div className="field-meta">
            <small id="editor-hint">
              {isCategory ? `${normalizeSpaces(form.value).length}/80 символов` : "Например, 15,00"}
            </small>
            {showError && (
              <p className="field-error" id="editor-error" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="dialog-actions">
            <button type="button" className="quiet-button" onClick={onCancel}>
              Отмена
            </button>
            <button type="submit" className="primary-button" disabled={!canSave}>
              {form.saving ? "Сохраняем…" : "Сохранить"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function UnsavedDialog({ onContinue, onDiscard }) {
  return (
    <div className="dialog-layer dialog-layer-top" role="presentation">
      <div className="dialog-backdrop" />
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-title"
      >
        <h2 id="unsaved-title">Остались несохранённые изменения</h2>
        <p>Если уйти сейчас, введённые данные пропадут.</p>
        <div className="dialog-actions">
          <button className="quiet-button" onClick={onDiscard}>
            Не сохранять
          </button>
          <button className="primary-button" autoFocus onClick={onContinue}>
            Продолжить редактирование
          </button>
        </div>
      </section>
    </div>
  );
}

function ScenarioPanel({ forceNextError, onClose, onReset, onEmpty, onForceError }) {
  return (
    <div className="dialog-layer" role="presentation">
      <button className="dialog-backdrop" aria-label="Закрыть сценарии" onClick={onClose} />
      <section
        className="scenario-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scenario-title"
      >
        <header>
          <div>
            <p className="eyebrow">Только для проверки</p>
            <h2 id="scenario-title">Сценарии макета</h2>
          </div>
          <button
            className="icon-button light-icon"
            onClick={onClose}
            aria-label="Закрыть сценарии"
          >
            <IconX aria-hidden="true" />
          </button>
        </header>
        <p>
          Эти действия помогают оценить состояния, которые редко встречаются подряд в реальной
          работе.
        </p>
        <div className="scenario-actions">
          <button onClick={onReset}>
            <IconRefresh aria-hidden="true" />
            <span>
              <strong>Вернуть исходные данные</strong>
              <small>Четыре категории и пять цен</small>
            </span>
          </button>
          <button onClick={onEmpty}>
            <IconArchive aria-hidden="true" />
            <span>
              <strong>Показать пустое состояние</strong>
              <small>Очистить списки до перезагрузки</small>
            </span>
          </button>
          <button className={forceNextError ? "is-armed" : ""} onClick={onForceError}>
            <IconFlask aria-hidden="true" />
            <span>
              <strong>Следующее сохранение — ошибка</strong>
              <small>
                {forceNextError ? "Включено: ввод не будет потерян" : "Проверить исправимую ошибку"}
              </small>
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}

function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <IconCheck aria-hidden="true" />
      <span>{message}</span>
      <button onClick={onClose} aria-label="Закрыть сообщение">
        <IconX aria-hidden="true" />
      </button>
    </div>
  );
}

export function App() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [prices, setPrices] = useState(INITIAL_PRICES);
  const [activeWorkspace, setActiveWorkspace] = useState("settings");
  const [selectedStep, setSelectedStep] = useState(null);
  const [form, setForm] = useState(null);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [forceNextError, setForceNextError] = useState(false);
  const [showArchivedCategories, setShowArchivedCategories] = useState(false);
  const [showArchivedPrices, setShowArchivedPrices] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");
  const pendingAction = useRef(null);
  const saveTimer = useRef(null);

  const activeWorkspaceDefinition = useMemo(
    () => WORKSPACES.find((workspace) => workspace.id === activeWorkspace),
    [activeWorkspace],
  );
  const dirty = Boolean(form && form.value !== form.initialValue);

  useEffect(() => {
    function warnBeforeUnload(event) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? "" : current)), 3600);
  }

  function guardUnsaved(action) {
    if (!dirty) {
      action();
      return;
    }
    pendingAction.current = action;
    setUnsavedOpen(true);
  }

  function navigate(workspaceId) {
    guardUnsaved(() => {
      setForm(null);
      setActiveWorkspace(workspaceId);
      setSelectedStep(null);
      setMobileOpen(false);
    });
  }

  function openForm(kind, mode, item = null) {
    const value = kind === "category" ? categoryFormValue(item) : priceFormValue(item);
    setForm({
      kind,
      mode,
      id: item?.id ?? null,
      value,
      initialValue: value,
      touched: false,
      saving: false,
      serverError: null,
    });
  }

  function closeForm() {
    guardUnsaved(() => setForm(null));
  }

  function saveForm(validation) {
    if (!form || form.saving) return;
    setForm((current) => ({ ...current, saving: true, serverError: null }));

    saveTimer.current = window.setTimeout(() => {
      if (forceNextError) {
        setForceNextError(false);
        setForm((current) => ({
          ...current,
          saving: false,
          serverError: "Не удалось сохранить. Ввод не потерян — попробуйте ещё раз.",
        }));
        return;
      }

      if (form.kind === "category") {
        const name = normalizeSpaces(form.value);
        if (form.mode === "create") {
          setCategories((current) => [
            ...current,
            { id: nextId("category"), name, archived: false },
          ]);
          showToast(`Категория «${name}» создана.`);
        } else {
          setCategories((current) =>
            current.map((category) => (category.id === form.id ? { ...category, name } : category)),
          );
          showToast(`Категория изменена: «${name}».`);
        }
      } else {
        const kopecks = validation.kopecks;
        if (form.mode === "create") {
          setPrices((current) => [...current, { id: nextId("price"), kopecks, archived: false }]);
          showToast(`Цена ${formatPrice(kopecks)} создана.`);
        } else {
          setPrices((current) =>
            current.map((price) => (price.id === form.id ? { ...price, kopecks } : price)),
          );
          showToast(`Цена изменена: ${formatPrice(kopecks)}.`);
        }
      }
      setForm(null);
    }, 650);
  }

  function archiveCategory(category) {
    setCategories((current) =>
      current.map((item) => (item.id === category.id ? { ...item, archived: true } : item)),
    );
    showToast(`Категория «${category.name}» перемещена в архив.`);
  }

  function restoreCategory(category) {
    setCategories((current) =>
      current.map((item) => (item.id === category.id ? { ...item, archived: false } : item)),
    );
    showToast(`Категория «${category.name}» восстановлена.`);
  }

  function archivePrice(price) {
    setPrices((current) =>
      current.map((item) => (item.id === price.id ? { ...item, archived: true } : item)),
    );
    showToast(`Цена ${formatPrice(price.kopecks)} перемещена в архив.`);
  }

  function restorePrice(price) {
    setPrices((current) =>
      current.map((item) => (item.id === price.id ? { ...item, archived: false } : item)),
    );
    showToast(`Цена ${formatPrice(price.kopecks)} восстановлена.`);
  }

  function resetData() {
    setCategories(INITIAL_CATEGORIES);
    setPrices(INITIAL_PRICES);
    setShowArchivedCategories(false);
    setShowArchivedPrices(false);
    setForceNextError(false);
    setScenarioOpen(false);
    showToast("Исходные данные восстановлены.");
  }

  function showEmptyData() {
    setCategories([]);
    setPrices([]);
    setShowArchivedCategories(false);
    setShowArchivedPrices(false);
    setScenarioOpen(false);
    showToast("Показано пустое состояние.");
  }

  return (
    <div className="prototype-shell">
      <a className="skip-link" href="#main-content">
        К основному содержанию
      </a>
      <MobileHeader onOpenMenu={() => setMobileOpen(true)} />
      <Navigation
        activeWorkspace={activeWorkspace}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onNavigate={navigate}
        onOpenScenarios={() => {
          setScenarioOpen(true);
          setMobileOpen(false);
        }}
      />

      <div className="prototype-content">
        {activeWorkspace === "settings" ? (
          <CategoryWorkspace
            categories={categories}
            prices={prices}
            showArchivedCategories={showArchivedCategories}
            showArchivedPrices={showArchivedPrices}
            onToggleCategoryArchive={() => setShowArchivedCategories((current) => !current)}
            onTogglePriceArchive={() => setShowArchivedPrices((current) => !current)}
            onCreateCategory={() => openForm("category", "create")}
            onCreatePrice={() => openForm("price", "create")}
            onEditCategory={(category) => openForm("category", "edit", category)}
            onEditPrice={(price) => openForm("price", "edit", price)}
            onArchiveCategory={archiveCategory}
            onArchivePrice={archivePrice}
            onRestoreCategory={restoreCategory}
            onRestorePrice={restorePrice}
          />
        ) : (
          <JourneyWorkspace
            workspace={activeWorkspaceDefinition}
            selectedStep={selectedStep}
            onSelectStep={setSelectedStep}
            onBack={() => setSelectedStep(null)}
            onOpenCatalog={() => navigate("settings")}
          />
        )}
      </div>

      {form && (
        <EditorDialog
          form={form}
          categories={categories}
          prices={prices}
          onChange={(value) => setForm((current) => ({ ...current, value, serverError: null }))}
          onTouch={() => setForm((current) => ({ ...current, touched: true }))}
          onCancel={closeForm}
          onSubmit={saveForm}
        />
      )}
      {unsavedOpen && (
        <UnsavedDialog
          onContinue={() => {
            pendingAction.current = null;
            setUnsavedOpen(false);
          }}
          onDiscard={() => {
            const action = pendingAction.current;
            pendingAction.current = null;
            setUnsavedOpen(false);
            setForm(null);
            action?.();
          }}
        />
      )}
      {scenarioOpen && (
        <ScenarioPanel
          forceNextError={forceNextError}
          onClose={() => setScenarioOpen(false)}
          onReset={() => guardUnsaved(resetData)}
          onEmpty={() => guardUnsaved(showEmptyData)}
          onForceError={() => setForceNextError((current) => !current)}
        />
      )}
      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
