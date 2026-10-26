import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { roman, SCOPE_CATALOG_KEY, useScopeCatalog, type ScopeGroup } from "../lib/scopes";
import { ErrorBox, Skeleton } from "../components/ui";

function move<T>(list: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export default function ScopeCatalog() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useScopeCatalog();
  const [groups, setGroups] = useState<ScopeGroup[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (data && !dirty) setGroups(structuredClone(data));
  }, [data, dirty]);

  const edit = (fn: (g: ScopeGroup[]) => ScopeGroup[]) => {
    setGroups((g) => fn(structuredClone(g)));
    setDirty(true);
    setSaved(null);
  };

  const removed = (data ?? []).flatMap((g) => g.items).filter((i) => !groups.some((g) => g.items.some((x) => x.id === i.id)));

  const save = useMutation({
    mutationFn: () => api<{ groups: ScopeGroup[]; affectedParties: number }>("/admin/scopes", { method: "PUT", body: JSON.stringify({ groups }) }),
    onSuccess: (r) => {
      setDirty(false);
      setGroups(r.groups);
      qc.setQueryData(SCOPE_CATALOG_KEY, r.groups);
      qc.invalidateQueries({ queryKey: ["project"] });
      setSaved(r.affectedParties > 0 ? `Đã lưu. Đã gỡ scope bị xóa khỏi ${r.affectedParties} bên.` : "Đã lưu.");
    },
  });

  function onSave() {
    if (removed.length > 0 && !window.confirm(`Xóa ${removed.length} scope? Các scope này sẽ bị gỡ khỏi mọi bên ở mọi dự án đang dùng, không hoàn tác được.`)) return;
    save.mutate();
  }

  if (isLoading) return <Skeleton className="h-64" />;
  if (error) return <ErrorBox error={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Danh mục scope công việc</h1>
          <p className="mt-1 text-sm text-slate-500">Áp dụng cho toàn bộ dự án. Số thứ tự tự đánh theo vị trí.</p>
        </div>
        <button className="btn-primary" disabled={!dirty || save.isPending} onClick={onSave}>
          {save.isPending ? "Đang lưu…" : "Lưu danh mục"}
        </button>
      </div>
      {save.error ? <ErrorBox error={save.error} /> : null}
      {saved && <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">{saved}</p>}
      {dirty && !saved && <p className="text-sm text-amber-600">Có thay đổi chưa lưu.</p>}

      {groups.map((g, gi) => (
        <section key={g.id ?? `new-${gi}`} className="card space-y-3 p-4">
          <div className="flex items-center gap-2">
            <span className="w-10 shrink-0 font-semibold text-brand-600">{roman(gi + 1)}.</span>
            <input
              className="input font-semibold"
              placeholder="Tên nhóm"
              value={g.title}
              onChange={(e) => edit((all) => { all[gi].title = e.target.value; return all; })}
            />
            <button className="btn-ghost !px-2" aria-label="Lên" onClick={() => edit((all) => move(all, gi, -1))}><ArrowUp size={16} /></button>
            <button className="btn-ghost !px-2" aria-label="Xuống" onClick={() => edit((all) => move(all, gi, 1))}><ArrowDown size={16} /></button>
            <button
              className="btn-ghost !px-2 !text-red-600"
              aria-label="Xóa nhóm"
              onClick={() => { if (g.items.length === 0 || window.confirm(`Xóa nhóm “${g.title}” cùng ${g.items.length} scope con?`)) edit((all) => all.filter((_, k) => k !== gi)); }}
            >
              <Trash2 size={16} />
            </button>
          </div>
          <ul className="space-y-2 pl-12">
            {g.items.map((it, ii) => (
              <li key={it.id ?? `new-${ii}`} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-sm text-slate-500">{ii + 1}.</span>
                <input
                  className="input"
                  placeholder="Tên scope"
                  value={it.name}
                  onChange={(e) => edit((all) => { all[gi].items[ii].name = e.target.value; return all; })}
                />
                <button className="btn-ghost !px-2" aria-label="Lên" onClick={() => edit((all) => { all[gi].items = move(all[gi].items, ii, -1); return all; })}><ArrowUp size={16} /></button>
                <button className="btn-ghost !px-2" aria-label="Xuống" onClick={() => edit((all) => { all[gi].items = move(all[gi].items, ii, 1); return all; })}><ArrowDown size={16} /></button>
                <button className="btn-ghost !px-2 !text-red-600" aria-label="Xóa scope" onClick={() => edit((all) => { all[gi].items = all[gi].items.filter((_, k) => k !== ii); return all; })}><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
          <div className="pl-12">
            <button className="btn-ghost" onClick={() => edit((all) => { all[gi].items.push({ name: "" }); return all; })}>
              <Plus size={16} /> Thêm scope
            </button>
          </div>
        </section>
      ))}
      <button className="btn-ghost" onClick={() => edit((all) => [...all, { title: "", items: [] }])}>
        <Plus size={16} /> Thêm nhóm
      </button>
    </div>
  );
}
