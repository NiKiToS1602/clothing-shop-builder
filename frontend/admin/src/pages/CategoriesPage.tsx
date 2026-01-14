import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../shared/api/client";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import { ChevronDown, ChevronRight, Edit, Plus, Trash2 } from "lucide-react";

export type Category = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  parent_id: number | null;
};

type Node = Category & { children: Node[] };

function buildTree(items: Category[]): Node[] {
  const map = new Map<number, Node>();
  for (const c of items) map.set(c.id, { ...c, children: [] });

  const roots: Node[] = [];
  for (const c of items) {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRec = (nodes: Node[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);

  return roots;
}

// авто-slug (RU->EN + нормализация)
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

  const translit = input
    .trim()
    .toLowerCase()
    .split("")
    .map((ch) => (ru[ch] !== undefined ? ru[ch] : ch))
    .join("");

  return translit
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
        active
          ? "border-emerald-200 text-emerald-700 bg-emerald-50"
          : "border-slate-200 text-slate-500 bg-slate-50",
      ].join(" ")}
    >
      {active ? "Активна" : "Скрыта"}
    </span>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const tree = useMemo(() => buildTree(categories), [categories]);

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [serverError, setServerError] = useState("");

  // dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // form
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("none");
  const [isActive, setIsActive] = useState(true);

  // UI: блокируем повторные переключения
  const [toggling, setToggling] = useState<Record<number, boolean>>({});

  async function fetchCategories() {
    setServerError("");
    const res = await apiFetch("/api/v1/categories/");
    if (!res.ok) {
      setServerError(`Не удалось загрузить категории (HTTP ${res.status})`);
      return;
    }
    const data: Category[] = await res.json();
    setCategories(data);
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpand = (id: number) => {
    setExpanded((s) => ({ ...s, [id]: !(s[id] ?? true) }));
  };

  // Виртуальная видимость = активна сама И активны все родители
  const byId = useMemo(() => {
    const m = new Map<number, Category>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  function isVirtuallyVisible(cat: Category): boolean {
    if (!cat.is_active) return false;
    let p = cat.parent_id;
    while (p) {
      const parent = byId.get(p);
      if (!parent) break;
      if (!parent.is_active) return false;
      p = parent.parent_id;
    }
    return true;
  }

  function collectDescendantIds(node: Node): number[] {
    const ids: number[] = [];
    const walk = (n: Node) => {
      ids.push(n.id);
      n.children.forEach(walk);
    };
    walk(node);
    return ids;
  }

  async function patchCategory(id: number, payload: Partial<Category>) {
    return apiFetch(`/api/v1/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  // ✅ Флажок "показывать на сайте" (is_active)
  // ✅ Если у категории есть дети — переключаем ГРУППОЙ (родитель + все потомки)
  async function toggleVisibility(node: Node, nextActive: boolean) {
    const idsToUpdate =
      node.children.length > 0 ? collectDescendantIds(node) : [node.id];

    // UI lock
    setToggling((s) => {
      const copy = { ...s };
      idsToUpdate.forEach((id) => (copy[id] = true));
      return copy;
    });

    setServerError("");

    // Обновляем последовательно (простая логика, меньше сюрпризов)
    try {
      for (const id of idsToUpdate) {
        const res = await patchCategory(id, { is_active: nextActive });
        if (!res.ok) {
          let detail = `HTTP ${res.status}`;
          try {
            const body = await res.json();
            detail = body?.detail ? String(body.detail) : detail;
          } catch {
            // ignore
          }
          throw new Error(detail);
        }
      }

      await fetchCategories();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setServerError(`Не удалось изменить видимость: ${msg}`);
    } finally {
      setToggling((s) => {
        const copy = { ...s };
        idsToUpdate.forEach((id) => delete copy[id]);
        return copy;
      });
    }
  }

  const openCreate = (parent: number | null = null) => {
    setEditing(null);
    setServerError("");
    setName("");
    setParentId(parent ? String(parent) : "none");
    setIsActive(true);
    setIsDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setServerError("");
    setName(cat.name);
    setParentId(cat.parent_id ? String(cat.parent_id) : "none");
    setIsActive(cat.is_active);
    setIsDialogOpen(true);
  };

  async function handleSave() {
    setServerError("");

    const payload = {
      name: name.trim(),
      slug: slugify(name), // ✅ slug всегда авто
      is_active: isActive, // ✅ флажок управляет отображением на сайте
      parent_id: parentId === "none" ? null : Number(parentId),
    };

    if (payload.name.length < 2) {
      setServerError("Название должно быть минимум 2 символа");
      return;
    }
    if (payload.slug.length < 2) {
      setServerError("Не удалось сгенерировать slug (слишком короткое название)");
      return;
    }

    const res = editing
      ? await apiFetch(`/api/v1/categories/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await apiFetch("/api/v1/categories/", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        detail = body?.detail ? String(body.detail) : detail;
      } catch {
        // ignore
      }
      setServerError(`Не удалось сохранить: ${detail}`);
      return;
    }

    setIsDialogOpen(false);
    await fetchCategories();
  }

  const openDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  async function confirmDelete() {
    if (!deletingId) return;
    setServerError("");

    const res = await apiFetch(`/api/v1/categories/${deletingId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        detail = body?.detail ? String(body.detail) : detail;
      } catch {
        // ignore
      }
      setServerError(`Не удалось удалить категорию: ${detail}`);
    }

    setIsDeleteDialogOpen(false);
    setDeletingId(null);
    await fetchCategories();
  }

  const parentOptions = useMemo(() => {
    return categories
      .filter((c) => (editing ? c.id !== editing.id : true))
      .filter((c) => c.parent_id === null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, editing]);

  const renderNode = (node: Node, level = 0, parentVisible = true) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded[node.id] ?? true;

    // виртуальная видимость: учитываем родителя
    const ownActive = node.is_active;
    const virtualVisible = parentVisible && ownActive;

    const busy = !!toggling[node.id];

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-3 py-2 px-3 rounded group hover:bg-muted/50"
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="p-0.5 rounded hover:bg-muted"
                aria-label={isExpanded ? "Свернуть" : "Раскрыть"}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}

            {/* ✅ Флажок отображения на сайте */}
            <input
              type="checkbox"
              checked={ownActive}
              disabled={busy}
              onChange={(e) => toggleVisibility(node, e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
              title={
                hasChildren
                  ? "Переключает отображение категории и всех подкатегорий"
                  : "Переключает отображение категории на сайте"
              }
            />

            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={[
                    "font-medium truncate",
                    virtualVisible ? "" : "opacity-50",
                  ].join(" ")}
                >
                  {node.name}
                </span>

                {/* виртуальный статус */}
                <Badge active={virtualVisible} />

                {hasChildren && (
                  <span className="text-sm text-muted-foreground">
                    ({node.children.length})
                  </span>
                )}
              </div>

              {/* можно оставить slug как вспомогательное (не редактируется) */}
              <div className="text-xs text-muted-foreground truncate">
                /{node.slug}
              </div>
            </div>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openCreate(node.id)}
              title="Добавить подкатегорию"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(node)}
              title="Редактировать"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDelete(node.id)}
              title="Удалить"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map((ch) =>
              renderNode(ch, level + 1, virtualVisible),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="mb-1">Каталог категорий</h2>
          <p className="text-muted-foreground">
            Флажок определяет, отображается ли категория на сайте. Если скрыть
            родителя — скрывается вся группа.
          </p>
        </div>

        <Button onClick={() => openCreate()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Добавить категорию
        </Button>
      </div>

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="space-y-1">
            {tree.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Категорий пока нет. Создайте первую ✨
              </div>
            ) : (
              tree.map((n) => renderNode(n))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Редактировать категорию" : "Создать категорию"}
            </DialogTitle>
            <DialogDescription>
              Slug генерируется автоматически по названию (вручную не задаётся).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Футболки"
              />
            </div>

            <div className="space-y-2">
              <Label>Родительская категория</Label>
              <Select
                value={parentId}
                onValueChange={(value) => setParentId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Без родительской категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без родительской категории</SelectItem>
                  {parentOptions.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ✅ флажок отображения */}
            <label className="flex items-center gap-3 rounded-lg border p-3">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <div>
                <div className="font-medium">
                  {isActive ? "Активна" : "Скрыта"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Управляет отображением категории на сайте
                </div>
              </div>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={name.trim().length < 2}
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
