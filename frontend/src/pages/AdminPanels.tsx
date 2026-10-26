import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { post, uploadFile, type Party, type PartyType, type Task } from "../lib/api";
import { PARTY_LABEL } from "../lib/format";
import { ErrorBox, Field } from "../components/ui";
import { api, patch } from "../lib/api";
import { SCOPE_GROUPS, SCOPE_PARTY_TYPES } from "../lib/scopes";

export function NoteForm({ projectId, initial, onDone }: { projectId: string; initial: string; onDone: () => void }) {
  const [text, setText] = useState(initial);
  const m = useMutation({
    mutationFn: () => api(`/admin/projects/${projectId}/note`, { method: "PUT", body: JSON.stringify({ text }) }),
    onSuccess: onDone,
  });
  return (
    <form className="card space-y-3 p-5" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <Field label="Sửa ghi chú">
        <textarea className="input min-h-[96px] py-2" value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      {m.error ? <ErrorBox error={m.error} /> : null}
      <button className="btn-primary" disabled={m.isPending}>Lưu ghi chú</button>
    </form>
  );
}

export function ScopePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const set = new Set(value);
  const toggleGroup = (ids: string[], on: boolean) => {
    const next = new Set(set);
    ids.forEach((i) => (on ? next.add(i) : next.delete(i)));
    onChange([...next]);
  };
  const toggleItem = (id: string, on: boolean) => toggleGroup([id], on);
  return (
    <fieldset className="space-y-3">
      <legend className="label">Scope công việc (không bắt buộc)</legend>
      {SCOPE_GROUPS.map((g) => {
        const ids = g.items.map((i) => i.id);
        const count = ids.filter((i) => set.has(i)).length;
        return (
          <div key={g.code} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                className="h-5 w-5 accent-brand-600"
                checked={count === ids.length}
                ref={(el) => { if (el) el.indeterminate = count > 0 && count < ids.length; }}
                onChange={(e) => toggleGroup(ids, e.target.checked)}
              />
              {g.code}. {g.title}
            </label>
            <div className="mt-2 grid gap-2 pl-7 sm:grid-cols-2">
              {g.items.map((i) => (
                <label key={i.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={set.has(i.id)} onChange={(e) => toggleItem(i.id, e.target.checked)} />
                  {i.name}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}

export function EditPartyForm({ projectId, party, onDone, onCancel }: { projectId: string; party: Party; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(party.name);
  const [contactName, setContact] = useState(party.contactName ?? "");
  const [phone, setPhone] = useState(party.phone ?? "");
  const [email, setEmail] = useState(party.email ?? "");
  const [scopeIds, setScopes] = useState<string[]>(party.scopeIds ?? []);
  const m = useMutation({
    mutationFn: () => patch(`/admin/projects/${projectId}/parties/${party.id}`, { name, contactName, phone, email, scopeIds }),
    onSuccess: onDone,
  });
  return (
    <form className="card col-span-full grid gap-4 p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <h3 className="font-semibold sm:col-span-2">Sửa {PARTY_LABEL[party.type]}</h3>
      <Field label="Tên"><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Người đại diện"><input className="input" value={contactName} onChange={(e) => setContact(e.target.value)} /></Field>
      <Field label="Điện thoại"><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      {SCOPE_PARTY_TYPES.includes(party.type) && <div className="sm:col-span-2"><ScopePicker value={scopeIds} onChange={setScopes} /></div>}
      {m.error ? <div className="sm:col-span-2"><ErrorBox error={m.error} /></div> : null}
      <div className="flex gap-3 sm:col-span-2">
        <button className="btn-primary" disabled={m.isPending}>Lưu</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Hủy</button>
      </div>
    </form>
  );
}

export function AddPartyForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [type, setType] = useState<PartyType>("investor");
  const [name, setName] = useState("");
  const [contactName, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [scopeIds, setScopes] = useState<string[]>([]);
  const m = useMutation({
    mutationFn: () => post(`/admin/projects/${projectId}/parties`, { type, name, contactName, phone, email, scopeIds: SCOPE_PARTY_TYPES.includes(type) ? scopeIds : [] }),
    onSuccess: () => { setName(""); setContact(""); setPhone(""); setEmail(""); setScopes([]); onDone(); },
  });
  return (
    <form className="card grid gap-4 p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <h3 className="font-semibold sm:col-span-2">Thêm bên tham gia</h3>
      <Field label="Loại bên">
        <select className="input" value={type} onChange={(e) => setType(e.target.value as PartyType)}>
          {Object.entries(PARTY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Field>
      <Field label="Tên"><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Người đại diện"><input className="input" value={contactName} onChange={(e) => setContact(e.target.value)} /></Field>
      <Field label="Điện thoại"><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      {SCOPE_PARTY_TYPES.includes(type) && <div className="sm:col-span-2"><ScopePicker value={scopeIds} onChange={setScopes} /></div>}
      {m.error ? <div className="sm:col-span-2"><ErrorBox error={m.error} /></div> : null}
      <div className="sm:col-span-2"><button className="btn-primary" disabled={m.isPending}>Thêm</button></div>
    </form>
  );
}

export function AddTaskForm({ projectId, subcontractors, onDone }: { projectId: string; subcontractors: Party[]; onDone: () => void }) {
  const [partyId, setParty] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStart] = useState("");
  const [endDate, setEnd] = useState("");
  const m = useMutation({
    mutationFn: () => post(`/admin/projects/${projectId}/tasks`, { partyId, name, startDate, endDate }),
    onSuccess: () => { setName(""); onDone(); },
  });
  if (subcontractors.length === 0) return <p className="text-sm text-slate-500">Thêm thầu phụ ở tab “Các bên” trước khi tạo hạng mục.</p>;
  return (
    <form className="card grid gap-4 p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <h3 className="font-semibold sm:col-span-2">Thêm hạng mục công việc</h3>
      <Field label="Thầu phụ">
        <select className="input" required value={partyId} onChange={(e) => setParty(e.target.value)}>
          <option value="">— Chọn —</option>
          {subcontractors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <Field label="Tên công việc"><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Ngày bắt đầu"><input className="input" type="date" required value={startDate} onChange={(e) => setStart(e.target.value)} /></Field>
      <Field label="Ngày kết thúc"><input className="input" type="date" required min={startDate} value={endDate} onChange={(e) => setEnd(e.target.value)} /></Field>
      {m.error ? <div className="sm:col-span-2"><ErrorBox error={m.error} /></div> : null}
      <div className="sm:col-span-2"><button className="btn-primary" disabled={m.isPending}>Thêm</button></div>
    </form>
  );
}

export function UploadForm({ projectId, parties, tasks, onDone }: { projectId: string; parties: Party[]; tasks: Task[]; onDone: () => void }) {
  const [partyType, setPartyType] = useState<PartyType>("investor");
  const [partyId, setPartyId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [recipientIds, setRecipients] = useState<string[]>([]);
  const [sentDate, setSent] = useState(new Date().toISOString().slice(0, 10));
  const [periodFrom, setFrom] = useState("");
  const [periodTo, setTo] = useState("");
  const [description, setDesc] = useState("");
  const [adminNote, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const ofType = parties.filter((p) => p.type === partyType);
  const recipientOptions = parties.filter((p) => p.type === "architect" || p.type === "subcontractor");

  const m = useMutation({
    mutationFn: async () => {
      const uploaded = [];
      for (const f of files) {
        uploaded.push(await uploadFile(projectId, f, (x) => setProgress((s) => ({ ...s, [f.name]: x }))));
      }
      return post(`/admin/projects/${projectId}/uploads`, {
        partyType, partyId,
        taskId: partyType === "subcontractor" ? taskId : undefined,
        recipientIds: partyType === "coordinator" ? recipientIds : [],
        sentDate,
        periodFrom: periodFrom || undefined,
        periodTo: periodTo || undefined,
        description, adminNote,
        files: uploaded,
      });
    },
    onSuccess: () => { setFiles([]); setProgress({}); setDesc(""); setNote(""); onDone(); },
  });

  return (
    <form className="card grid gap-4 p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <h3 className="font-semibold sm:col-span-2">Đăng tải file cập nhật</h3>
      <Field label="File thuộc bên">
        <select className="input" value={partyType} onChange={(e) => { setPartyType(e.target.value as PartyType); setPartyId(""); setTaskId(""); }}>
          {Object.entries(PARTY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Field>
      <Field label="Tên bên">
        <select className="input" required value={partyId} onChange={(e) => setPartyId(e.target.value)}>
          <option value="">— Chọn —</option>
          {ofType.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      {partyType === "subcontractor" && (
        <Field label="Hạng mục công việc (bắt buộc)">
          <select className="input" required value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">— Chọn —</option>
            {tasks.filter((t) => t.partyId === partyId).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
      )}
      {partyType === "coordinator" && (
        <fieldset className="sm:col-span-2">
          <legend className="label">Bên nhận (bắt buộc)</legend>
          <div className="flex flex-wrap gap-3">
            {recipientOptions.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-brand-600"
                  checked={recipientIds.includes(r.id)}
                  onChange={(e) => setRecipients((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))}
                />
                {r.name} ({PARTY_LABEL[r.type]})
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <Field label="Ngày bên đó gửi"><input className="input" type="date" required value={sentDate} onChange={(e) => setSent(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kỳ báo cáo từ"><input className="input" type="date" value={periodFrom} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="đến"><input className="input" type="date" min={periodFrom} value={periodTo} onChange={(e) => setTo(e.target.value)} /></Field>
      </div>
      <div className="sm:col-span-2"><Field label="Mô tả / nội dung cập nhật"><textarea className="input min-h-[96px] py-2" value={description} onChange={(e) => setDesc(e.target.value)} /></Field></div>
      <div className="sm:col-span-2"><Field label="Ghi chú thêm (không bắt buộc)"><textarea className="input min-h-[72px] py-2" value={adminNote} onChange={(e) => setNote(e.target.value)} /></Field></div>
      <div className="sm:col-span-2">
        <Field label="Chọn file (không bắt buộc; xls, xlsx, csv, doc, docx, pdf, dwg, dxf, rvt, rfa, jpg, png)">
          <input className="input py-2" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
        </Field>
        {files.map((f) => (
          <div key={f.name} className="mt-2 text-sm">
            {f.name}
            <div className="mt-1 h-2 overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
              <div className="h-full bg-brand-600 transition-all" style={{ width: `${Math.round((progress[f.name] ?? 0) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      {m.error ? <div className="sm:col-span-2"><ErrorBox error={m.error} /></div> : null}
      <div className="sm:col-span-2"><button className="btn-primary" disabled={m.isPending}>{m.isPending ? "Đang tải lên…" : "Đăng tải"}</button></div>
    </form>
  );
}
