import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api, patch, post, type Project } from "../lib/api";
import { fmtDate } from "../lib/format";
import { DeleteProject } from "../components/DeleteProject";
import { Empty, ErrorBox, Field, Skeleton, StatusBadge } from "../components/ui";

export default function AdminProjects() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => api<{ projects: Project[] }>("/admin/projects"),
  });

  const toggle = useMutation({
    mutationFn: (p: Project) => patch(`/admin/projects/${p.id}`, { guestVisible: !p.guestVisible }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-projects"] }),
  });

  function confirmToggle(p: Project) {
    if (p.guestVisible && !window.confirm(`Tắt xem công khai "${p.name}"? Khách sẽ không thấy dự án này nữa.`)) return;
    toggle.mutate(p);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dự án</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> Tạo dự án
        </button>
      </div>
      {showForm && <CreateForm onDone={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["admin-projects"] }); }} />}
      {error ? <ErrorBox error={error} /> : null}
      {toggle.error ? <ErrorBox error={toggle.error} /> : null}
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : !data?.projects.length ? (
        <Empty title="Chưa có dự án" hint="Bấm “Tạo dự án” để bắt đầu." />
      ) : (
        <div className="card divide-y divide-slate-200 dark:divide-slate-800">
          {data.projects.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <Link to={`/admin/projects/${p.id}`} className="font-semibold text-brand-600 hover:underline">{p.name}</Link>
                <p className="mt-1 text-sm text-slate-500">{fmtDate(p.startDate)} – {fmtDate(p.plannedEndDate)}</p>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={p.status} />
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    role="switch"
                    className="h-5 w-5 accent-brand-600"
                    checked={p.guestVisible}
                    onChange={() => confirmToggle(p)}
                  />
                  Cho phép Khách xem
                </label>
              </div>
              <div className="w-full sm:w-auto">
                <DeleteProject id={p.id} name={p.name} onDeleted={() => qc.invalidateQueries({ queryKey: ["admin-projects"] })} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateForm({ onDone }: { onDone: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState("");
  const [startDate, setStart] = useState(today);
  const [plannedEndDate, setEnd] = useState("");
  const m = useMutation({
    mutationFn: () => post("/admin/projects", { name, startDate, plannedEndDate }),
    onSuccess: onDone,
  });
  return (
    <form
      className="card grid gap-4 p-5 sm:grid-cols-3"
      onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
    >
      <Field label="Tên dự án"><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Ngày khởi tạo"><input className="input" type="date" required value={startDate} onChange={(e) => setStart(e.target.value)} /></Field>
      <Field label="Ngày hoàn thành dự kiến"><input className="input" type="date" required min={startDate} value={plannedEndDate} onChange={(e) => setEnd(e.target.value)} /></Field>
      {m.error ? <div className="sm:col-span-3"><ErrorBox error={m.error} /></div> : null}
      <div className="sm:col-span-3"><button className="btn-primary" disabled={m.isPending}>Lưu dự án</button></div>
    </form>
  );
}
