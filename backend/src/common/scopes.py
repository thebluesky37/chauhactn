"""Danh mục scope công việc dùng chung cho mọi dự án.

Danh mục lưu trong DynamoDB (admin sửa được); chưa lưu thì dùng DEFAULT_CATALOG. Mỗi nhóm và mỗi scope có id ổn định
(các bên lưu id này), số thứ tự hiển thị (I, II / 1, 2) tính theo vị trí nên không lưu.
"""
import copy
import uuid

_DEFAULT = [
    ("I", "HỆ THỐNG ĐIỆN", [
        "Trung thế",
        "Hạ thế",
        "Hệ thống chiếu sáng, ổ cắm",
        "Hệ thống cấp nguồn cho máy sản xuất",
    ]),
    ("II", "HỆ THỐNG ĐIỆN NHẸ", [
        "Hệ thống mạng",
        "Hệ thống điện thoại",
        "Hệ thống CCTV",
        "Hệ thống kiểm soát ra vào",
        "Hệ thống PA",
    ]),
    ("III", "HỆ THỐNG ĐIỀU HOÀ KHÔNG KHÍ", [
        "Hệ thống điều Hòa Không Khí",
        "Hệ thống Thông Gió",
        "Cooling pad/air cooler",
    ]),
    ("IV", "HỆ THỐNG CẤP THOÁT NƯỚC", [
        "Hệ thống Cấp nước sinh hoạt",
        "Hệ thống Thoát nước thải sinh hoạt",
        "Hệ thống cấp nước sản xuất",
        "Hệ thống thoát nước sản xuất tới hố ga hạ tầng",
        "Cấp thoát nước mưa các hạng mục có mái bê tông",
    ]),
    ("V", "HỆ THỐNG PHÒNG CHÁY CHỮA CHÁY", [
        "Hệ thống Chữa cháy",
        "Hệ thống chữa cháy khí cho các phòng điện và điều khiển",
        "Hệ thống báo cháy",
        "Hệ thống hút khói sự cố",
        "Hệ thống đèn EXIT, EM",
        "Hệ thống chống sét",
    ]),
    ("VI", "HỆ THỐNG XỬ LÝ MÔI TRƯỜNG", [
        "Hệ thống xử lý nước thải",
        "Hệ thống kiểm soát VOC và hơi hóa chất tại xưởng in lụa",
    ]),
    ("VII", "HỆ THỐNG KHÍ NÉN", [
        "Hệ thống khí nén",
    ]),
]

# Kiến trúc không có scope.
SCOPE_PARTY_TYPES = {"investor", "coordinator", "subcontractor"}

MAX_GROUPS = 50
MAX_ITEMS = 200
MAX_TEXT = 200


def default_catalog():
    return [
        {"id": code, "title": title, "items": [{"id": f"{code}.{i}", "name": n} for i, n in enumerate(items, 1)]}
        for code, title, items in copy.deepcopy(_DEFAULT)
    ]


def roman(n):
    out = ""
    for value, sym in ((10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")):
        while n >= value:
            out += sym
            n -= value
    return out


def scope_ids(catalog):
    """Mọi id scope theo thứ tự danh mục."""
    return [i["id"] for g in catalog for i in g["items"]]


def normalize(groups):
    """Kiểm tra và chuẩn hóa danh mục admin gửi lên; mục mới (chưa có id) được cấp id. Lỗi thì ném ValueError."""
    if not isinstance(groups, list):
        raise ValueError("Danh mục phải là một danh sách nhóm")
    if len(groups) > MAX_GROUPS:
        raise ValueError(f"Tối đa {MAX_GROUPS} nhóm")
    seen, out, total = set(), [], 0
    for g in groups:
        if not isinstance(g, dict):
            raise ValueError("Nhóm không hợp lệ")
        title = str(g.get("title", "")).strip()
        if not title:
            raise ValueError("Tên nhóm không được để trống")
        if len(title) > MAX_TEXT:
            raise ValueError("Tên nhóm quá dài")
        items = []
        for it in g.get("items") or []:
            name = str((it or {}).get("name", "")).strip()
            if not name:
                raise ValueError(f"Nhóm “{title}” có scope để trống tên")
            if len(name) > MAX_TEXT:
                raise ValueError("Tên scope quá dài")
            items.append({"id": _unique(it.get("id"), seen, "s"), "name": name})
        total += len(items)
        out.append({"id": _unique(g.get("id"), seen, "g"), "title": title, "items": items})
    if total > MAX_ITEMS:
        raise ValueError(f"Tối đa {MAX_ITEMS} scope")
    return out


def _unique(given, seen, prefix):
    if given and isinstance(given, str) and given not in seen:
        seen.add(given)
        return given
    if given and given in seen:
        raise ValueError("Trùng id trong danh mục")
    new = f"{prefix}{uuid.uuid4().hex[:8]}"
    seen.add(new)
    return new
