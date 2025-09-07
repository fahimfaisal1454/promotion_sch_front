import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Toaster, toast } from "react-hot-toast";
import AxiosInstance from "../../../components/AxiosInstance";

/* ----------------------------------------------------------------------------
   Constants & helpers (single source of truth)
---------------------------------------------------------------------------- */
const DAYS = [
  { value: "Mon", label: "Monday" },
  { value: "Tue", label: "Tuesday" },
  { value: "Wed", label: "Wednesday" },
  { value: "Thu", label: "Thursday" },
  { value: "Fri", label: "Friday" },
  { value: "Sat", label: "Saturday" },
  { value: "Sun", label: "Sunday" },
];
const DAY_ORDER = Object.fromEntries(DAYS.map((d, i) => [d.value, i]));

// read element by id or name
const el = (nameOrId) =>
  document.getElementById(nameOrId) ||
  document.querySelector(`[name="${nameOrId}"]`) ||
  null;

// read <input type="time"> as "HH:MM"
const readTime = (nameOrId) => {
  const node = el(nameOrId);
  if (!node) return "";
  const v = (node.value || "").trim();
  if (v) return v;
  if (
    typeof node.valueAsNumber === "number" &&
    !Number.isNaN(node.valueAsNumber)
  ) {
    const d = new Date(node.valueAsNumber);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return "";
};

// display HH:MM(/SS) -> h:MM AM/PM
const fmt12 = (value) => {
  if (!value) return "";
  const [H, M = "00", S] = String(value).split(":");
  let h = parseInt(H, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const ss = S && S !== "00" ? `:${S}` : "";
  return `${h}:${String(M).padStart(2, "0")}${ss} ${ampm}`;
};

// normalize any server row shape into a single shape
const normalizeRow = (row) => {
  const day = row.day_of_week ?? row.day ?? row.day_label ?? row.dayLabel ?? "";
  const start = row.start_time ?? row.start ?? row.period_start ?? "";
  const end = row.end_time ?? row.end ?? row.period_end ?? "";
  const period = row.period ?? row.period_label ?? row.periodName ?? "";

  const subjectId = row.subject_id ?? row.subject?.id ?? null;
  const subjectText =
    row.subject_label ??
    (typeof row.subject === "string"
      ? row.subject
      : row.subject?.name ?? row.subject_name ?? null);

  const sectionId = row.section_id ?? row.section?.id ?? null;
  const sectionText =
    row.section_label ??
    (typeof row.section === "string"
      ? row.section
      : row.section?.name ?? row.section_name ?? null);

  return {
    id: row.id,
    day,
    period,
    start,
    end,
    sectionId,
    sectionText,
    subjectId,
    subjectText,
    __raw: row,
  };
};

/* ----------------------------------------------------------------------------
   Component
---------------------------------------------------------------------------- */
export default function ClassTimetable() {
  // master data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // selections
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // list
  const [loadingList, setLoadingList] = useState(false);
  const [routines, setRoutines] = useState([]);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  /* ------------------------------ API ------------------------------------ */
  const loadClasses = async () => {
    try {
      let res;
      try {
        res = await AxiosInstance.get("class-names/");
      } catch {
        res = await AxiosInstance.get("classes/"); // fallback
      }
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load classes");
    }
  };

  const loadSubjects = async (classId) => {
    try {
      let res;
      try {
        res = await AxiosInstance.get(`subjects/?class_id=${classId}`);
      } catch {
        res = await AxiosInstance.get("subjects/"); // fallback
      }
      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load subjects");
    }
  };

  // fetch only by class; filter client-side for section/subject
  const serverLoadRoutines = async () => {
    const q = new URLSearchParams();
    if (selectedClass?.value) q.append("class_id", selectedClass.value);
    const res = await AxiosInstance.get(
      `timetable/${q.toString() ? `?${q}` : ""}`
    );
    return Array.isArray(res.data) ? res.data : [];
  };

  const loadRoutines = async () => {
    if (!selectedClass?.value) {
      setRoutines([]);
      return;
    }
    setLoadingList(true);
    try {
      let data = await serverLoadRoutines();
      let rows = data.map(normalizeRow);

      // filter by selected section (accept id or label)
      const wantSectionLabel = selectedSection
        ? typeof selectedSection.value === "number"
          ? selectedSection.label
          : selectedSection.value
        : null;
      const wantSectionId =
        typeof selectedSection?.value === "number"
          ? selectedSection.value
          : null;

      // filter by subject (id or text)
      const wantSubjectId = selectedSubject?.value ?? null;
      const wantSubjectText = selectedSubject?.label ?? null;

      rows = rows.filter((r) => {
        if (wantSectionId || wantSectionLabel) {
          const okId =
            wantSectionId &&
            r.sectionId &&
            String(r.sectionId) === String(wantSectionId);
          const okText =
            wantSectionLabel &&
            r.sectionText &&
            String(r.sectionText).toLowerCase() ===
              String(wantSectionLabel).toLowerCase();
          if (!(okId || okText)) return false;
        }
        if (wantSubjectId || wantSubjectText) {
          const okId =
            wantSubjectId &&
            r.subjectId &&
            String(r.subjectId) === String(wantSubjectId);
          const rSubText =
            r.subjectText ??
            r.__raw.subject_name ??
            r.__raw.subject ??
            r.__raw.subjectLabel ??
            null;
          const okText =
            wantSubjectText &&
            rSubText &&
            String(rSubText).toLowerCase() ===
              String(wantSubjectText).toLowerCase();
          if (!(okId || okText)) return false;
        }
        return true;
      });

      rows.sort((a, b) => {
        const da = DAY_ORDER[a.day] ?? 0;
        const db = DAY_ORDER[b.day] ?? 0;
        if (da !== db) return da - db;
        return String(a.start).localeCompare(String(b.start));
      });

      setRoutines(rows);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load timetable");
    } finally {
      setLoadingList(false);
    }
  };

  /* ------------------------------ options -------------------------------- */
  const classOptions = useMemo(
    () =>
      classes.map((c) => ({
        value: c.id,
        label: c.name || c.title || `Class ${c.id}`,
        sections: c.sections || [],
      })),
    [classes]
  );

  // supports either [{id,name}] or ["A","B"]
  const sectionOptions = useMemo(() => {
    if (!selectedClass) return [];
    const cls = classes.find((x) => x.id === selectedClass.value);
    return (cls?.sections || []).map((s) =>
      typeof s === "string" ? { value: s, label: s } : { value: s.id, label: s.name || s.code }
    );
  }, [classes, selectedClass]);

  const subjectOptions = useMemo(
    () => (subjects || []).map((s) => ({ value: s.id, label: s.name })),
    [subjects]
  );

  /* ------------------------------ form helpers --------------------------- */
  const clearAll = () => {
    for (const d of DAYS) {
      const p = el(`period_${d.value}`);
      const s = el(`start_${d.value}`);
      const e = el(`end_${d.value}`);
      if (p) p.value = "";
      if (s) s.value = "";
      if (e) e.value = "";
    }
  };

  const copyFirstFilledToAll = () => {
    let srcS = "",
      srcE = "";
    for (const d of DAYS) {
      const s = readTime(`start_${d.value}`);
      const e = readTime(`end_${d.value}`);
      if (s && e) {
        srcS = s;
        srcE = e;
        break;
      }
    }
    if (!srcS || !srcE)
      return toast("Enter a time on any day first, then copy.");
    for (const d of DAYS) {
      const s = el(`start_${d.value}`);
      if (s) s.value = srcS;
      const e = el(`end_${d.value}`);
      if (e) e.value = srcE;
    }
  };

  const createMany = async () => {
    if (!selectedClass?.value) return toast.error("Select class");
    if (!selectedSection?.value) return toast.error("Select section");
    if (!selectedSubject?.value) return toast.error("Select subject");

    try {
      if (document.activeElement) document.activeElement.blur();
    } catch {}

    const isTime = (t) =>
      typeof t === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(t.trim());
    const toSec = (t) => {
      const [h, m, s = "00"] = t.split(":");
      return +h * 3600 + +m * 60 + +s;
    };

    // API expects section PK (integer)
    let sectionPk = null;
    if (typeof selectedSection.value === "number") {
      sectionPk = selectedSection.value;
    } else {
      const cls = classes.find((x) => x.id === selectedClass.value);
      const match = (cls?.sections || []).find(
        (s) =>
          (s.name || s.code || s) ===
          (selectedSection.label || selectedSection.value)
      );
      sectionPk = match?.id ?? null;
    }
    if (!sectionPk) return toast.error("Could not resolve section id.");

    const payloads = [];
    for (const d of DAYS) {
      const day = d.value;
      const period = (el(`period_${day}`)?.value || "").trim();
      const start = readTime(`start_${day}`);
      const end = readTime(`end_${day}`);

      if (!start || !end) continue;
      if (!isTime(start) || !isTime(end))
        return toast.error(`Invalid time on ${d.label}.`);
      if (toSec(start) >= toSec(end))
        return toast.error(`End must be after start for ${d.label}.`);

      payloads.push({
        class_name: selectedClass.value, // FK id
        section: sectionPk, // PK integer
        subject: selectedSubject.value, // FK id
        day_of_week: day, // "Mon".."Sun"
        period,
        start_time: start,
        end_time: end,
      });
    }

    if (payloads.length === 0) return toast("Nothing to save.");

    try {
      await Promise.all(
        payloads.map((p) => AxiosInstance.post("timetable/", p))
      );
      toast.success("Timetable saved");
      await loadRoutines();
    } catch (e) {
      console.error("Save failed:", e?.response?.data || e?.message || e);
      toast.error(
        e?.response?.data
          ? typeof e.response.data === "string"
            ? e.response.data
            : JSON.stringify(e.response.data)
          : "Save failed"
      );
    }
  };

  const openEdit = (r) => {
    setEditRow({
      ...r,
      _day: r.day,
      _period: r.period || "",
      _start: r.start || "",
      _end: r.end || "",
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    try {
      await AxiosInstance.patch(`timetable/${editRow.id}/`, {
        day_of_week: editRow._day,
        period: editRow._period,
        start_time: editRow._start,
        end_time: editRow._end,
      });
      toast.success("Updated");
      setEditOpen(false);
      setEditRow(null);
      await loadRoutines();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data
          ? typeof e.response.data === "string"
            ? e.response.data
            : JSON.stringify(e.response.data)
          : "Update failed";
      toast.error(msg);
    }
  };

  const removeRow = async (id) => {
    if (!window.confirm("Delete this row?")) return;
    try {
      await AxiosInstance.delete(`timetable/${id}/`);
      toast.success("Deleted");
      await loadRoutines();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  };

  /* ------------------------------ effects -------------------------------- */
  useEffect(() => {
    loadClasses();
  }, []);
  useEffect(() => {
    if (selectedClass?.value) loadSubjects(selectedClass.value);
    setSelectedSection(null);
    setSelectedSubject(null);
    clearAll();
  }, [selectedClass]);
  useEffect(() => {
    loadRoutines();
  }, [selectedClass, selectedSection, selectedSubject]);

  /* ------------------------------ UI ------------------------------------- */
  return (
    <div className="p-4">
      <Toaster position="top-center" />
      <h2 className="text-xl font-semibold mb-3">Class Timetable</h2>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-sm mb-1">Class</label>
          <Select
            options={classOptions}
            value={selectedClass}
            onChange={setSelectedClass}
            placeholder="Select class"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Section</label>
          <Select
            options={sectionOptions}
            value={selectedSection}
            onChange={setSelectedSection}
            isDisabled={!selectedClass}
            placeholder="Select section"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Subject</label>
          <Select
            options={subjectOptions}
            value={selectedSubject}
            onChange={setSelectedSubject}
            isDisabled={!selectedClass}
            placeholder="Select subject"
          />
        </div>
      </div>

      <div className="bg-white rounded shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Set Times</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded border" onClick={copyFirstFilledToAll}>
              Copy first time to all
            </button>
            <button className="px-3 py-1 rounded border" onClick={clearAll}>
              Clear all
            </button>
          </div>
        </div>

        <form id="tt-form">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left">Day</th>
                  <th className="px-3 py-2 text-left w-40">Period</th>
                  <th className="px-3 py-2 text-left w-40">Start</th>
                  <th className="px-3 py-2 text-left w-40">End</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((d) => (
                  <tr key={d.value} className="border-t">
                    <td className="px-3 py-2">{d.label}</td>
                    <td className="px-3 py-2">
                      <input
                        id={`period_${d.value}`}
                        name={`period_${d.value}`}
                        className="border rounded px-2 py-1 w-36"
                        placeholder="e.g., 1st"
                        defaultValue=""
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        id={`start_${d.value}`}
                        name={`start_${d.value}`}
                        type="time"
                        className="border rounded px-2 py-1 w-36"
                        defaultValue=""
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        id={`end_${d.value}`}
                        name={`end_${d.value}`}
                        type="time"
                        className="border rounded px-2 py-1 w-36"
                        defaultValue=""
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </form>

        <div className="mt-3">
          <button
            onClick={createMany}
            className="px-5 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            disabled={!selectedClass || !selectedSection || !selectedSubject}
          >
            Save Timetable
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4 mt-4">
        <h3 className="text-lg font-semibold mb-3">
          Current Rows{" "}
          {selectedClass
            ? `— ${selectedClass.label}${
                selectedSection
                  ? " • " +
                    (selectedSection.label ?? selectedSection.value)
                  : ""
              }`
            : ""}
        </h3>

        {loadingList ? (
          <div className="text-slate-500">Loading…</div>
        ) : routines.length === 0 ? (
          <div className="text-slate-500">No rows yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left">Day</th>
                  <th className="px-3 py-2 text-left">Period</th>
                  <th className="px-3 py-2 text-left">Section</th>
                  <th className="px-3 py-2 text-left">Subject</th> {/* NEW */}
                  <th className="px-3 py-2 text-left">Start</th>
                  <th className="px-3 py-2 text-left">End</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {routines.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.day}</td>
                    <td className="px-3 py-2">{r.period || "-"}</td>
                    <td className="px-3 py-2">
                      {r.sectionText ||
                        r.__raw?.section_label ||
                        r.__raw?.section ||
                        "-"}
                    </td>
                    <td className="px-3 py-2">
                      {r.subjectText ||
                        r.__raw?.subject_label ||
                        r.__raw?.subject ||
                        "-"}
                    </td>
                    <td className="px-3 py-2">{fmt12(r.start)}</td>
                    <td className="px-3 py-2">{fmt12(r.end)}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(r)}
                          className="px-3 py-1 rounded bg-slate-600 text-white hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeRow(r.id)}
                          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editOpen && editRow && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white rounded-lg p-4 w-[95%] max-w-lg">
            <h3 className="text-lg font-semibold mb-3">Edit Row</h3>

            <div className="grid grid-cols-1 gap-3 mb-3">
              <div>
                <label className="block text-sm mb-1">Day</label>
                <Select
                  options={DAYS}
                  value={DAYS.find((d) => d.value === editRow._day)}
                  onChange={(opt) =>
                    setEditRow((s) => ({ ...s, _day: opt.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Period</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={editRow._period}
                  onChange={(e) =>
                    setEditRow((s) => ({ ...s, _period: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Start</label>
                  <input
                    type="time"
                    className="border rounded px-3 py-2 w-full"
                    value={editRow._start}
                    onChange={(e) =>
                      setEditRow((s) => ({ ...s, _start: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">End</label>
                  <input
                    type="time"
                    className="border rounded px-3 py-2 w-full"
                    value={editRow._end}
                    onChange={(e) =>
                      setEditRow((s) => ({ ...s, _end: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditOpen(false);
                  setEditRow(null);
                }}
                className="px-4 py-2 rounded border"
              >
                Close
              </button>
              <button
                onClick={submitEdit}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
