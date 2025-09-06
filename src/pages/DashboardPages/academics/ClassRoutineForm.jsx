import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AxiosInstance from "../../../components/AxiosInstance";

// Try these endpoints in order (adjust if your API names differ)
const CLASS_ENDPOINTS = ["master/class-names/", "class-names/"];
const SUBJECT_ENDPOINTS = ["master/subjects/", "subjects/"];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ClassRoutineForm() {
  const navigate = useNavigate();
  const location = useLocation();
  // If you navigate here with state for editing
  const editingRoutine = location.state?.routine || null;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [form, setForm] = useState({
    class_name: "",     // FK id
    section: "",
    subject: "",        // FK id
    teacher: "",        // FK id
    day_of_week: "Mon",
    period: "",
    start_time: "",
    end_time: "",
  });

  const isEdit = !!editingRoutine;

  // Helpers
  const onChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const loadFirstOk = async (paths) => {
    for (const p of paths) {
      try {
        const res = await AxiosInstance.get(p);
        if (Array.isArray(res.data)) return res.data;
      } catch (_) {}
    }
    return [];
  };

  const loadMeta = async () => {
    setLoading(true);
    try {
      const [classList, subjectList, teacherList] = await Promise.all([
        loadFirstOk(CLASS_ENDPOINTS),
        loadFirstOk(SUBJECT_ENDPOINTS),
        AxiosInstance.get("admin/users/?role=Teacher").then(r => r.data || []),
      ]);
      setClasses(classList);
      setSubjects(subjectList);
      setTeachers(teacherList);

      if (editingRoutine) {
        setForm({
          class_name: editingRoutine.class_name?.id || editingRoutine.class_name || "",
          section: editingRoutine.section || "",
          subject: editingRoutine.subject?.id || editingRoutine.subject || "",
          teacher: editingRoutine.teacher?.id || editingRoutine.teacher || "",
          day_of_week: editingRoutine.day_of_week || "Mon",
          period: editingRoutine.period || "",
          start_time: editingRoutine.start_time || "",
          end_time: editingRoutine.end_time || "",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };

      // DRF expects FK ids as numbers (usually); coerce strings if any
      ["class_name", "subject", "teacher"].forEach(k => {
        if (payload[k] === "" || payload[k] === null) return;
        payload[k] = Number(payload[k]);
      });

      if (isEdit) {
        await AxiosInstance.patch(`class-routines/${editingRoutine.id}/`, payload);
      } else {
        await AxiosInstance.post("class-routines/", payload);
      }

      alert("Saved!");
      navigate("/dashboard/class-routines");
    } catch (err) {
      // Show conflict/validation errors from API
      const data = err?.response?.data || {};
      const lines = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
      alert(lines.length ? lines.join("\n") : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const classOptions = useMemo(() => classes.map(c => ({
    id: c.id, label: c.name || c.title || `Class #${c.id}`
  })), [classes]);

  const subjectOptions = useMemo(() => subjects.map(s => ({
    id: s.id, label: s.name || s.title || `Subject #${s.id}`
  })), [subjects]);

  const teacherOptions = useMemo(() => teachers.map(t => ({
    id: t.id, label: t.username || t.email || `User #${t.id}`
  })), [teachers]);

  return (
    <div className="p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">
            {isEdit ? "Edit Class Routine" : "Create Class Routine"}
          </h2>
          <button
            onClick={() => navigate("/dashboard/class-routines")}
            className="px-3 py-1 border rounded"
          >
            Back
          </button>
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
            {/* Class */}
            <div>
              <label className="block text-sm mb-1">Class</label>
              <select
                value={form.class_name}
                onChange={(e) => onChange("class_name", e.target.value)}
                className="w-full border rounded p-2"
                required
              >
                <option value="">— Select —</option>
                {classOptions.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-sm mb-1">Section</label>
              <input
                value={form.section}
                onChange={(e) => onChange("section", e.target.value)}
                className="w-full border rounded p-2"
                placeholder="e.g. A"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm mb-1">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => onChange("subject", e.target.value)}
                className="w-full border rounded p-2"
                required
              >
                <option value="">— Select —</option>
                {subjectOptions.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Teacher */}
            <div>
              <label className="block text-sm mb-1">Teacher</label>
              <select
                value={form.teacher}
                onChange={(e) => onChange("teacher", e.target.value)}
                className="w-full border rounded p-2"
                required
              >
                <option value="">— Select —</option>
                {teacherOptions.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Only “Teacher” role users appear here; backend enforces this too.
              </p>
            </div>

            {/* Day */}
            <div>
              <label className="block text-sm mb-1">Day</label>
              <select
                value={form.day_of_week}
                onChange={(e) => onChange("day_of_week", e.target.value)}
                className="w-full border rounded p-2"
                required
              >
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            {/* Period (free text – you can predefine if you want) */}
            <div>
              <label className="block text-sm mb-1">Period</label>
              <input
                value={form.period}
                onChange={(e) => onChange("period", e.target.value)}
                className="w-full border rounded p-2"
                placeholder="e.g. 1st / 10:00-11:00"
              />
            </div>

            {/* Time range */}
            <div>
              <label className="block text-sm mb-1">Start Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => onChange("start_time", e.target.value)}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => onChange("end_time", e.target.value)}
                className="w-full border rounded p-2"
                required
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
