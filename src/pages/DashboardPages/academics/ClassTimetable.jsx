// ClassTimetable.jsx
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Toaster, toast } from "react-hot-toast";
import AxiosInstance from "../../../components/AxiosInstance";

const DAYS = [
  { value: "Mon", label: "Monday" },
  { value: "Tue", label: "Tuesday" },
  { value: "Wed", label: "Wednesday" },
  { value: "Thu", label: "Thursday" },
  { value: "Fri", label: "Friday" },
  { value: "Sat", label: "Saturday" },
  { value: "Sun", label: "Sunday" },
];
const DAY_ORDER = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

export default function ClassTimetable() {
  // master data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // selections
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // input rows (per day)
  const blankRows = useMemo(
    () =>
      DAYS.map((d) => ({
        day_of_week: d.value,
        period: "",
        start_time: "",
        end_time: "",
      })),
    []
  );
  const [rows, setRows] = useState(blankRows);

  // list
  const [loadingList, setLoadingList] = useState(false);
  const [routines, setRoutines] = useState([]);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  // ---------- API helpers ----------
  const loadClasses = async () => {
    try {
      let res;
      try {
        res = await AxiosInstance.get("class-names/");
      } catch {
        res = await AxiosInstance.get("classes/"); // fallback if you had old endpoint
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
        res = await AxiosInstance.get("subjects/");
      }
      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load subjects");
    }
  };

  const serverLoadRoutines = async () => {
    const q = new URLSearchParams();
    if (selectedClass?.value) q.append("class_id", selectedClass.value);
    if (selectedSection?.value) q.append("section_id", selectedSection.value);
    if (selectedSubject?.value) q.append("subject_id", selectedSubject.value);

    const url = `timetable/${q.toString() ? `?${q.toString()}` : ""}`;
    const res = await AxiosInstance.get(url);
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
      // sort by day then time
      data.sort((a, b) => {
        const da = DAY_ORDER[a.day_of_week] ?? 0;
        const db = DAY_ORDER[b.day_of_week] ?? 0;
        if (da !== db) return da - db;
        return String(a.start_time).localeCompare(String(b.start_time));
      });
      setRoutines(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load timetable");
    } finally {
      setLoadingList(false);
    }
  };

  // ---------- options ----------
  const classOptions = useMemo(
    () =>
      classes.map((c) => ({
        value: c.id,
        label: c.name || c.title || `Class ${c.id}`,
        sections: c.sections || [],
      })),
    [classes]
  );

  const sectionOptions = useMemo(() => {
    if (!selectedClass) return [];
    const cls = classes.find((x) => x.id === selectedClass.value);
    // sections must be IDs (backend expects PK)
    return (cls?.sections || []).map((s) => ({ value: s.id, label: s.name }));
  }, [classes, selectedClass]);

  const subjectOptions = useMemo(
    () => (subjects || []).map((s) => ({ value: s.id, label: s.name })),
    [subjects]
  );

  // ---------- handlers ----------
  const updateRow = (i, key, val) => {
    setRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: val };
      return next;
    });
  };

  const copyFirstFilledToAll = () => {
    const src = rows.find((r) => r.start_time && r.end_time);
    if (!src) return toast("Enter a time on any day first, then copy.");
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        start_time: src.start_time,
        end_time: src.end_time,
      }))
    );
  };

  const clearAll = () => setRows(blankRows);

  const createMany = async () => {
    if (!selectedClass?.value) return toast.error("Select class");
    if (!selectedSection?.value) return toast.error("Select section");
    if (!selectedSubject?.value) return toast.error("Select subject");

    const payloads = rows
      .filter((r) => r.start_time && r.end_time) // only filled days
      .map((r) => ({
        class_name: selectedClass.value,      // FK id
        section: selectedSection.value,       // FK id
        subject: selectedSubject.value,       // FK id
        day_of_week: r.day_of_week,           // "Mon".."Sun"
        period: r.period || "",               // free text
        start_time: r.start_time,
        end_time: r.end_time,
      }));

    if (payloads.length === 0) return toast("Nothing to save.");

    try {
      await Promise.all(payloads.map((p) => AxiosInstance.post("timetable/", p)));
      toast.success("Timetable saved");
      await loadRoutines();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data
          ? typeof e.response.data === "string"
            ? e.response.data
            : JSON.stringify(e.response.data)
          : "Save failed";
      toast.error(msg);
    }
  };

  const openEdit = (row) => {
    setEditRow({
      ...row,
      _period: row.period || "",
      _start: row.start_time || "",
      _end: row.end_time || "",
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    try {
      const body = {
        day_of_week: editRow.day_of_week,
        period: editRow._period,
        start_time: editRow._start,
        end_time: editRow._end,
      };
      // use PATCH to avoid resending FKs
      await AxiosInstance.patch(`timetable/${editRow.id}/`, body);
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

  // ---------- effects ----------
  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass?.value) {
      loadSubjects(selectedClass.value);
    } else {
      setSubjects([]);
    }
    setSelectedSection(null);
    setSelectedSubject(null);
    setRows(blankRows);
  }, [selectedClass, blankRows]);

  useEffect(() => {
    loadRoutines();
  }, [selectedClass, selectedSection, selectedSubject]);

  // ---------- UI ----------
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
              {rows.map((r, i) => (
                <tr key={r.day_of_week} className="border-t">
                  <td className="px-3 py-2">
                    {DAYS.find((d) => d.value === r.day_of_week)?.label}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="border rounded px-2 py-1 w-36"
                      placeholder="e.g., 1st"
                      value={r.period}
                      onChange={(e) => updateRow(i, "period", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      className="border rounded px-2 py-1 w-36"
                      value={r.start_time}
                      onChange={(e) => updateRow(i, "start_time", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      className="border rounded px-2 py-1 w-36"
                      value={r.end_time}
                      onChange={(e) => updateRow(i, "end_time", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
            ? `— ${selectedClass.label}${selectedSection ? " • " + selectedSection.label : ""}`
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
                  <th className="px-3 py-2 text-left">Start</th>
                  <th className="px-3 py-2 text-left">End</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {routines.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.day_of_week}</td>
                    <td className="px-3 py-2">{r.period || "-"}</td>
                    <td className="px-3 py-2">{r.start_time}</td>
                    <td className="px-3 py-2">{r.end_time}</td>
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
                  value={DAYS.find((d) => d.value === editRow.day_of_week)}
                  onChange={(opt) =>
                    setEditRow((s) => ({ ...s, day_of_week: opt.value }))
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
