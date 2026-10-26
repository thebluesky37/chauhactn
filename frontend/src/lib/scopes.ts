// Danh mục scope công việc cố định. Giữ đồng bộ với backend/src/common/scopes.py.
export interface ScopeGroup {
  code: string;
  title: string;
  items: { id: string; name: string }[];
}

const RAW: [string, string, string[]][] = [
  ["I", "HỆ THỐNG ĐIỆN", ["Trung thế", "Hạ thế", "Hệ thống chiếu sáng, ổ cắm", "Hệ thống cấp nguồn cho máy sản xuất"]],
  ["II", "HỆ THỐNG ĐIỆN NHẸ", ["Hệ thống mạng", "Hệ thống điện thoại", "Hệ thống CCTV", "Hệ thống kiểm soát ra vào", "Hệ thống PA"]],
  ["III", "HỆ THỐNG ĐIỀU HOÀ KHÔNG KHÍ", ["Hệ thống điều Hòa Không Khí", "Hệ thống Thông Gió", "Cooling pad/air cooler"]],
  [
    "IV",
    "HỆ THỐNG CẤP THOÁT NƯỚC",
    [
      "Hệ thống Cấp nước sinh hoạt",
      "Hệ thống Thoát nước thải sinh hoạt",
      "Hệ thống cấp nước sản xuất",
      "Hệ thống thoát nước sản xuất tới hố ga hạ tầng",
      "Cấp thoát nước mưa các hạng mục có mái bê tông",
    ],
  ],
  [
    "V",
    "HỆ THỐNG PHÒNG CHÁY CHỮA CHÁY",
    [
      "Hệ thống Chữa cháy",
      "Hệ thống chữa cháy khí cho các phòng điện và điều khiển",
      "Hệ thống báo cháy",
      "Hệ thống hút khói sự cố",
      "Hệ thống đèn EXIT, EM",
      "Hệ thống chống sét",
    ],
  ],
  ["VI", "HỆ THỐNG XỬ LÝ MÔI TRƯỜNG", ["Hệ thống xử lý nước thải", "Hệ thống kiểm soát VOC và hơi hóa chất tại xưởng in lụa"]],
  ["VII", "HỆ THỐNG KHÍ NÉN", ["Hệ thống khí nén"]],
];

export const SCOPE_GROUPS: ScopeGroup[] = RAW.map(([code, title, names]) => ({
  code,
  title,
  items: names.map((name, i) => ({ id: `${code}.${i + 1}`, name })),
}));

// Kiến trúc không có scope.
export const SCOPE_PARTY_TYPES = ["investor", "coordinator", "subcontractor"];
