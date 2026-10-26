// Danh mục scope công việc do admin quản lý (dùng chung mọi dự án), lấy từ API.
import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export interface ScopeItem {
  id?: string; // mục mới chưa lưu thì chưa có id
  name: string;
}
export interface ScopeGroup {
  id?: string;
  title: string;
  items: ScopeItem[];
}

// Kiến trúc không có scope.
export const SCOPE_PARTY_TYPES = ["investor", "coordinator", "subcontractor"];

export const SCOPE_CATALOG_KEY = ["scope-catalog"];

export function useScopeCatalog() {
  return useQuery({
    queryKey: SCOPE_CATALOG_KEY,
    queryFn: () => api<{ groups: ScopeGroup[] }>("/admin/scopes").then((r) => r.groups),
  });
}

export function roman(n: number): string {
  let out = "";
  for (const [v, s] of [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]] as const) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}
