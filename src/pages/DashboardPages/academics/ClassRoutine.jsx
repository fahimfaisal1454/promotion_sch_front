import { useEffect, useMemo, useState } from "react";
import AxiosInstance from "../../../components/AxiosInstance";

// --- Helpers ---------------------------------------------------
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const initialForm = {
  class_name: "",  // ClassName.id
  section: "",
  day_of_week: "Mon",
  period: "1st",
  subject: "",     // Subject.id
  start_time: "09:00",
  end_time: "10:00",
};

// --- Component -------------------------------------------------
export default function ClassRoutine() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // create form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  // teachers / classes / subjects
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // per-row assigning
  const [assigningId, setAssigningId] = useState(null);
  const [assignFor, setAssignFor] = useState({}); // { [routineId]: teacherId|null }

  const teacherMap = useMemo(() => {
    const m = new Map();
    teachers.forEach(t => m.set(t.id, t.username));
    return m;
  }, [teachers]);

  // ---- data loads --------------------------------------------
  const loadRoutines = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await AxiosInstance.get("class-routines/");
      setRows(data || []);
    } catch (e) {
      console.error(e);
      setErr("Failed to load routines.");
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const { data } = await AxiosInstance.get("admin/users/?role=Teacher");
      setTeachers(data || []);
    } catch (e) {
      console.warn("Load teachers:", e?.response?.status);
      setTeachers([]);
    }
  };

  // NOTE: update these two endpoints to match your backend if different.
  const loadClasses = async () => {
    try {
      // Example endpoints. If your API differs, change here.
      const { data } = await AxiosInstance.get("master/class-names/");
      setClasses(data || []);
    } catch {
      // Fallback: keep empty; admin can type IDs directly if needed
      setClasses([]);
    }
  };

  const loadSubjects = async () => {
    try {
      const { data } = await AxiosInstance.get("master/subjects/");
      setSubjects(data || []);
    } catch {
      setSubjects([]);
    }
  };

  useEffect(() => {
    loadRoutines();
    loadTeachers();
    loadClasses();
    loadSubjects();
  }, []);

  // ---- create routine ----------------------------------------
  const submitCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");

    // DRF expects seconds for time; allow "HH:MM"
    const normalize = (t) => (t?.length === 5 ? `${t}:00` : t);

    try {
      const payload = {
        ...form,
        class_name: Number(form.class_name),
        subject: Number(form.subject),
        start_time: normalize(form.start_time),
        end_time: normalize(form.end_time),
      };
      await AxiosInstance.post("class-routines/", payload);
      setShowForm(false);
      setForm(initialForm);
      await loadRoutines();
      alert("Routine created.");
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data
        ? JSON.stringify(e.response.data)
        : "Create failed.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  // ---- assign teacher ----------------------------------------
  const assignTeacher = async (routineId) => {
    const teacherId = assignFor[routineId] ?? null;
    setAssigningId(routineId);
    try {
      await AxiosInstance.patch(`class-routines/${routineId}/assign-teacher/`, {
        teacher: teacherId || null,
      });
      await loadRoutines();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data
        ? JSON.stringify(e.response.data)
        : "Assign failed.";
      alert(msg);
    } finally {
      setAssigningId(null);
    }
  };

  // ---- UI helpers --------------------------------------------
  const getClassLabel = (r) => r.class_label || r.class_name?.name || `Class #${r.class_name}`;
  const getSubjectLabel = (r) => r.subject_name || r.subject?.name || `Subject #${r.subject}`;
  const getTeacherLabel = (r) =>
    r.teacher_name ||
    (typeof r.teacher === "number" ? teacherMap.get(r.teacher) : r.teacher?.username) ||
    "Unassigned";

  // ---- render -------------------------------------------------
  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Class Routine</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-md border border-black shadow bg-white hover:bg-gray-50"
        >
          + Add Routine
        </button>
      </header>

      {loading ? (
        <p>Loading…</p>
      ) : err ? (
        <p className="text-red-600">{err}</p>
      ) : rows.length === 0 ? (
        <p>No routines yet.</p>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Day</th>
                <th className="p-2 border">Period</th>
                <th className="p-2 border">Time</th>
                <th className="p-2 border">Class</th>
                <th className="p-2 border">Section</th>
                <th className="p-2 border">Subject</th>
                <th className="p-2 border">Teacher</th>
                <th className="p-2 border w-64">Assign</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border">{r.day_of_week}</td>
                  <td className="p-2 border">{r.period}</td>
                  <td className="p-2 border">
                    {r.start_time?.slice(0,5)} – {r.end_time?.slice(0,5)}
                  </td>
                  <td className="p-2 border">{getClassLabel(r)}</td>
                  <td className="p-2 border">{r.section || "-"}</td>
                  <td className="p-2 border">{getSubjectLabel(r)}</td>
                  <td className="p-2 border">{getTeacherLabel(r)}</td>
                  <td className="p-2 border">
                    <div className="flex gap-2">
                      <select
                        className="border rounded px-2 py-1 w-full"
                        value={assignFor[r.id] ?? ""}
                        onChange={(e) =>
                          setAssignFor((prev) => ({
                            ...prev,
                            [r.id]: e.target.value ? Number(e.target.value) : "",
                          }))
                        }
                      >
                        <option value="">— Unassigned —</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.username}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => assignTeacher(r.id)}
                        disabled={assigningId === r.id}
                        className="px-3 py-1 border rounded bg-white hover:bg-gray-50"
                      >
                        {assigningId === r.id ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create Routine</h2>
              <button
                className="px-2 py-1 rounded border"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Class */}
              <div>
                <label className="block text-sm mb-1">Class</label>
                {classes.length > 0 ? (
                  <select
                    className="border rounded w-full p-2"
                    value={form.class_name}
                    onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                    required
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.label || `Class #${c.id}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="border rounded w-full p-2"
                    placeholder="Class ID (number)"
                    value={form.class_name}
                    onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                    required
                  />
                )}
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm mb-1">Section</label>
                <input
                  className="border rounded w-full p-2"
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  placeholder="e.g. A"
                />
              </div>

              {/* Day */}
              <div>
                <label className="block text-sm mb-1">Day</label>
                <select
                  className="border rounded w-full p-2"
                  value={form.day_of_week}
                  onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Period */}
              <div>
                <label className="block text-sm mb-1">Period</label>
                <input
                  className="border rounded w-full p-2"
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  placeholder="e.g. 1st"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm mb-1">Subject</label>
                {subjects.length > 0 ? (
                  <select
                    className="border rounded w-full p-2"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                  >
                    <option value="">Select subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || `Subject #${s.id}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="border rounded w-full p-2"
                    placeholder="Subject ID (number)"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                  />
                )}
              </div>

              {/* Start */}
              <div>
                <label className="block text-sm mb-1">Start time</label>
                <input
                  type="time"
                  className="border rounded w-full p-2"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  required
                />
              </div>

              {/* End */}
              <div>
                <label className="block text-sm mb-1">End time</label>
                <input
                  type="time"
                  className="border rounded w-full p-2"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  required
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md border"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-md border border-black shadow bg-white hover:bg-gray-50"
                >
                  {saving ? "Saving…" : "Create"}
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-500 mt-4">
              * If classes/subjects dropdowns are empty, update the fetch URLs in this file to match your backend, or type the numeric IDs directly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
