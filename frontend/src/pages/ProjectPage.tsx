import { Fragment, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, EyeOff, FileSpreadsheet, FileText } from "lucide-react";
import { api, patch, type Party, type PartyType, type ProjectView, type UploadRecord } from "../lib/api";
import { fmtDate, fmtDateTime, fmtSize, PARTY_LABEL } from "../lib/format";
import { Empty, ErrorBox, Skeleton, StatusBadge } from "../components/ui";
import { DeleteProject } from "../components/DeleteProject";
import { roman, useScopeCatalog } from "../lib/scopes";
import { AddPartyForm, AddTaskForm, EditPartyForm, NoteForm, UploadForm } from "./AdminPanels";

const EXPORT_PRESETS: { label: string; types: PartyType[] }[] = [
  { label: "Chủ đầu tư + Thầu phụ", types: ["investor", "subcontractor"] },
  { label: "Chủ đầu tư + Tổng thầu MEP", types: ["investor", "coordinator"] },
];

const ORDER: PartyType[] = ["investor", "architect", "coordinator", "subcontractor"];

const ALL_TABS = ["Tổng quan", "Các bên", "Ma trận scope", "Hạng mục", "Lịch sử cập nhật"] as const;

export default function ProjectPage({ admin = false }: { admin?: boolean }) {
  const { id = "" } = useParams();
  const [tab, setTab] = useState<(typeof ALL_TABS)[number]>("Tổng quan");
  const TABS = admin ? ALL_TABS : ALL_TABS.filter((t) => t !== "Ma trận scope"); // ma trận chỉ dành cho admin
  const prefix = admin ? "/admin" : "/public";
  const key = ["project", admin, id];
  const qc = useQueryClient();
  const nav = useNavigate();
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () => api<ProjectView>(`${prefix}/projects/${id}`),
  });

  const [exportPreset, setExportPreset] = useState(0);
  const [editingParty, setEditingParty] = useState<string | null>(null);
  const exportXlsx = useMutation({
    mutationFn: () => api<{ url: string }>(`/admin/projects/${id}/export?parties=${EXPORT_PRESETS[exportPreset].types.join(",")}`),
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
            <details className="relative">
              <summary className="btn-ghost cursor-pointer list-none">
                <FileSpreadsheet size={16} /> {exportXlsx.isPending ? "Đang xuất…" : "Xuất Excel"}
              </summary>
              <div className="card absolute right-0 z-10 mt-2 w-64 space-y-2 p-4">
                <p className="text-sm font-semibold">Các bên cần xuất</p>
                {EXPORT_PRESETS.map((x, i) => (
                  <label key={x.label} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="export-preset"
                      className="h-5 w-5 accent-brand-600"
                      checked={exportPreset === i}
                      onChange={() => setExportPreset(i)}
                    />
                    {i + 1}. {x.label}
                  </label>
                ))}
                <button
                  type="button"
                  className="btn-primary w-full"
                  onClick={() => exportXlsx.mutate()}
                  disabled={exportXlsx.isPending}
                >
                  Tải file Excel
                </button>
              </div>
            </details>
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
          <Overview data={data} />
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
              {parties.map((x) =>
                editingParty === x.id ? (
                  <EditPartyForm
                    key={x.id}
                    projectId={id}
                    party={x}
                    onDone={() => { setEditingParty(null); refresh(); }}
                    onCancel={() => setEditingParty(null)}
                  />
                ) : (
                  <div key={x.id} className="card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{PARTY_LABEL[x.type]}</p>
                      {admin && <button className="btn-ghost !min-h-[32px] !px-3 text-sm" onClick={() => setEditingParty(x.id)}>Sửa</button>}
                    </div>
                    <p className="mt-1 font-semibold">{x.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {[x.contactName, x.phone, x.email].filter(Boolean).join(" · ") || "Chưa có liên hệ"}
                    </p>
                  </div>
                ),
              )}
            </div>
          )}
          {admin && <AddPartyForm projectId={id} onDone={refresh} />}
        </section>
      )}

      {admin && tab === "Ma trận scope" && (
        <section className="space-y-3">
          <p className="text-sm text-slate-500">X: bên được giao scope. Bấm hàng nhóm để thu gọn. Sửa scope ở tab “Các bên”.</p>
          {parties.length === 0 ? <Empty title="Chưa có bên tham gia" /> : <ScopeMatrix parties={parties} />}
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
          {uploads.length === 0 && <Empty title="Chưa có cập nhật" />}
          {(Object.keys(PARTY_LABEL) as PartyType[]).map((t) => {
            const list = uploads.filter((u) => u.partyType === t);
            return (
              <div key={t} className="space-y-3">
                <h3 className="font-semibold">Lịch sử đăng tải của {PARTY_LABEL[t]} ({list.length})</h3>
                {list.length === 0 ? (
                  <p className="text-sm text-slate-400">Chưa có cập nhật.</p>
                ) : (
                  list.map((u) => (
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
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

function ScopeMatrix({ parties }: { parties: Party[] }) {
  const { data: catalog = [], isLoading, error } = useScopeCatalog();
  const cols = [...parties].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type) || a.name.localeCompare(b.name));
  const has = (p: Party, sid: string) => (p.scopeIds ?? []).includes(sid);
  const cell = "border border-slate-200 px-3 py-2 dark:border-slate-800";
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (code: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      if (!n.delete(code)) n.add(code);
      return n;
    });
  const allCollapsed = collapsed.size === catalog.length;
  if (isLoading) return <Skeleton className="h-40" />;
  if (error) return <ErrorBox error={error} />;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="bg-brand-600 text-white">
            <th className={`${cell} text-left`}>
              <button type="button" className="text-left font-semibold" onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(catalog.map((g) => g.id!)))}>
                Scope công việc <span className="text-xs font-normal opacity-80">({allCollapsed ? "mở hết" : "thu gọn hết"})</span>
              </button>
            </th>
            {cols.map((p) => (
              <th key={p.id} className={`${cell} min-w-[140px] text-center font-semibold`}>
                <div>{p.name}</div>
                <div className="text-xs font-normal opacity-80">{PARTY_LABEL[p.type]}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {catalog.map((g, gi) => (
            <Fragment key={g.id}>
              <tr className="cursor-pointer bg-brand-50 font-semibold dark:bg-slate-800" onClick={() => toggle(g.id!)}>
                <td className={cell}>
                  <span className="mr-2 inline-block w-3 text-xs">{collapsed.has(g.id!) ? "▶" : "▼"}</span>
                  {roman(gi + 1)}. {g.title}
                </td>
                {cols.map((p) => {
                  const n = g.items.filter((i) => has(p, i.id!)).length;
                  // khi thu gọn: hiện số scope con đã chọn; mở ra thì để trống
                  return <td key={p.id} className={`${cell} text-center text-xs font-normal text-slate-500`}>{collapsed.has(g.id!) && n > 0 ? `${n}/${g.items.length}` : ""}</td>;
                })}
              </tr>
              {!collapsed.has(g.id!) && g.items.map((i, n) => {
                const withNote = cols.filter((p) => p.scopeNotes?.[i.id!]);
                return (
                  <Fragment key={i.id}>
                    <tr>
                      <td className={`${cell} pl-6`}>{n + 1}. {i.name}</td>
                      {cols.map((p) => (
                        <td key={p.id} className={`${cell} text-center font-bold text-brand-600`}>{has(p, i.id!) ? "X" : ""}</td>
                      ))}
                    </tr>
                    {withNote.length > 0 && (
                      <tr className="text-xs italic text-slate-500">
                        <td className={`${cell} pl-10`}>Ghi chú</td>
                        {cols.map((p) => (
                          <td key={p.id} className={`${cell} whitespace-pre-wrap`}>{p.scopeNotes?.[i.id!] ?? ""}</td>
                        ))}
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DAY = 86_400_000;
const toDay = (iso: string) => new Date(iso.slice(0, 10) + "T00:00:00").getTime();

function Overview({ data }: { data: ProjectView }) {
  const { project: p, parties, tasks, uploads } = data;
  const live = uploads.filter((u) => !u.hidden);
  const files = live.reduce((n, u) => n + u.files.length, 0);
  const latest = live[0]; // đã sắp mới nhất trước
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const start = toDay(p.startDate);
  const end = toDay(p.plannedEndDate);
  const total = Math.max(1, Math.round((end - start) / DAY));
  const elapsed = Math.min(total, Math.max(0, Math.round((today - start) / DAY)));
  const pct = Math.round((elapsed / total) * 100);
  const daysLeft = Math.round((end - today) / DAY);
  const timeNote =
    p.status === "done" ? "Đã hoàn thành"
    : today < start ? `Chưa bắt đầu (còn ${Math.round((start - today) / DAY)} ngày)`
    : daysLeft >= 0 ? `Còn ${daysLeft} ngày đến hạn dự kiến`
    : `Quá hạn dự kiến ${-daysLeft} ngày`;
  const overdue = p.status !== "done" && daysLeft < 0;

  const byType = (Object.keys(PARTY_LABEL) as PartyType[]).map((t) => ({ t, list: parties.filter((x) => x.type === t) }));
  const taskState = (t: { startDate: string; endDate: string }) =>
    today < toDay(t.startDate) ? "Chưa bắt đầu" : today > toDay(t.endDate) ? "Quá hạn" : "Đang thực hiện";
  const partyName = (id: string) => parties.find((x) => x.id === id)?.name ?? "—";
  const recent = live.slice(0, 5);
  const kpis: [string | number, string][] = [
    [parties.length, "Bên tham gia"],
    [tasks.length, "Hạng mục"],
    [live.length, "Lần đăng tải"],
    [files, "File đã đăng"],
    [latest ? fmtDate(latest.createdAt) : "—", "Cập nhật gần nhất"],
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {kpis.map(([v, label]) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-2xl font-bold text-brand-600">{v}</p>
            <p className="mt-1 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="card space-y-3 p-5">
        <h2 className="font-semibold">Thông tin dự án</h2>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Trạng thái</dt><dd><StatusBadge status={p.status} /></dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Ngày khởi tạo</dt><dd>{fmtDate(p.startDate)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Hoàn thành dự kiến</dt><dd>{fmtDate(p.plannedEndDate)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Hoàn thành thực tế</dt><dd>{p.actualEndDate ? fmtDate(p.actualEndDate) : "Chưa hoàn thành"}</dd></div>
        </dl>
        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>Thời gian đã qua {pct}% ({elapsed}/{total} ngày)</span>
            <span className={overdue ? "font-semibold text-red-600" : ""}>{timeNote}</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
            <div className={`h-full ${overdue ? "bg-red-500" : "bg-brand-600"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold">Các bên tham gia</h2>
          {parties.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">Chưa có bên tham gia.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {byType.filter((x) => x.list.length > 0).map(({ t, list }) => (
                <li key={t}>
                  <span className="font-medium">{PARTY_LABEL[t]} ({list.length}):</span>{" "}
                  <span className="text-slate-600 dark:text-slate-300">{list.map((x) => x.name).join(", ")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold">Hạng mục thầu phụ</h2>
          {tasks.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">Chưa có hạng mục.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              {tasks.map((t) => {
                const st = taskState(t);
                const n = live.filter((u) => u.taskId === t.id).length;
                return (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-slate-500">{partyName(t.partyId)} · {fmtDate(t.startDate)} – {fmtDate(t.endDate)} · {n} lần cập nhật</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st === "Quá hạn" ? "bg-red-100 text-red-700" : st === "Đang thực hiện" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{st}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold">Cập nhật gần đây</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">Chưa có cập nhật.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 text-sm dark:divide-slate-800">
            {recent.map((u) => (
              <li key={u.id} className="py-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <p><span className="font-medium">{partyName(u.partyId)}</span> <span className="text-xs text-slate-500">({PARTY_LABEL[u.partyType]})</span></p>
                  <p className="text-xs text-slate-500">{fmtDateTime(u.createdAt)} · {u.files.length} file</p>
                </div>
                {u.description && <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap text-slate-600 dark:text-slate-300">{u.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
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
