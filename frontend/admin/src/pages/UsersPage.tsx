import { useEffect, useState } from "react";
import { apiFetch } from "../shared/api/client";

import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Администратор" },
  { value: "manager", label: "Менеджер" },
  { value: "viewer", label: "Наблюдатель" },
];

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [isActive, setIsActive] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/v1/users/");
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as User[];
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? "Не удалось загрузить пользователей");
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
    setEmail("");
    setRole("admin");
    setIsActive(true);
    setOpen(true);
  }

  function startEdit(u: User) {
    setEditing(u);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setIsActive(u.is_active);
    setOpen(true);
  }

  async function save() {
    setError(null);

    if (name.trim().length < 2) {
      setError("Имя слишком короткое");
      return;
    }

    if (!email.includes("@")) {
      setError("Email выглядит некорректно");
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      role,
      is_active: isActive,
    };

    try {
      const res = await apiFetch(
        editing ? `/api/v1/users/${editing.id}` : "/api/v1/users/",
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
      setError(e?.message ?? "Не удалось сохранить пользователя");
    }
  }

  async function remove(id: number) {
    if (!confirm("Удалить пользователя?")) return;
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/users/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Не удалось удалить пользователя");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-black/90">Пользователи</h2>
          <p className="mt-1 text-sm text-black/55">
            Включай/выключай доступ через флажок «Активен». Роль влияет на доступы в будущем.
          </p>
        </div>

        <Button onClick={startCreate} className="rounded-xl">
          + Создать пользователя
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/70">
        <div className="grid grid-cols-[1fr_260px_160px_140px] gap-3 border-b border-black/5 px-4 py-3 text-xs font-semibold text-black/60">
          <div>Имя</div>
          <div>Email</div>
          <div>Роль</div>
          <div className="text-right">Действия</div>
        </div>

        <div className="divide-y divide-black/5">
          {loading ? (
            <div className="px-4 py-6 text-sm text-black/60">Загрузка…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-sm text-black/60">Пока нет пользователей.</div>
          ) : (
            items.map((u) => (
              <div key={u.id} className="grid grid-cols-[1fr_260px_160px_140px] gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium text-black/90">{u.name}</div>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-xs",
                        u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/60",
                      ].join(" ")}
                    >
                      {u.is_active ? "активен" : "заблокирован"}
                    </span>
                  </div>
                </div>

                <div className="truncate text-sm text-black/60">{u.email}</div>
                <div className="truncate text-sm text-black/60">{u.role}</div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="h-9 rounded-xl" onClick={() => startEdit(u)}>
                    Изменить
                  </Button>
                  <Button variant="destructive" className="h-9 rounded-xl" onClick={() => remove(u.id)}>
                    Удалить
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать пользователя" : "Создать пользователя"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user_name">Имя</Label>
                <Input
                  id="user_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Иван Иванов"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_email">Email</Label>
                <Input
                  id="user_email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_role">Роль</Label>
              <select
                id="user_role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-10 w-full rounded-xl border border-black/10 bg-white/80 px-3 text-sm text-black/80 shadow-sm outline-none focus:ring-2 focus:ring-black/10"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(Boolean(v))} />
              <div>
                <div className="text-sm font-medium text-black/80">Активен</div>
                <div className="text-xs text-black/50">
                  Если выключено — пользователь считается заблокированным.
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
