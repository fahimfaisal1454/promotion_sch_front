import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../../../components/AxiosInstance";

export default function AssignedTeacherList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // simple filters (optional)
  const [filters, setFilters] = useState({
    day: "All",
    classQuery: "",
    sectionQuery: "",
    teacher: "All",
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await AxiosInstance.get("assign-teachers/");
        setRows(Array.isArray(res.data) ? res.data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const dayOk =
        filters.day === "All" ||
        (r.day_of_week_display || r.day_of_week) === filters.day;

      const classOk =
        !filters.classQuery ||
        (r.class_name_label || String(r.class_name)).toLowerCase().includes(
          filters.classQuery.toLowerCase()
        );

      const sectionOk =
        !filters.sectionQuery ||
        (r.section_label || String(r.section)).toLowerCase().includes(
          filters.sectionQuery.toLowerCase()
        );

      const teacherOk =
        filters.teacher === "All" ||
        (r.teacher_label || String(r.teacher)) === filters.teacher;

      return dayOk && classOk && sectionOk && teacherOk;
    });
  }, [rows, filters]);

  const uniqueDays = useMemo(() => {
    const s = new Set(rows.map((r) => r.day_of_week_display || r.day_of_week));
    return ["All", ...Array.from(s)];
  }, [rows]);

  const uniqueTeachers = useMemo(() => {
    const s = new Set(rows.map((r) => r.teacher_label || String(r.teacher)));
    return ["All", ...Array.from(s)];
  }, [rows]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Assigned Teachers</h2>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => navigate("/dashboard/assigned-teacher-form")}
        >
          + Assign Teacher
        </button>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-4 gap-3 mb-4 bg-white p-3 rounded-lg shadow">
        <div>
          <label className="block text-xs mb-1">Day</label>
          <select
            className="w-full border rounded p-2"
            value={filters.day}
            onChange={(e) => setFilters((f) => ({ ...f, day: e.target.value }))}
          >
            {uniqueDays.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs mb-1">Class</label>
          <input
            className="w-full border rounded p-2"
            placeholder="e.g. Class 7"
            value={filters.classQuery}
            onChange={(e) =>
              setFilters((f) => ({ ...f, classQuery: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-xs mb-1">Section</label>
          <input
            className="w-full border rounded p-2"
            placeholder="e.g. A"
            value={filters.sectionQuery}
            onChange={(e) =>
              setFilters((f) => ({ ...f, sectionQuery: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-xs mb-1">Teacher</label>
          <select
            className="w-full border rounded p-2"
            value={filters.teacher}
            onChange={(e) =>
              setFilters((f) => ({ ...f, teacher: e.target.value }))
            }
          >
            {uniqueTeachers.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="px-4 py-2">Day</th>
              <th className="px-4 py-2">Class</th>
              <th className="px-4 py-2">Sec</th>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Teacher</th>
              <th className="px-4 py-2">Period</th>
              <th className="px-4 py-2">Room</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6" colSpan={8}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-4 py-6" colSpan={8}>No assignments found.</td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">{r.day_of_week_display || r.day_of_week}</td>
                  <td className="px-4 py-2">{r.class_name_label || r.class_name}</td>
                  <td className="px-4 py-2">{r.section_label || r.section}</td>
                  <td className="px-4 py-2">{r.subject_label || r.subject}</td>
                  <td className="px-4 py-2">{r.teacher_label || r.teacher}</td>
                  <td className="px-4 py-2">{r.period}</td>
                  <td className="px-4 py-2">{r.room || "-"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      className="px-3 py-1 rounded bg-indigo-600 text-white mr-2"
                      onClick={() => navigate("/dashboard/assigned-teacher-form", { state: { assignment: r } })}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-red-600 text-white"
                      onClick={async () => {
                        if (!window.confirm("Delete this assignment?")) return;
                        await AxiosInstance.delete(`assign-teachers/${r.id}/`);
                        setRows((prev) => prev.filter((x) => x.id !== r.id));
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
