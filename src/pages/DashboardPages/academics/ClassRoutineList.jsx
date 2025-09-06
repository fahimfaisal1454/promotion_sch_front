import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../../../components/AxiosInstance";

export default function ClassRoutineList() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [teachers, setTeachers] = useState([]);
  const [filters, setFilters] = useState({
    day: "",
    className: "",
    section: "",
    teacherId: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [routines, teachersRes] = await Promise.all([
        AxiosInstance.get("class-routines/").then(r => r.data || []),
        AxiosInstance.get("admin/users/?role=Teacher").then(r => r.data || []),
      ]);
      setRows(routines);
      setTeachers(teachersRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const onFilter = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));

  const filtered = useMemo(() => {
    let data = [...rows];
    if (filters.day) data = data.filter(r => (r.day_of_week || "").toLowerCase() === filters.day.toLowerCase());
    if (filters.className) {
      data = data.filter(r => {
        const name = r.class_name?.name || r.class_name || "";
        return name.toLowerCase().includes(filters.className.toLowerCase());
      });
    }
    if (filters.section) {
      data = data.filter(r => (r.section || "").toLowerCase() === filters.section.toLowerCase());
    }
    if (filters.teacherId) {
      data = data.filter(r => String(r.teacher?.id || r.teacher) === String(filters.teacherId));
    }
    return data;
  }, [rows, filters]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this period?")) return;
    await AxiosInstance.delete(`class-routines/${id}/`);
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const teacherOptions = useMemo(() => teachers.map(t => ({
    id: t.id, label: t.username || `User #${t.id}`
  })), [teachers]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Class Routine</h2>
        <button
          onClick={() => navigate("/dashboard/class-routines/new")}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          + Add Period
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-3 grid gap-3 md:grid-cols-5">
        <div>
          <label className="block text-sm mb-1">Day</label>
          <select
            className="w-full border rounded p-2"
            value={filters.day}
            onChange={(e) => onFilter("day", e.target.value)}
          >
            <option value="">All</option>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Class</label>
          <input
            className="w-full border rounded p-2"
            placeholder="e.g. Class 7"
            value={filters.className}
            onChange={(e) => onFilter("className", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Section</label>
          <input
            className="w-full border rounded p-2"
            placeholder="e.g. A"
            value={filters.section}
            onChange={(e) => onFilter("section", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Teacher</label>
          <select
            className="w-full border rounded p-2"
            value={filters.teacherId}
            onChange={(e) => onFilter("teacherId", e.target.value)}
          >
            <option value="">All</option>
            {teacherOptions.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2">Day</th>
              <th className="px-3 py-2">Class</th>
              <th className="px-3 py-2">Sec</th>
              <th className="px-3 py-2">Subject</th>
              <th className="px-3 py-2">Teacher</th>
              <th className="px-3 py-2">Period</th>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-4" colSpan={8}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-3 py-6 text-slate-500" colSpan={8}>No periods</td></tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{r.day_of_week}</td>
                  <td className="px-3 py-2">{r.class_name?.name || r.class_name}</td>
                  <td className="px-3 py-2">{r.section || "-"}</td>
                  <td className="px-3 py-2">{r.subject?.name || r.subject}</td>
                  <td className="px-3 py-2">{r.teacher?.username || r.teacher || "-"}</td>
                  <td className="px-3 py-2">{r.period || "-"}</td>
                  <td className="px-3 py-2">
                    {r.start_time?.slice(0,5)}–{r.end_time?.slice(0,5)}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      onClick={() => navigate("/dashboard/class-routines/new", { state: { routine: r } })}
                      className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
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
