import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { ErrorBox } from "./ui";

// Xóa vĩnh viễn dự án + toàn bộ file đã tải lên. Bắt gõ lại đúng tên dự án để tránh xóa nhầm.
export function DeleteProject({ id, name, onDeleted }: { id: string; name: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const m = useMutation({
    mutationFn: () => api(`/admin/projects/${id}`, { method: "DELETE" }),
    onSuccess: onDeleted,
  });

  if (!open) {
    return (
      <button className="btn-ghost text-red-600" onClick={() => setOpen(true)}>
        <Trash2 size={16} /> Xóa
      </button>
    );
  }
  return (
    <form
      className="w-full space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950"
      onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
    >
      <p className="font-semibold text-red-800 dark:text-red-300">Xóa vĩnh viễn dự án “{name}”?</p>
      <p className="text-red-800 dark:text-red-300">
        Toàn bộ các bên, hạng mục, bản ghi đăng tải, lịch sử sửa và <b>mọi file đã tải lên</b> sẽ bị xóa và không khôi phục được.
      </p>
      <label className="block">
        Gõ lại tên dự án để xác nhận:
        <input className="input mt-1" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
      </label>
      {m.error ? <ErrorBox error={m.error} /> : null}
      <div className="flex gap-2">
        <button className="btn-primary !bg-red-600 hover:!bg-red-700" disabled={typed.trim() !== name.trim() || m.isPending}>
          {m.isPending ? "Đang xóa…" : "Xóa vĩnh viễn"}
        </button>
        <button type="button" className="btn-ghost" onClick={() => { setOpen(false); setTyped(""); }} disabled={m.isPending}>Hủy</button>
      </div>
    </form>
  );
}
