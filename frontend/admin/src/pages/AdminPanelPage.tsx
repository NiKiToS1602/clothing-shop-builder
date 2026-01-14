import { useMemo, useState } from "react";
import CategoriesPage from "./CategoriesPage";
import BrandsPage from "./BrandsPage";
import UsersPage from "./UsersPage";

type TabKey = "categories" | "products" | "brands" | "users" | "settings";

export default function AdminPanelPage() {
  const tabs = useMemo(
    () =>
      [
        { key: "categories", label: "Категории" },
        { key: "products", label: "Товары" },
        { key: "brands", label: "Бренды" },
        { key: "users", label: "Пользователи" },
        { key: "settings", label: "Настройки" },
      ] as const,
    []
  );

  const [active, setActive] = useState<TabKey>("categories");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.10)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-xl font-semibold text-black/90">Админ-панель</h1>
            <p className="mt-1 text-sm text-black/55">
              Управление каталогом: категории, товары и настройки.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((t) => {
            const isActive = t.key === active;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActive(t.key)}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-sm"
                    : "bg-white/70 text-black/70 hover:bg-white hover:text-black border border-black/5",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border border-black/5 bg-white/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.10)] backdrop-blur-xl">
        {active === "categories" && <CategoriesPage />}
        {active === "products" && (
          <div className="text-sm text-black/70">Раздел «Товары» — следующий шаг.</div>
        )}
        {active === "brands" && <BrandsPage />}
        {active === "users" && <UsersPage />}
        {active === "settings" && (
          <div className="text-sm text-black/70">Раздел «Настройки» — следующий шаг.</div>
        )}
      </div>
    </div>
  );
}
