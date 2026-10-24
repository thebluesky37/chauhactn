import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Search } from "lucide-react";
import { api, type Project, type Status } from "../lib/api";
import { fmtDate, STATUS_LABEL } from "../lib/format";
import { Empty, ErrorBox, Skeleton, StatusBadge } from "../components/ui";

export default function Home() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-projects"],
    queryFn: () => api<{ projects: Project[] }>("/public/projects"),
  });

  const list = (data?.projects ?? []).filter(
    (p) => (status === "all" || p.status === status) && p.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand-900 to-brand-600 px-6 py-10 text-white sm:px-10">
        <h1 className="text-2xl font-bold sm:text-3xl">Theo dõi tiến độ dự án xây dựng</h1>
        <p className="mt-2 max-w-xl text-brand-100">
          Xem thông tin, hạng mục và các hồ sơ cập nhật mới nhất của từng dự án.
        </p>
        <div className="relative mt-6 max-w-xl">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            className="input pl-10 text-slate-900"
            placeholder="Tìm theo tên dự án…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Tìm dự án"
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo trạng thái">
        {(["all", "in_progress", "paused", "done"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${
              status === s
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-300 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900"
            }`}
          >
            {s === "all" ? "Tất cả" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {error ? <ErrorBox error={error} /> : null}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : list.length === 0 ? (
        <Empty title="Chưa có dự án phù hợp" hint="Các dự án được quản trị viên cho phép xem sẽ hiển thị tại đây." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold leading-snug">{p.name}</h2>
                <StatusBadge status={p.status} />
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays size={16} />
                {fmtDate(p.startDate)} – {fmtDate(p.plannedEndDate)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
