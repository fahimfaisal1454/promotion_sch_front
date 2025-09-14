import { useEffect, useMemo, useState } from "react";
import AxiosInstance from "../../components/AxiosInstance";

export default function MyStudents() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await AxiosInstance.get("people/students/my-students/");
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load students", e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const needle = q.toLowerCase();
    return rows.filter((s) =>
      (s.full_name || "").toLowerCase().includes(needle) ||
      String(s.roll_number || "").toLowerCase().includes(needle) ||
      (s.class_name_label || "").toLowerCase().includes(needle) ||
      (s.section_label || "").toLowerCase().includes(needle)
    );
  }, [q, rows]);

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">My Students</h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-64 px-3 py-2 border rounded-lg text-sm"
          placeholder="Search by name, roll, class, section…"
        />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 gap-3 p-3 text-sm font-medium bg-slate-50 border-b">
          <div>#</div>
          <div>Name</div>
          <div>Roll</div>
          <div>Class</div>
          <div>Section</div>
          <div>Photo</div>
        </div>

        {filtered.length ? (
          filtered.map((s, i) => (
            <div key={s.id} className="grid grid-cols-6 gap-3 p-3 text-sm border-b last:border-b-0">
              <div>{i + 1}</div>
              <div>{s.full_name}</div>
              <div>{s.roll_number ?? "-"}</div>
              <div>{s.class_name_label || s.class_name}</div>
              <div>{s.section_label || s.section || "-"}</div>
              <div>
                {s.photo ? (
                  <img src={s.photo} alt={s.full_name} className="h-9 w-9 rounded-full object-cover border" />
                ) : "—"}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-sm text-slate-500">No students found.</div>
        )}
      </div>
    </div>
  );
}
