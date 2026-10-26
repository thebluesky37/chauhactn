import { getToken, logout } from "./auth";

const API = (import.meta.env.VITE_API_URL as string) || "";

export type Status = "in_progress" | "paused" | "done";
export type PartyType = "investor" | "architect" | "coordinator" | "subcontractor";

export interface Project {
  id: string;
  name: string;
  startDate: string;
  plannedEndDate: string;
  actualEndDate?: string | null;
  status: Status;
  guestVisible: boolean;
  createdAt: string;
}
export interface Party {
  id: string;
  type: PartyType;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  scopeIds?: string[];
  scopeNotes?: Record<string, string>;
}
export interface Task {
  id: string;
  partyId: string;
  name: string;
  startDate: string;
  endDate: string;
}
export interface UploadFile {
  name: string;
  key?: string;
  size: number;
  version: number;
}
export interface UploadRecord {
  id: string;
  partyType: PartyType;
  partyId: string;
  taskId?: string | null;
  recipientIds: string[];
  sentDate: string;
  periodFrom?: string | null;
  periodTo?: string | null;
  description: string;
  adminNote: string;
  files: UploadFile[];
  hidden: boolean;
  createdAt: string;
}
export interface ProjectView {
  project: Project;
  parties: Party[];
  tasks: Task[];
  uploads: UploadRecord[];
  notes: { text: string; createdAt: string }[];
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (path.startsWith("/admin") && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API + path, { ...init, headers: { ...headers, ...(init.headers as object) } });
  if (res.status === 401 && path.startsWith("/admin")) {
    // Hết phiên (token Cognito hết hạn sau 1 giờ): về trang đăng nhập rồi quay lại đúng chỗ.
    logout();
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data?.message || "Có lỗi xảy ra, vui lòng thử lại");
  return data as T;
}

export const post = <T,>(path: string, body: unknown) => api<T>(path, { method: "POST", body: JSON.stringify(body) });
export const patch = <T,>(path: string, body: unknown) => api<T>(path, { method: "PATCH", body: JSON.stringify(body) });

const PART_SIZE_FALLBACK = 16 * 1024 * 1024;

/** Tải file lên S3 theo từng phần bằng presigned URL (không đi qua Lambda). */
export async function uploadFile(
  projectId: string,
  file: File,
  onProgress: (fraction: number) => void,
): Promise<{ name: string; key: string }> {
  const init = await post<{ key: string; uploadId: string; partSize: number; urls: string[] }>(
    `/admin/projects/${projectId}/files/init`,
    { filename: file.name, size: file.size, contentType: file.type },
  );
  const partSize = init.partSize || PART_SIZE_FALLBACK;
  const parts: { PartNumber: number; ETag: string }[] = [];
  let done = 0;
  for (let i = 0; i < init.urls.length; i++) {
    const blob = file.slice(i * partSize, (i + 1) * partSize);
    const res = await fetch(init.urls[i], { method: "PUT", body: blob });
    if (!res.ok) throw new ApiError(res.status, `Tải phần ${i + 1} thất bại`);
    parts.push({ PartNumber: i + 1, ETag: res.headers.get("ETag") || "" });
    done += blob.size;
    onProgress(done / file.size);
  }
  await post(`/admin/projects/${projectId}/files/complete`, { key: init.key, uploadId: init.uploadId, parts });
  return { name: file.name, key: init.key };
}
