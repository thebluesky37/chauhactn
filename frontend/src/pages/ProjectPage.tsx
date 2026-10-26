import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, EyeOff, FileSpreadsheet, FileText } from "lucide-react";
import { api, patch, type ProjectView, type UploadRecord } from "../lib/api";
import { fmtDate, fmtDateTime, fmtSize, PARTY_LABEL } from "../lib/format";
import { Empty, ErrorBox, Skeleton, StatusBadge } from "../components/ui";
import { DeleteProject } from "../components/DeleteProject";
import { AddPartyForm, AddTaskForm, NoteForm, UploadForm } from "./AdminPanels";

const TABS = ["Tổng quan", "Các bên", "Hạng mục", "Lịch sử cập nhật"] as const;

export default function ProjectPage({ admin = false }: { admin?: boolean }) {
  const { id = "" } = useParams();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Tổng quan");
  const prefix = admin ? "/admin" : "/public";
  const key = ["project", admin, id];
  const qc = useQueryClient();
  const nav = useNavigate();
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () => api<ProjectView>(`${prefix}/projects/${id}`),
  });

  const exportXlsx = useMutation({
    mutationFn: () => api<{ url: string }>(`/admin/projects/${id}/export`),
    onSuccess: (r) => { window.location.href = r.url; },
  });

  if (isLoading) return <Skeleton className="h-64" />;
  if (error || !data) return <ErrorBox error={error ?? new Error("Không tìm thấy dự án")} />;
  const { project: p, parties, tasks, uploads, notes } = data;
  const partyName = (pid: string) => parties.find((x) => x.id === pid)?.name ?? "—";
  const taskName = (tid?: string | null) => tasks.find((t) => t.id === tid)?.name;

  return (
    <div className="space-y-6">
      <Link to={admin ? "/admin" : "/"} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Quay lại
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{p.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {fmtDate(p.startDate)} – {fmtDate(p.plannedEndDate)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={p.status} />
          {admin && (
            <button className="btn-ghost" onClick={() => exportXlsx.mutate()} disabled={exportXlsx.isPending}>
              <FileSpreadsheet size={16} /> {exportXlsx.isPending ? "Đang xuất…" : "Xuất Excel"}
            </button>
          )}
          {admin && (
            <DeleteProject
              id={id}
              name={p.name}
              onDeleted={() => { qc.invalidateQueries({ queryKey: ["admin-projects"] }); nav("/admin"); }}
            />
          )}
        </div>
      </header>
      {exportXlsx.error ? <ErrorBox error={exportXlsx.error} /> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Các bên", parties.length],
          ["Hạng mục", tasks.length],
          ["Lần cập nhật", uploads.length],
          ["Cập nhật gần nhất", uploads[0] ? fmtDate(uploads[0].createdAt) : "—"],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${
              tab === t ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Tổng quan" && (
        <section className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold">Ghi chú</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
              {notes[0]?.text || "Chưa có ghi chú."}
            </p>
            {notes[0] && <p className="mt-2 text-xs text-slate-400">Cập nhật {fmtDateTime(notes[0].createdAt)}</p>}
          </div>
          {admin && <NoteForm projectId={id} initial={notes[0]?.text ?? ""} onDone={refresh} />}
        </section>
      )}

      {tab === "Các bên" && (
        <section className="space-y-4">
          {parties.length === 0 ? (
            <Empty title="Chưa có bên tham gia" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {parties.map((x) => (
                <div key={x.id} className="card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{PARTY_LABEL[x.type]}</p>
                  <p className="mt-1 font-semibold">{x.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[x.contactName, x.phone, x.email].filter(Boolean).join(" · ") || "Chưa có liên hệ"}
                  </p>
                </div>
              ))}
            </div>
          )}
          {admin && <AddPartyForm projectId={id} onDone={refresh} />}
        </section>
      )}

      {tab === "Hạng mục" && (
        <section className="space-y-4">
          {tasks.length === 0 ? (
            <Empty title="Chưa có hạng mục" hint="Hạng mục thuộc về các thầu phụ của dự án." />
          ) : (
            <div className="card divide-y divide-slate-200 dark:divide-slate-800">
              {tasks.map((t) => (
                <div key={t.id} className="flex flex-wrap justify-between gap-2 p-4">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-slate-500">{partyName(t.partyId)}</p>
                  </div>
                  <p className="text-sm text-slate-500">{fmtDate(t.startDate)} – {fmtDate(t.endDate)}</p>
                </div>
              ))}
            </div>
          )}
          {admin && <AddTaskForm projectId={id} subcontractors={parties.filter((x) => x.type === "subcontractor")} onDone={refresh} />}
        </section>
      )}

      {tab === "Lịch sử cập nhật" && (
        <section className="space-y-4">
          {admin && <UploadForm projectId={id} parties={parties} tasks={tasks} onDone={refresh} />}
          {uploads.length === 0 ? (
            <Empty title="Chưa có cập nhật" />
          ) : (
            uploads.map((u) => (
              <UploadRow
                key={u.id}
                u={u}
                admin={admin}
                projectId={id}
                partyName={partyName(u.partyId)}
                taskName={taskName(u.taskId)}
                onChanged={refresh}
              />
            ))
          )}
        </section>
      )}
    </div>
  );
}

function UploadRow({
  u, admin, projectId, partyName, taskName, onChanged,
}: {
  u: UploadRecord; admin: boolean; projectId: string; partyName: string; taskName?: string; onChanged: () => void;
}) {
  const hide = useMutation({
    mutationFn: () => patch(`/admin/projects/${projectId}/uploads/${u.id}`, { hidden: !u.hidden }),
    onSuccess: onChanged,
  });
  async function download(key: string) {
    const r = await api<{ url: string }>(`/admin/projects/${projectId}/files/download?key=${encodeURIComponent(key)}`);
    window.open(r.url, "_blank");
  }
  return (
    <article className={`card p-5 ${u.hidden ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{PARTY_LABEL[u.partyType]}</p>
          <p className="font-semibold">{partyName}{taskName ? ` · ${taskName}` : ""}</p>
        </div>
        <p className="text-sm text-slate-500">
          Gửi {fmtDate(u.sentDate)} · đăng {fmtDateTime(u.createdAt)}
        </p>
      </div>
      {u.description && <p className="mt-2 whitespace-pre-wrap text-sm">{u.description}</p>}
      {u.adminNote && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">Ghi chú: {u.adminNote}</p>}
      <ul className="mt-3 space-y-2">
        {u.files.map((f) => (
          <li key={(f.key ?? f.name) + f.version} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
            <span className="flex min-w-0 items-center gap-2">
              <FileText size={16} className="shrink-0 text-slate-400" />
              <span className="truncate">{f.name}</span>
              <span className="shrink-0 text-xs text-slate-400">v{f.version} · {fmtSize(f.size)}</span>
            </span>
            {admin && f.key && (
              <button className="btn-ghost !min-h-[36px] !px-3" onClick={() => download(f.key!)} aria-label={`Tải ${f.name}`}>
                <Download size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {admin && (
        <button className="btn-ghost mt-3" onClick={() => hide.mutate()} disabled={hide.isPending}>
          <EyeOff size={16} /> {u.hidden ? "Hiện lại bản ghi" : "Ẩn bản ghi"}
        </button>
      )}
    </article>
  );
}
