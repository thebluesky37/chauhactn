"""Xuất toàn bộ thông tin dự án ra một tab Excel, trình bày như một báo cáo."""
import io
from urllib.parse import quote
from datetime import datetime, timedelta, timezone

import xlsxwriter

from common.scopes import SCOPE_PARTY_TYPES, default_catalog, roman

VN = timezone(timedelta(hours=7))

STATUS = {"in_progress": "Đang thực hiện", "paused": "Tạm dừng", "done": "Hoàn thành"}
PARTY = {
    "investor": "Chủ đầu tư",
    "architect": "Kiến trúc",
    "coordinator": "Tổng thầu MEP",
    "subcontractor": "Thầu phụ",
}

NAVY = "#1E3A8A"
BLUE = "#1D4ED8"
LIGHT = "#EFF6FF"
GRAY = "#64748B"
BORDER = "#CBD5E1"

# Cột B..G dùng chung cho mọi bảng; độ rộng chọn để cả 4 khối đều cân đối.
WIDTHS = {"A": 2, "B": 22, "C": 30, "D": 24, "E": 16, "F": 28, "G": 24,
          "H": 36, "I": 30, "J": 36, "K": 12, "L": 13, "M": 10, "N": 18, "O": 12, "P": 2}
LAST_COL = 14  # cột O


def _date(s):
    if not s:
        return None
    try:
        return datetime.strptime(s[:10], "%Y-%m-%d")
    except ValueError:
        return None


def _dt_vn(iso):
    if not iso:
        return None
    d = datetime.strptime(iso[:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
    return d.astimezone(VN).replace(tzinfo=None)


def _fmt_d(d):
    return d.strftime("%d/%m/%Y") if d else ""


def export_filename(project_name, now):
    safe = "".join(c for c in project_name if c not in '\\/:*?"<>|').strip() or "du-an"
    return f"{safe}_{now.strftime('%Y-%m-%d')}.xlsx"


def build_workbook(view, now=None, link_base=None, party_types=None, catalog=None):
    """view: kết quả db.project_view (đã gồm cả bản ghi ẩn). Trả về bytes của file .xlsx.

    party_types: danh sách loại bên cần xuất (None = tất cả); lọc các bên, hạng mục và lịch sử đăng tải.
    link_base: địa chỉ website (ví dụ https://www.hachauctn.id.vn). Có thì tên file là link bấm được,
    mở trang /download (yêu cầu Admin đăng nhập) rồi tải file. Link không hết hạn như presigned URL.
    """
    now = now or datetime.now(VN).replace(tzinfo=None)
    catalog = catalog if catalog is not None else default_catalog()
    types = [t for t in PARTY if party_types is None or t in party_types]
    p = view["project"]
    parties = sorted((x for x in view["parties"] if x["type"] in types), key=lambda x: (list(PARTY).index(x["type"]), x["name"]))
    selected_ids = {x["id"] for x in parties}
    tasks = [t for t in view["tasks"] if t["partyId"] in selected_ids]
    uploads = sorted((u for u in view["uploads"] if u["partyType"] in types), key=lambda u: u["createdAt"], reverse=True)
    notes = view["notes"]

    party_by_id = {x["id"]: x for x in view["parties"]}
    task_by_id = {t["id"]: t for t in tasks}

    buf = io.BytesIO()
    wb = xlsxwriter.Workbook(buf, {"in_memory": True, "default_date_format": "dd/mm/yyyy"})
    wb.set_properties({"title": f"Báo cáo dự án {p['name']}", "subject": "Báo cáo dự án", "comments": "Xuất từ hệ thống Quản lý Dự án"})
    ws = wb.add_worksheet("Báo cáo dự án")

    base = {"font_name": "Calibri", "font_size": 11, "valign": "vcenter"}

    def f(**kw):
        return wb.add_format({**base, **kw})

    title = f(bold=True, font_size=20, font_color="#FFFFFF", bg_color=NAVY, indent=1)
    subtitle = f(font_size=11, font_color="#DBEAFE", bg_color=NAVY, indent=1)
    section = f(bold=True, font_size=13, font_color=BLUE, bottom=2, bottom_color=BLUE)
    label = f(bold=True, font_color=GRAY, bg_color=LIGHT, border=1, border_color=BORDER, indent=1)
    value = f(border=1, border_color=BORDER, indent=1, text_wrap=True)
    value_date = f(border=1, border_color=BORDER, indent=1, align="left", num_format="dd/mm/yyyy")
    kpi_num = f(bold=True, font_size=22, font_color=BLUE, align="center", bg_color=LIGHT, top=1, left=1, right=1, border_color=BORDER)
    kpi_lbl = f(font_size=10, font_color=GRAY, align="center", bg_color=LIGHT, bottom=1, left=1, right=1, border_color=BORDER)
    kpi_txt = f(bold=True, font_size=13, font_color=BLUE, align="center", bg_color=LIGHT, top=1, left=1, right=1, border_color=BORDER)
    empty = f(italic=True, font_color=GRAY, indent=1, border=1, border_color=BORDER)
    note_fmt = f(text_wrap=True, valign="top", border=1, border_color=BORDER, indent=1)
    note_meta = f(italic=True, font_size=10, font_color=GRAY)
    sub_head = f(bold=True, font_size=12, font_color=NAVY)
    grp = f(bold=True, font_color=BLUE, bg_color=LIGHT, border=1, border_color=BORDER, indent=1)
    cell_left = f(border=1, border_color=BORDER, indent=2, text_wrap=True, valign="top")
    cell_x = f(bold=True, font_color=BLUE, align="center", border=1, border_color=BORDER, valign="top")
    cell_note_lbl = f(italic=True, font_color=GRAY, border=1, border_color=BORDER, indent=3, valign="top")
    cell_note = f(italic=True, font_color=GRAY, text_wrap=True, border=1, border_color=BORDER, valign="top")

    link_fmt = f(font_color=BLUE, underline=1, text_wrap=True, valign="top", indent=1)
    t_text = f(text_wrap=True, valign="top", indent=1)
    t_center = f(align="center", valign="top")
    t_date = f(align="center", valign="top", num_format="dd/mm/yyyy")
    t_dt = f(align="center", valign="top", num_format="dd/mm/yyyy hh:mm")
    t_int = f(align="center", valign="top", num_format="0")
    t_mb = f(align="right", valign="top", num_format='#,##0.00 "MB"')

    ws.hide_gridlines(2)
    for col, w in WIDTHS.items():
        ws.set_column(f"{col}:{col}", w)

    # ----- Banner -----
    ws.set_row(1, 38)
    ws.merge_range(1, 1, 1, LAST_COL, f"BÁO CÁO DỰ ÁN  ·  {p['name'].upper()}", title)
    ws.set_row(2, 22)
    ws.merge_range(2, 1, 2, LAST_COL, f"Xuất lúc {now.strftime('%H:%M %d/%m/%Y')} (UTC+7)  ·  Tài liệu nội bộ dành cho Admin", subtitle)
    ws.freeze_panes(4, 0)

    row = 4

    def heading(text):
        nonlocal row
        row += 1
        ws.set_row(row, 24)
        for c in range(1, LAST_COL + 1):
            ws.write_blank(row, c, None, section)
        ws.write(row, 1, text, section)
        row += 2

    # ----- Chỉ số tổng quan -----
    total_files = sum(len(u.get("files", [])) for u in uploads)
    last_update = _dt_vn(uploads[0]["createdAt"]) if uploads else None
    ws.set_row(row, 36)
    ws.set_row(row + 1, 20)
    for c, (num, lbl) in enumerate(
        [(len(parties), "Bên tham gia"), (len(tasks), "Hạng mục"), (len(uploads), "Lần đăng tải"), (total_files, "File đã đăng")]
    ):
        ws.write_number(row, 1 + c, num, kpi_num)
        ws.write(row + 1, 1 + c, lbl, kpi_lbl)
    ws.merge_range(row, 5, row, 6, last_update.strftime("%d/%m/%Y %H:%M") if last_update else "—", kpi_txt)
    ws.merge_range(row + 1, 5, row + 1, 6, "Cập nhật gần nhất", kpi_lbl)
    row += 2

    # ----- 1. Thông tin chung -----
    heading("1. THÔNG TIN CHUNG")
    info = [
        ("Tên dự án", p["name"], None),
        ("Trạng thái", STATUS.get(p["status"], p["status"]), None),
        ("Ngày khởi tạo", None, _date(p.get("startDate"))),
        ("Hoàn thành dự kiến", None, _date(p.get("plannedEndDate"))),
        ("Hoàn thành thực tế", None if p.get("actualEndDate") else "Chưa hoàn thành", _date(p.get("actualEndDate"))),
        ("Cho phép Khách xem", "Có" if p.get("guestVisible") else "Không", None),
    ]
    for i, (k, text, d) in enumerate(info):
        r = row + i
        ws.write(r, 1, k, label)
        if d is not None:
            ws.merge_range(r, 2, r, 3, "", value_date)
            ws.write_datetime(r, 2, d, value_date)
        else:
            ws.merge_range(r, 2, r, 3, text or "", value)
    row += len(info)

    # ----- 2. Ghi chú -----
    heading("2. GHI CHÚ")
    if notes:
        ws.set_row(row, max(30, 16 * (notes[0]["text"].count("\n") + 1 + len(notes[0]["text"]) // 110)))
        ws.merge_range(row, 1, row, 9, notes[0]["text"] or "(trống)", note_fmt)
        row += 1
        ws.write(row, 1, f"Sửa lần cuối {_dt_vn(notes[0]['createdAt']).strftime('%H:%M %d/%m/%Y')}", note_meta)
        row += 1
    else:
        ws.merge_range(row, 1, row, 9, "Chưa có ghi chú.", empty)
        row += 1

    def table(columns, data, name):
        """columns: [(tiêu đề, format)]; data: danh sách dòng. Không có dữ liệu thì ghi dòng thông báo."""
        nonlocal row
        if not data:
            ws.merge_range(row, 1, row, 1 + len(columns) - 1, "Chưa có dữ liệu.", empty)
            row += 1
            return None
        first_data_row = row + 1
        ws.set_row(row, 28)
        ws.add_table(
            row, 1, row + len(data), len(columns),
            {
                "name": name,
                "style": "Table Style Medium 2",
                "data": data,
                "columns": [{"header": h, "format": fm, "header_format": hdr} for h, fm in columns],
            },
        )
        row += len(data) + 1
        return first_data_row

    hdr = f(bold=True, font_color="#FFFFFF", bg_color=BLUE, align="center", text_wrap=True, border=1, border_color="#FFFFFF")

    # ----- 3. Scope công việc (hàng = scope, cột = bên, X = được giao) -----
    heading("3. SCOPE CÔNG VIỆC")
    scope_parties = [x for x in parties if x["type"] in SCOPE_PARTY_TYPES]
    if not scope_parties:
        ws.merge_range(row, 1, row, 3, "Chưa có dữ liệu.", empty)
        row += 1
    else:
        ws.set_row(row, 40)
        ws.merge_range(row, 1, row, 2, "Scope công việc", hdr)
        for j, x in enumerate(scope_parties):
            ws.write(row, 3 + j, f"{x['name']}\n({PARTY[x['type']]})", hdr)
        row += 1
        for gi, g in enumerate(catalog, 1):
            ws.merge_range(row, 1, row, 2, f"{roman(gi)}. {g['title']}", grp)
            for j in range(len(scope_parties)):
                ws.write_blank(row, 3 + j, None, grp)
            row += 1
            for i, it in enumerate(g["items"], 1):
                sid = it["id"]
                ws.merge_range(row, 1, row, 2, f"{i}. {it['name']}", cell_left)
                for j, x in enumerate(scope_parties):
                    ws.write(row, 3 + j, "X" if sid in x.get("scopeIds", []) else "", cell_x)
                row += 1
                if any(x.get("scopeNotes", {}).get(sid) for x in scope_parties):
                    ws.merge_range(row, 1, row, 2, "Ghi chú", cell_note_lbl)
                    for j, x in enumerate(scope_parties):
                        ws.write(row, 3 + j, x.get("scopeNotes", {}).get(sid, ""), cell_note)
                    row += 1

    # ----- 4. Hạng mục thầu phụ -----
    heading("4. HẠNG MỤC THẦU PHỤ")
    counts, latest = {}, {}
    for u in uploads:
        tid = u.get("taskId")
        if tid:
            counts[tid] = counts.get(tid, 0) + 1
            latest.setdefault(tid, _dt_vn(u["createdAt"]))  # uploads đã xếp mới nhất trước
    task_rows = []
    for t in sorted(tasks, key=lambda x: (x["startDate"], x["name"])):
        task_rows.append([
            party_by_id.get(t["partyId"], {}).get("name", "—"),
            t["name"],
            latest.get(t["id"]) or "Chưa có",
            _date(t["startDate"]),
            _date(t["endDate"]),
            counts.get(t["id"], 0),
        ])
    table(
        [("Thầu phụ", t_text), ("Công việc", t_text), ("Cập nhật gần nhất", t_dt), ("Bắt đầu", t_date),
         ("Kết thúc", t_date), ("Số lần cập nhật", t_int)],
        task_rows, "tblHangMuc",
    )

    # ----- 5. Lịch sử đăng tải (mỗi bên một bảng, mỗi file một dòng) -----
    heading("5. LỊCH SỬ ĐĂNG TẢI")
    for n, ptype in enumerate(PARTY, 1):
        if ptype not in types:
            continue
        plabel = PARTY[ptype]
        ws.write(row, 1, f"5.{n}. Lịch sử đăng tải của {plabel}", sub_head)
        row += 1
        up_rows, up_keys = [], []
        for u in (x for x in uploads if x["partyType"] == ptype):
            party = party_by_id.get(u["partyId"], {})
            task = task_by_id.get(u.get("taskId"), {})
            # lần cập nhật không kèm file vẫn hiện một dòng
            for fl in u.get("files") or [None]:
                ext = fl["name"].rsplit(".", 1)[-1].upper() if fl and "." in fl["name"] else ""
                up_rows.append([
                    party.get("name", "—"),
                    task.get("name", ""),
                    _date(u.get("sentDate")),
                    u.get("description", ""),
                    u.get("adminNote", ""),
                    fl["name"] if fl else "",
                    ext,
                    fl["size"] / 1048576 if fl else None,
                    fl.get("version", 1) if fl else None,
                    _dt_vn(u["createdAt"]),
                    "Đã ẩn" if u.get("hidden") else "Hiện",
                ])
                up_keys.append(fl.get("key") if fl else None)
        first = table(
            [("Tên bên", t_text), ("Hạng mục", t_text), ("Ngày gửi", t_date),
             ("Mô tả", t_text), ("Ghi chú Admin", t_text), ("Tên file", t_text), ("Loại", t_center),
             ("Dung lượng", t_mb), ("Phiên bản", t_int), ("Đăng tải lúc", t_dt), ("Trạng thái", t_center)],
            up_rows, f"tblLichSu{n}",
        )
        if first is not None and link_base:
            for i, key in enumerate(up_keys):
                if key:
                    url = f"{link_base.rstrip('/')}/download?p={quote(view['project']['id'], safe='')}&k={quote(key, safe='')}"
                    ws.write_url(first + i, 6, url, link_fmt, string=up_rows[i][5], tip="Bấm để tải file (cần đăng nhập Admin)")
        row += 1

    # ----- In ấn -----
    ws.set_landscape()
    ws.set_paper(8)  # A3
    ws.fit_to_pages(1, 0)
    ws.center_horizontally()
    ws.set_margins(left=0.4, right=0.4, top=0.5, bottom=0.6)
    ws.set_footer("&L&9" + p["name"].replace("&", "&&") + "&R&9Trang &P / &N")
    ws.print_area(0, 0, row, LAST_COL + 1)

    wb.close()
    return buf.getvalue()
