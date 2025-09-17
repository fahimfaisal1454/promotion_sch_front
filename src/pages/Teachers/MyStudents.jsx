import { useEffect, useMemo, useState } from "react";
import AxiosInstance from "../../components/AxiosInstance";

export default function MyStudents() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  // dropdown state
  const [classes, setClasses] = useState([]);          // [{id, name, sections:[{id,name}]}]
  const [selectedClassId, setSelectedClassId] = useState("");
  const [sections, setSections] = useState([]);        // current class' sections
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [subjects, setSubjects] = useState([]);        // subjects for selected class+section
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  // 1) Load classes (with embedded sections)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await AxiosInstance.get("class-names/");
        if (!cancelled) setClasses(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load classes", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 2) When class changes, update sections and reset section+subject
  useEffect(() => {
    const cls = classes.find(c => String(c.id) === String(selectedClassId));
    setSections(cls?.sections || []);
    setSelectedSectionId("");
    setSubjects([]);
    setSelectedSubjectId("");
  }, [selectedClassId, classes]);

  // 3) When section changes, load subjects assigned to this teacher in that class+section
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedClassId || !selectedSectionId) {
        setSubjects([]);
        setSelectedSubjectId("");
        return;
      }
      try {
        const { data } = await AxiosInstance.get("timetable/", {
          params: { teacher: "me", class_id: selectedClassId, section_id: selectedSectionId },
        });
        if (!cancelled) {
          const subjOpts = (Array.isArray(data) ? data : [])
            .map(r => ({ id: r.subject, name: r.subject_label }));
          // dedupe by id
          const seen = new Map();
          subjOpts.forEach(s => { if (!seen.has(s.id)) seen.set(s.id, s.name); });
          setSubjects(Array.from(seen, ([id, name]) => ({ id, name })));
          setSelectedSubjectId("");
        }
      } catch (e) {
        console.error("Failed to load subjects", e);
        if (!cancelled) {
          setSubjects([]);
          setSelectedSubjectId("");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedClassId, selectedSectionId]);

  // 4) Fetch students when all three are selected
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedClassId || !selectedSectionId || !selectedSubjectId) {
        setRows([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await AxiosInstance.get("students/", {
          params: {
            class_id: selectedClassId,
            section_id: selectedSectionId,
            subject_id: selectedSubjectId,
          },
        });
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load students", e);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedClassId, selectedSectionId, selectedSubjectId]);

  // search filter
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <h2 className="text-xl font-semibold">My Students</h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class select */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Section select */}
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            disabled={!selectedClassId}
            className="px-3 py-2 border rounded-lg text-sm bg-white disabled:bg-slate-100"
          >
            <option value="">Select section…</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Subject select */}
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={!selectedSectionId}
            className="px-3 py-2 border rounded-lg text-sm bg-white disabled:bg-slate-100"
          >
            <option value="">Select subject…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Search box */}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-64 px-3 py-2 border rounded-lg text-sm"
            placeholder="Search by name, roll, class, section…"
          />
        </div>
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

        {loading ? (
          <div className="p-4 text-sm">Loading…</div>
        ) : filtered.length ? (
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
          <div className="p-4 text-sm text-slate-500">
            {selectedClassId && selectedSectionId && selectedSubjectId
              ? "No students found."
              : "Pick class, section, and subject to load students."}
          </div>
        )}
      </div>
    </div>
  );
}
