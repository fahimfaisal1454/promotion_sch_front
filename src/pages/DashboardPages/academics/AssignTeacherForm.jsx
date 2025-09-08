import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AxiosInstance from "../../../components/AxiosInstance";

// Fallbacks if one 404s
const CLASS_ENDPOINTS = ["class-names/", "classes/"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AssignTeacherForm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const editing = state?.assignment || null;
  const isEdit = !!editing;

  // meta
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // for conflict checks
  const [allAssignments, setAllAssignments] = useState([]);

  // form
  const [form, setForm] = useState({
    class_name: "",
    section: "",
    subject: "",
    teacher: "", // <- numeric id
    day_of_week: "Mon",
    period: "",
    room: "",
  });

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  /* ------------------- loaders ------------------- */
  const loadFirstOk = async (paths) => {
    for (const p of paths) {
      try {
        const r = await AxiosInstance.get(p);
        if (Array.isArray(r.data)) return r.data;
      } catch {}
    }
    return [];
  };

  const loadClasses = async () => {
    const data = await loadFirstOk(CLASS_ENDPOINTS);
    setClasses(Array.isArray(data) ? data : []);
  };

  const loadTeachers = async () => {
    try {
      // <- Your Teacher Info list
      const r = await AxiosInstance.get("teachers/");
      // normalize to ensure id + label
      const items = (Array.isArray(r.data) ? r.data : []).map((t) => ({
        id: t.id,
        label:
          t.full_name ||
          t.contact_email ||
          t.user_username ||
          t.username ||
          t.email ||
          `Teacher #${t.id}`,
      }));
      setTeachers(items);
    } catch {
      setTeachers([]);
    }
  };

  const loadAssignments = async () => {
    try {
      const r = await AxiosInstance.get("assign-teachers/");
      setAllAssignments(Array.isArray(r.data) ? r.data : []);
    } catch {
      setAllAssignments([]);
    }
  };

  const loadSubjectsForClass = async (classId) => {
    if (!classId) return setSubjects([]);
    try {
      let r;
      try {
        r = await AxiosInstance.get(`subjects/?class_id=${classId}`);
      } catch {
        r = await AxiosInstance.get(`subjects/?class=${classId}`);
      }
      const items = (Array.isArray(r.data) ? r.data : []).map((s) => ({
        id: s.id,
        label: s.name || s.title || `Subject #${s.id}`,
      }));
      setSubjects(items);
    } catch {
      setSubjects([]);
    }
  };

  /* ------------------- effects ------------------- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([loadClasses(), loadTeachers(), loadAssignments()]);
        if (editing) {
          const next = {
            class_name: editing.class_name?.id || editing.class_name || "",
            section:
              editing.section?.id ||
              editing.section_label ||
              editing.section ||
              "",
            subject: editing.subject?.id || editing.subject || "",
            teacher: editing.teacher?.id || editing.teacher || "", // ensure id
            day_of_week: editing.day_of_week || "Mon",
            period: editing.period || "",
            room: editing.room || "",
          };
          setForm(next);
          if (next.class_name) await loadSubjectsForClass(next.class_name);
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (form.class_name) {
      loadSubjectsForClass(form.class_name);
    } else {
      setSubjects([]);
    }
    // reset subject/section on class change
    setForm((s) => ({ ...s, section: "", subject: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.class_name]);

  /* ------------------- options ------------------- */
  const classOptions = useMemo(
    () =>
      (classes || []).map((c) => ({
        id: c.id,
        label: c.name || c.title || `Class #${c.id}`,
        sections: c.sections || [],
      })),
    [classes]
  );

  const sectionOptions = useMemo(() => {
    const cls = classes.find((x) => String(x.id) === String(form.class_name));
    return (cls?.sections || []).map((s) =>
      typeof s === "string"
        ? { id: s, label: s, value: s }
        : { id: s.id, label: s.name || s.code || String(s.id), value: s.id }
    );
  }, [classes, form.class_name]);

  /* ------------------- validations ------------------- */
  const norm = (r) => ({
    id: r.id,
    day: r.day_of_week || r.day || "",
    period: r.period || "",
    classId: r.class_name?.id ?? r.class_name ?? null,
    section: r.section?.id ?? r.section_label ?? r.section ?? null,
    teacherId: r.teacher?.id ?? r.teacher ?? null,
    room: r.room ?? "",
  });

  const validate = () => {
    const errs = [];
    if (!form.class_name) errs.push("Class is required.");
    if (!form.section) errs.push("Section is required.");
    if (!form.subject) errs.push("Subject is required.");
    if (!form.teacher) errs.push("Teacher is required.");
    if (!form.day_of_week) errs.push("Day is required.");
    if (!form.period || !form.period.trim())
      errs.push("Period is required (used as time slot).");
    if (errs.length) return errs;

    const target = {
      id: editing?.id ?? null,
      day: form.day_of_week,
      period: String(form.period).trim(),
      classId: Number(form.class_name),
      section: String(form.section),
      teacherId: Number(form.teacher),
      room: String(form.room || "").trim(),
    };

    const sameSlot = allAssignments
      .map(norm)
      .filter(
        (r) =>
          r.day === target.day &&
          String(r.period) === String(target.period) &&
          (target.id ? r.id !== target.id : true)
      );

    if (sameSlot.some((r) => String(r.teacherId) === String(target.teacherId)))
      errs.push("This teacher is already assigned in this time slot.");

    if (
      sameSlot.some(
        (r) =>
          String(r.classId) === String(target.classId) &&
          String(r.section) === String(target.section)
      )
    )
      errs.push("This class/section already has a teacher at this time.");

    if (
      target.room &&
      sameSlot.some(
        (r) =>
          String(r.room).toLowerCase() === target.room.toLowerCase() &&
          (String(r.classId) !== String(target.classId) ||
            String(r.section) !== String(target.section))
      )
    )
      errs.push("This room is already occupied at this time.");

    return errs;
  };

  /* ------------------- submit ------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (errors.length) return alert(errors.join("\n"));

    setSaving(true);
    try {
      const payload = { ...form };
      ["class_name", "subject", "teacher"].forEach((k) => {
        if (payload[k] !== "" && payload[k] !== null) payload[k] = Number(payload[k]);
      });

      if (isEdit) {
        await AxiosInstance.patch(`assign-teachers/${editing.id}/`, payload);
      } else {
        await AxiosInstance.post("assign-teachers/", payload);
      }

      alert("Saved!");
      navigate("/dashboard/assigned-teacher-list");
    } catch (err) {
      const data = err?.response?.data || {};
      const lines = Object.entries(data).map(
        ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`
      );
      alert(lines.length ? lines.join("\n") : "Save failed");
    } finally {
      setSaving(false);
      loadAssignments().catch(() => {});
    }
  };

  /* ------------------- UI ------------------- */
  return (
    <div className="p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">
            {isEdit ? "Edit Teacher Assignment" : "Assign Teacher"}
          </h2>
          <button
            onClick={() => navigate("/dashboard/assign-teachers")}
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
                {classOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-sm mb-1">Section</label>
              <select
                value={form.section}
                onChange={(e) => onChange("section", e.target.value)}
                className="w-full border rounded p-2"
                disabled={!form.class_name}
                required
              >
                <option value="">— Select —</option>
                {sectionOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm mb-1">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => onChange("subject", e.target.value)}
                className="w-full border rounded p-2"
                disabled={!form.class_name}
                required
              >
                <option value="">— Select —</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Teacher (id only) */}
            <div>
              <label className="block text-sm mb-1">Teacher</label>
              <select
                value={form.teacher}
                onChange={(e) => onChange("teacher", e.target.value)}
                className="w-full border rounded p-2"
                required
              >
                <option value="">— Select —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                One teacher cannot be booked in two places at the same time.
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
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm mb-1">Period</label>
              <input
                value={form.period}
                onChange={(e) => onChange("period", e.target.value)}
                className="w-full border rounded p-2"
                placeholder="e.g. 1st / 2nd"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Used as the time slot for conflict checks.
              </p>
            </div>

            {/* Room */}
            <div>
              <label className="block text-sm mb-1">Room</label>
              <input
                value={form.room}
                onChange={(e) => onChange("room", e.target.value)}
                className="w-full border rounded p-2"
                placeholder="e.g. 204 / Lab-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                If provided, this room cannot be double-booked.
              </p>
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
