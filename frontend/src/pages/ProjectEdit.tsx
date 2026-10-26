import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { api, patch, type Project, type ProjectView } from "../lib/api";
import { fmtDate, PARTY_LABEL } from "../lib/format";
import { Empty, ErrorBox, Field, Skeleton } from "../components/ui";
import { DeleteProject } from "../components/DeleteProject";
import { UploadRow } from "../components/UploadRow";
import { AddPartyForm, AddTaskForm, EditPartyForm, EditTaskForm, NoteForm, UploadForm } from "./AdminPanels";

const SECTIONS = ["Thông tin dự án", "Các bên", "Hạng mục", "Đăng tải cập nhật", "Vùng nguy hiểm"] as const;
type Section = (typeof SECTIONS)[number];

const STATUS_OPTIONS = [
  ["in_progress", "Đang thực hiện"],
  ["paused", "Tạm dừng"],
  ["done", "Hoàn thành"],
] as const;

export default function ProjectEdit() {
  const { id = "" } = useParams();
  const [section, setSection] = useState<Section>("Thông tin dự án");
  const qc = useQueryClient();
  const nav = useNavigate();
  const key = ["project", true, id];
  const refresh = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["admin-projects"] });
  };
  const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: () => api<ProjectView>(`/admin/projects/${id}`) });

  if (isLoading) return <Skeleton className="h-64" />;
  if (error || !data) return <ErrorBox error={error ?? new Error("Không tìm thấy dự án")} />;
  const { project: p } = data;

  return (
    <div className="space-y-6">
      <Link to={`/admin/projects/${id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Xem dự án
      </Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Chỉnh sửa</p>
        <h1 className="text-2xl font-bold">{p.name}</h1>
      </header>

      <div className="md:grid md:grid-cols-[200px_1fr] md:gap-6">
        <nav className="mb-4 flex gap-1 overflow-x-auto md:mb-0 md:flex-col md:overflow-visible" aria-label="Mục chỉnh sửa">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              aria-current={section === s}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-left text-sm font-semibold ${
                section === s ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              } ${s === "Vùng nguy hiểm" && section !== s ? "!text-red-600" : ""}`}
            >
              {s}
            </button>
          ))}
        </nav>

        <div className="min-w-0 space-y-4">
          {section === "Thông tin dự án" && <InfoSection project={p} notes={data.notes} onDone={refresh} />}
          {section === "Các bên" && <PartiesSection id={id} data={data} onDone={refresh} />}
          {section === "Hạng mục" && <TasksSection id={id} data={data} onDone={refresh} />}
          {section === "Đăng tải cập nhật" && <UploadsSection id={id} data={data} onDone={refresh} />}
          {section === "Vùng nguy hiểm" && (
            <div className="card space-y-3 border-red-200 p-5 dark:border-red-900">
              <h2 className="font-semibold text-red-700">Xóa dự án</h2>
              <p className="text-sm text-slate-500">Xóa vĩnh viễn dự án và mọi file đã tải lên. Không hoàn tác được.</p>
              <DeleteProject id={id} name={p.name} onDeleted={() => { qc.invalidateQueries({ queryKey: ["admin-projects"] }); nav("/admin"); }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoSection({ project: p, notes, onDone }: { project: Project; notes: ProjectView["notes"]; onDone: () => void }) {
  const [name, setName] = useState(p.name);
  const [startDate, setStart] = useState(p.startDate);
  const [plannedEndDate, setPlanned] = useState(p.plannedEndDate);
  const [actualEndDate, setActual] = useState(p.actualEndDate ?? "");
  const [status, setStatus] = useState(p.status);
  const [saved, setSaved] = useState(false);
  const save = useMutation({
    mutationFn: () => patch(`/admin/projects/${p.id}`, { name, startDate, plannedEndDate, actualEndDate: actualEndDate || null, status }),
    onSuccess: () => { setSaved(true); onDone(); },
  });
  const visible = useMutation({
    mutationFn: () => patch(`/admin/projects/${p.id}`, { guestVisible: !p.guestVisible }),
    onSuccess: onDone,
  });
  function toggleVisible() {
    if (p.guestVisible && !window.confirm(`Tắt xem công khai "${p.name}"? Khách sẽ không thấy dự án này nữa.`)) return;
    visible.mutate();
  }
  const touch = <T,>(set: (v: T) => void) => (v: T) => { set(v); setSaved(false); };

  return (
    <>
      <form className="card grid gap-4 p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <h2 className="font-semibold sm:col-span-2">Thông tin dự án</h2>
        <div className="sm:col-span-2"><Field label="Tên dự án"><input className="input" required value={name} onChange={(e) => touch(setName)(e.target.value)} /></Field></div>
        <Field label="Ngày khởi tạo"><input className="input" type="date" required value={startDate} onChange={(e) => touch(setStart)(e.target.value)} /></Field>
        <Field label="Hoàn thành dự kiến"><input className="input" type="date" required min={startDate} value={plannedEndDate} onChange={(e) => touch(setPlanned)(e.target.value)} /></Field>
        <Field label="Hoàn thành thực tế (để trống nếu chưa xong)"><input className="input" type="date" value={actualEndDate} onChange={(e) => touch(setActual)(e.target.value)} /></Field>
        <Field label="Trạng thái">
          <select className="input" value={status} onChange={(e) => touch(setStatus)(e.target.value as Project["status"])}>
            {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        {save.error ? <div className="sm:col-span-2"><ErrorBox error={save.error} /></div> : null}
        <div className="flex items-center gap-3 sm:col-span-2">
          <button className="btn-primary" disabled={save.isPending}>{save.isPending ? "Đang lưu…" : "Lưu thông tin"}</button>
          {saved && <span className="text-sm text-green-700">Đã lưu.</span>}
        </div>
      </form>

      <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-semibold">Cho phép Khách xem</h2>
          <p className="text-sm text-slate-500">{p.guestVisible ? "Khách đang xem được dự án này." : "Đang tắt: Khách không thấy dự án."}</p>
        </div>
        <button className="btn-ghost" onClick={toggleVisible} disabled={visible.isPending}>
          {p.guestVisible ? <><EyeOff size={16} /> Tắt xem công khai</> : <><Eye size={16} /> Bật xem công khai</>}
        </button>
      </div>
      {visible.error ? <ErrorBox error={visible.error} /> : null}

      <NoteForm projectId={p.id} initial={notes[0]?.text ?? ""} onDone={onDone} />
    </>
  );
}

function PartiesSection({ id, data, onDone }: { id: string; data: ProjectView; onDone: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <>
      {data.parties.length === 0 ? (
        <Empty title="Chưa có bên tham gia" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.parties.map((x) =>
            editing === x.id ? (
              <EditPartyForm key={x.id} projectId={id} party={x} onDone={() => { setEditing(null); onDone(); }} onCancel={() => setEditing(null)} />
            ) : (
              <div key={x.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{PARTY_LABEL[x.type]}</p>
                  <button className="btn-ghost !min-h-[32px] !px-3 text-sm" onClick={() => setEditing(x.id)}>Sửa</button>
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
      <AddPartyForm projectId={id} onDone={onDone} />
    </>
  );
}

function TasksSection({ id, data, onDone }: { id: string; data: ProjectView; onDone: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const partyName = (pid: string) => data.parties.find((x) => x.id === pid)?.name ?? "—";
  return (
    <>
      {data.tasks.length === 0 ? (
        <Empty title="Chưa có hạng mục" hint="Hạng mục thuộc về các thầu phụ của dự án." />
      ) : (
        <div className="card divide-y divide-slate-200 dark:divide-slate-800">
          {data.tasks.map((t) =>
            editing === t.id ? (
              <EditTaskForm key={t.id} projectId={id} task={t} partyName={partyName(t.partyId)} onDone={() => { setEditing(null); onDone(); }} onCancel={() => setEditing(null)} />
            ) : (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-slate-500">{partyName(t.partyId)} · {fmtDate(t.startDate)} – {fmtDate(t.endDate)}</p>
                </div>
                <button className="btn-ghost !min-h-[32px] !px-3 text-sm" onClick={() => setEditing(t.id)}>Sửa</button>
              </div>
            ),
          )}
        </div>
      )}
      <AddTaskForm projectId={id} subcontractors={data.parties.filter((x) => x.type === "subcontractor")} onDone={onDone} />
    </>
  );
}

function HideButton({ projectId, u, onDone }: { projectId: string; u: ProjectView["uploads"][number]; onDone: () => void }) {
  const hide = useMutation({
    mutationFn: () => patch(`/admin/projects/${projectId}/uploads/${u.id}`, { hidden: !u.hidden }),
    onSuccess: onDone,
  });
  return (
    <button className="btn-ghost mt-3" onClick={() => hide.mutate()} disabled={hide.isPending}>
      <EyeOff size={16} /> {u.hidden ? "Hiện lại bản ghi" : "Ẩn bản ghi"}
    </button>
  );
}

function UploadsSection({ id, data, onDone }: { id: string; data: ProjectView; onDone: () => void }) {
  const partyName = (pid: string) => data.parties.find((x) => x.id === pid)?.name ?? "—";
  const taskName = (tid?: string | null) => data.tasks.find((t) => t.id === tid)?.name;
  return (
    <>
      <UploadForm projectId={id} parties={data.parties} tasks={data.tasks} onDone={onDone} />
      <h2 className="pt-2 font-semibold">Các bản ghi đã đăng</h2>
      {data.uploads.length === 0 ? (
        <Empty title="Chưa có cập nhật" />
      ) : (
        data.uploads.map((u) => (
          <UploadRow
            key={u.id}
            u={u}
            admin
            projectId={id}
            partyName={partyName(u.partyId)}
            taskName={taskName(u.taskId)}
            actions={<HideButton projectId={id} u={u} onDone={onDone} />}
          />
        ))
      )}
    </>
  );
}
