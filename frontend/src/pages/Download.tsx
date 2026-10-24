import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { ErrorBox } from "../components/ui";

// Đích của link trong file Excel: lấy link tải tạm (5 phút) rồi chuyển hướng. Chỉ Admin đã đăng nhập.
export default function Download() {
  const [params] = useSearchParams();
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const p = params.get("p");
    const k = params.get("k");
    if (!p || !k) {
      setError(new Error("Đường dẫn tải file không hợp lệ"));
      return;
    }
    api<{ url: string }>(`/admin/projects/${p}/files/download?key=${encodeURIComponent(k)}`)
      .then((r) => window.location.replace(r.url))
      .catch(setError);
  }, [params]);

  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      {error ? <ErrorBox error={error} /> : <p className="text-slate-500">Đang chuẩn bị tải file…</p>}
    </div>
  );
}
