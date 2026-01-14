import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../shared/api/client";

import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";

type Brand = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
};

function slugify(input: string): string {
  const ru: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e",
    ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
    ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };

  const translit = input
    .trim()
    .toLowerCase()
    .split("")
    .map((ch) => (ru[ch] !== undefined ? ru[ch] : ch))
    .join("");

  return translit
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200);
}

export default function BrandsPage() {
  const [items, setItems] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const autoSlug = useMemo(() => slugify(name), [name]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/v1/brands/");
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as Brand[];
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? "Не удалось загрузить бренды");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startCreate() {
    setEditing(null);
    setName("");
    setIsActive(true);
    setOpen(true);
  }

  function startEdit(b: Brand) {
    setEditing(b);
    setName(b.name);
    setIsActive(b.is_active);
    setOpen(true);
  }

  async function save() {
    setError(null);
    if (name.trim().length < 2) {
      setError("Название слишком короткое");
      return;
    }
    if (autoSlug.length < 2) {
      setError("Не удалось сгенерировать slug (слишком короткое название)");
      return;
    }

    const payload = {
      name: name.trim(),
      slug: autoSlug,
      is_active: isActive,
    };

    try {
      const res = await apiFetch(
        editing ? `/api/v1/brands/${editing.id}` : "/api/v1/brands/",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      setOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Не удалось сохранить бренд");
    }
  }

  async function remove(id: number) {
    if (!confirm("Удалить бренд?")) return;
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/brands/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Не удалось удалить бренд");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-black/90">Бренды</h2>
          <p className="mt-1 text-sm text-black/55">
            Управление брендами. Слаг генерируется автоматически и скрыт.
          </p>
        </div>

        <Button onClick={startCreate} className="rounded-xl">
          + Создать бренд
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/70">
        <div className="grid grid-cols-[1fr_220px_140px] gap-3 border-b border-black/5 px-4 py-3 text-xs font-semibold text-black/60">
          <div>Название</div>
          <div>Slug (авто)</div>
          <div className="text-right">Действия</div>
        </div>

        <div className="divide-y divide-black/5">
          {loading ? (
            <div className="px-4 py-6 text-sm text-black/60">Загрузка…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-sm text-black/60">Пока нет брендов.</div>
          ) : (
            items.map((b) => (
              <div key={b.id} className="grid grid-cols-[1fr_220px_140px] gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium text-black/90">{b.name}</div>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-xs",
                        b.is_active ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/60",
                      ].join(" ")}
                    >
                      {b.is_active ? "активен" : "скрыт"}
                    </span>
                  </div>
                </div>

                <div className="truncate text-sm text-black/60">/{b.slug}</div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="h-9 rounded-xl" onClick={() => startEdit(b)}>
                    Изменить
                  </Button>
                  <Button
                    variant="destructive"
                    className="h-9 rounded-xl"
                    onClick={() => remove(b.id)}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать бренд" : "Создать бренд"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand_name">Название</Label>
              <Input
                id="brand_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Nike"
              />
            </div>

            {/* slug скрыт, но показываем превью */}
            <div className="rounded-xl border border-black/5 bg-black/[0.02] px-3 py-2 text-sm text-black/60">
              slug: <span className="font-medium text-black/70">/{autoSlug || "..."}</span>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(Boolean(v))} />
              <div>
                <div className="text-sm font-medium text-black/80">Активен</div>
                <div className="text-xs text-black/50">
                  Если выключено — бренд скрыт на сайте.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button className="rounded-xl" onClick={save}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
