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
import { Switch } from "../components/ui/switch";

import {
  ChevronDown,
  ChevronRight,
  Edit,
  Plus,
  Trash2,
} from "lucide-react";

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

// Небольшой slugify с базовой транслитерацией RU -> EN
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const tree = useMemo(() => buildTree(categories), [categories]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string>("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    parentId: "none" as string,
    isActive: true,
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = (id: number) => {
    setExpanded((s) => ({ ...s, [id]: !(s[id] ?? true) }));
  };

  const openCreate = (parentId: number | null = null) => {
    setEditing(null);
    setServerError("");
    setForm({
      name: "",
      slug: "",
      parentId: parentId ? String(parentId) : "none",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setServerError("");
    setForm({
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parent_id ? String(cat.parent_id) : "none",
      isActive: cat.is_active,
    });
    setIsDialogOpen(true);
  };

  const openDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  async function handleSave() {
    setServerError("");

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      is_active: form.isActive,
      parent_id: form.parentId === "none" ? null : Number(form.parentId),
    };

    if (payload.name.length < 2) {
      setServerError("Название должно быть минимум 2 символа");
      return;
    }
    if (payload.slug.length < 2) {
      setServerError("Slug должен быть минимум 2 символа");
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
      // backend часто отдаёт detail строкой
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        detail = body?.detail ? String(body.detail) : detail;
      } catch {
        // ignore
      }
      setServerError(`Не удалось сохранить категорию: ${detail}`);
      return;
    }

    setIsDialogOpen(false);
    await fetchCategories();
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setServerError("");
    const res = await apiFetch(`/api/v1/categories/${deletingId}`, { method: "DELETE" });
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
    // Важно: не даём выбрать самого себя родителем
    return categories
      .filter((c) => (editing ? c.id !== editing.id : true))
      .filter((c) => c.parent_id === null) // только корневые как в макете
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, editing]);

  const renderNode = (node: Node, level = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded[node.id] ?? true;

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 py-2 px-3 rounded group hover:bg-muted/50"
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
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-5" />
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium truncate">{node.name}</span>
                <span className="text-sm text-muted-foreground truncate">/{node.slug}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    node.is_active
                      ? "border-emerald-200 text-emerald-700"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  {node.is_active ? "active" : "inactive"}
                </span>
                {hasChildren && <span className="text-sm text-muted-foreground">({node.children.length})</span>}
              </div>
              <div className="text-xs text-muted-foreground">id: {node.id}</div>
            </div>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={() => openCreate(node.id)} title="Добавить подкатегорию">
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openEdit(node)} title="Редактировать">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openDelete(node.id)} title="Удалить">
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && <div>{node.children.map((ch) => renderNode(ch, level + 1))}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="mb-1">Каталог категорий</h2>
          <p className="text-muted-foreground">Управление категориями и подкатегориями товаров</p>
        </div>
        <Button onClick={() => openCreate()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Добавить категорию
        </Button>
      </div>

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="space-y-1">
            {tree.length === 0 ? (
              <div className="text-sm text-muted-foreground">Категории отсутствуют.</div>
            ) : (
              tree.map((n) => renderNode(n))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать категорию" : "Создать категорию"}</DialogTitle>
            <DialogDescription>Заполните информацию о категории</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    name: e.target.value,
                    // если slug ещё не трогали — подстраиваем под имя
                    slug: s.slug ? s.slug : slugify(e.target.value),
                  }))
                }
                placeholder="Например: Футболки"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
                placeholder="t-shirts"
              />
              <div className="text-xs text-muted-foreground">
                Используется в URL. Можно оставить пустым — сгенерируется автоматически.
              </div>
            </div>

            <div className="space-y-2">
              <Label>Родительская категория</Label>
              <Select value={form.parentId} onValueChange={(value) => setForm((s) => ({ ...s, parentId: value }))}>
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

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium">Активна</div>
                <div className="text-xs text-muted-foreground">Неактивные категории можно скрывать в клиентской части</div>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((s) => ({ ...s, isActive: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>{editing ? "Сохранить" : "Создать"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Если у категории есть подкатегории, бэкенд может запретить удаление до тех
              пор, пока вы не переназначите/удалите дочерние категории.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
