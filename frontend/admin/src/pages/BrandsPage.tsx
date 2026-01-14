import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../shared/api/client";

import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";

function slugify(input: string): string {
  const ru: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };

  const normalized = input
    .trim()
    .toLowerCase()
    .split("")
    .map((ch) => (ru[ch] !== undefined ? ru[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized;
}

type Brand = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  description?: string | null;
  image_path?: string | null;
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    is_active: true,
    description: "",
  });
  const [slugLocked, setSlugLocked] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/v1/brands", { method: "GET" });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as Brand[];
      setBrands(data);
    } catch (e: any) {
      setError(e?.message ?? "Не удалось загрузить бренды");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const sorted = useMemo(() => {
    return [...brands].sort((a, b) => a.id - b.id);
  }, [brands]);

  function openCreate() {
    setEditing(null);
    setSlugLocked(false);
    setForm({ name: "", slug: "", is_active: true, description: "" });
    setImageFile(null);
    setImagePreview(null);
    setOpen(true);
  }

  function openEdit(b: Brand) {
    setEditing(b);
    setSlugLocked(true); // при редактировании не перетираем slug при изменении name
    setForm({
      name: b.name,
      slug: b.slug,
      is_active: b.is_active,
      description: b.description ?? "",
    });
    setImageFile(null);
    setImagePreview(
      b.image_path
        ? `${import.meta.env.VITE_CATALOG_API_URL}${b.image_path}`
        : null
    );
    setOpen(true);
  }

  async function save() {
    setError(null);

    if (form.name.trim().length < 2) {
      setError("Название слишком короткое");
      return;
    }
    if (form.slug.trim().length < 2) {
      setError("Слаг слишком короткий");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        is_active: form.is_active,
        description: form.description?.trim() ? form.description.trim() : null,
      };

      let saved: Brand;

      if (editing) {
        const res = await apiFetch(`/api/v1/brands/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        saved = (await res.json()) as Brand;
      } else {
        const res = await apiFetch(`/api/v1/brands`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        saved = (await res.json()) as Brand;
      }

      // Загрузка изображения отдельным запросом
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);

        const res = await apiFetch(`/api/v1/brands/${saved.id}/image`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error(await res.text());
        saved = (await res.json()) as Brand;
      }

      setBrands((list) => {
        const idx = list.findIndex((x) => x.id === saved.id);
        if (idx === -1) return [...list, saved];
        const copy = [...list];
        copy[idx] = saved;
        return copy;
      });

      setOpen(false);
    } catch (e: any) {
      setError(e?.message ?? "Не удалось сохранить бренд");
    }
  }

  async function remove(id: number) {
    if (!confirm("Удалить бренд?")) return;
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/brands/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setBrands((list) => list.filter((b) => b.id !== id));
    } catch (e: any) {
      setError(e?.message ?? "Не удалось удалить бренд");
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Бренды</h1>
          <div className="text-sm text-black/60">
            Управляй брендами/производителями (CRUD)
          </div>
        </div>

        <Button className="rounded-xl" onClick={openCreate}>
          Добавить
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-black/10 bg-white overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-black/60 border-b border-black/10">
          <div className="col-span-1">ID</div>
          <div className="col-span-3">Название</div>
          <div className="col-span-3">Slug</div>
          <div className="col-span-2">Статус</div>
          <div className="col-span-3 text-right">Действия</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-black/60">Загрузка…</div>
        ) : sorted.length === 0 ? (
          <div className="px-4 py-6 text-sm text-black/60">Брендов пока нет.</div>
        ) : (
          sorted.map((b) => (
            <div
              key={b.id}
              className="grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b border-black/5 last:border-b-0"
            >
              <div className="col-span-1 text-black/60">{b.id}</div>
              <div className="col-span-3 font-medium">{b.name}</div>
              <div className="col-span-3 text-black/70">/{b.slug}</div>
              <div className="col-span-2">
                {b.is_active ? (
                  <span className="rounded-full bg-black/5 border border-black/10 px-2 py-1 text-xs">
                    Активен
                  </span>
                ) : (
                  <span className="rounded-full bg-red-50 border border-red-200 px-2 py-1 text-xs text-red-700">
                    Скрыт
                  </span>
                )}
              </div>
              <div className="col-span-3 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => openEdit(b)}
                >
                  Изменить
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-xl"
                  onClick={() => remove(b.id)}
                >
                  Удалить
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Изменить бренд" : "Добавить бренд"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((s) => {
                    const next = { ...s, name };
                    if (!slugLocked) next.slug = slugify(name);
                    return next;
                  });
                }}
                placeholder="Например: Nike"
              />
              <div className="text-xs text-black/60">
                slug:{" "}
                <span className="font-medium text-black/70">
                  /{form.slug || "…"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugLocked(true);
                  setForm((s) => ({ ...s, slug: e.target.value }));
                }}
                placeholder="nike"
              />
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((s) => ({ ...s, description: e.target.value }))
                }
                className="min-h-[96px] w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-black/20"
                placeholder="Коротко опиши бренд"
              />
            </div>

            <div className="space-y-2">
              <Label>Изображение бренда</Label>
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-xl border border-black/10 bg-black/5 overflow-hidden flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="brand"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-black/50">нет</span>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setImageFile(f);
                      if (f) setImagePreview(URL.createObjectURL(f));
                    }}
                    className="block w-full text-sm"
                  />
                  <div className="text-xs text-black/60">
                    Картинка сохранится после нажатия «Сохранить».
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                checked={form.is_active}
                onCheckedChange={(v) =>
                  setForm((s) => ({ ...s, is_active: Boolean(v) }))
                }
              />
              <Label>Активен</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setOpen(false)}
            >
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
