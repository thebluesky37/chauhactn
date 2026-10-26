import type { ReactNode } from "react";
import { Download, FileText } from "lucide-react";
import { api, type UploadRecord } from "../lib/api";
import { fmtDate, fmtDateTime, fmtSize, PARTY_LABEL } from "../lib/format";

// Một bản ghi đăng tải. Admin tải được file; `actions` là chỗ để trang Chỉnh sửa gắn nút (ví dụ Ẩn/Hiện).
export function UploadRow({
  u, admin, projectId, partyName, taskName, actions,
}: {
  u: UploadRecord; admin: boolean; projectId: string; partyName: string; taskName?: string; actions?: ReactNode;
}) {
  async function download(key: string) {
    const r = await api<{ url: string }>(`/admin/projects/${projectId}/files/download?key=${encodeURIComponent(key)}`);
    window.open(r.url, "_blank");
  }
  return (
    <article className={`card p-5 ${u.hidden ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            {PARTY_LABEL[u.partyType]}
            {u.hidden && <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">Đã ẩn</span>}
          </p>
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
      {actions}
    </article>
  );
}
