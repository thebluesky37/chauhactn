"""Danh mục scope công việc cố định. Giữ đồng bộ với frontend/src/lib/scopes.ts."""

SCOPE_GROUPS = [
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

# Loại bên có scope; Kiến trúc không có.
SCOPE_PARTY_TYPES = {"investor", "coordinator", "subcontractor"}

# id ("I.1", "I.2", ...) -> (mã nhóm, tên nhóm, tên scope)
SCOPES = {
    f"{code}.{i}": (code, title, name)
    for code, title, items in SCOPE_GROUPS
    for i, name in enumerate(items, 1)
}


def scope_label(scope_id):
    return SCOPES[scope_id][2]
