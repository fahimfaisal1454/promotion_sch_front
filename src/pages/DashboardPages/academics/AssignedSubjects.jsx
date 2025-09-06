import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Toaster, toast } from "react-hot-toast";
import AxiosInstance from "../../../components/AxiosInstance";

/** Small badge styling */
const Badge = ({ children }) => (
  <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full border border-emerald-300 text-emerald-700 bg-emerald-50 mr-1 mb-1">
    {children}
  </span>
);

export default function AssignedSubjects() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState(null);
  const [editSelectedSections, setEditSelectedSections] = useState([]);

  // === Fetchers ===
  const loadClasses = async () => {
    const res = await AxiosInstance.get("classes/");
    setClasses(res.data || []);
  };

  const loadSubjectsForClass = async (classId) => {
    const res = await AxiosInstance.get(`subjects/?class=${classId}`);
    setSubjects(res.data || []);
  };

  const loadAssignments = async (classId) => {
    const res = await AxiosInstance.get(`class-subjects/?class_id=${classId}`);
    setAssignments(res.data || []);
  };

  useEffect(() => {
    loadClasses().catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedClass?.value) {
      loadSubjectsForClass(selectedClass.value).catch(console.error);
      loadAssignments(selectedClass.value).catch(console.error);
      setSelectedSections([]);
      setSelectedSubjects([]);
    }
  }, [selectedClass]);

  // === Options ===
  const classOptions = useMemo(
    () =>
      classes.map((c) => ({
        value: c.id,
        label: c.name,
        sections: c.sections || [],
      })),
    [classes]
  );

  const sectionOptions = useMemo(() => {
    if (!selectedClass) return [];
    const cls = classes.find((x) => x.id === selectedClass.value);
    return (cls?.sections || []).map((s) => ({ value: s.id, label: s.name }));
  }, [selectedClass, classes]);

  const subjectOptions = useMemo(
    () =>
      (subjects || []).map((s) => ({
        value: s.id,
        label: `${s.name}${
          s.is_practical ? " (Practical)" : s.is_theory ? " (Theory)" : ""
        }`,
      })),
    [subjects]
  );

  // === Assign new combinations ===
  const assign = async () => {
    if (!selectedClass?.value) return toast.error("Select a class.");
    if (!selectedSections.length)
      return toast.error("Select at least one section.");
    if (!selectedSubjects.length)
      return toast.error("Select at least one subject.");

    try {
      setLoading(true);
      const payload = {
        class_id: selectedClass.value,
        section_ids: selectedSections.map((s) => s.value),
        subject_ids: selectedSubjects.map((s) => s.value),
      };
      const res = await AxiosInstance.post(
        "class-subjects/bulk-assign/",
        payload
      );
      toast.success(
        `Assigned: ${res.data?.created ?? 0}, Skipped: ${
          res.data?.skipped_existing ?? 0
        }`
      );
      await loadAssignments(selectedClass.value);
      // clear picks (optional)
      setSelectedSections([]);
      setSelectedSubjects([]);
    } catch (e) {
      console.error(e);
      toast.error("Assignment failed.");
    } finally {
      setLoading(false);
    }
  };

  // === Group assignments by subject ===
  const subjectsById = useMemo(() => {
    const map = new Map();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  const grouped = useMemo(() => {
    // Map<subjectId, {subjectId, subjectName, rows:[], typeText}>
    const map = new Map();
    assignments.forEach((a) => {
      const subj = subjectsById.get(a.subject);
      if (!map.has(a.subject)) {
        let type = "-";
        if (subj) {
          if (subj.is_theory && subj.is_practical) type = "Both";
          else if (subj.is_practical) type = "Practical";
          else if (subj.is_theory) type = "Theory";
        }
        map.set(a.subject, {
          subjectId: a.subject,
          subjectName: a.subject_name,
          typeText: type,
          rows: [],
        });
      }
      map.get(a.subject).rows.push(a);
    });

    // sort sections inside each group by name
    const arr = Array.from(map.values());
    arr.forEach((g) =>
      g.rows.sort((r1, r2) =>
        (r1.section_name || "").localeCompare(r2.section_name || "")
      )
    );
    // sort groups by subject name
    arr.sort((g1, g2) => g1.subjectName.localeCompare(g2.subjectName));
    return arr;
  }, [assignments, subjectsById]);

  // === Edit Modal handlers ===
  const openEdit = (subjectId) => {
    setEditSubjectId(subjectId);
    // preselect current sections for this subject
    const current = assignments
      .filter((a) => a.subject === subjectId)
      .map((a) => ({ value: a.section, label: a.section_name }));
    setEditSelectedSections(current);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditSubjectId(null);
    setEditSelectedSections([]);
  };

  const saveEdit = async () => {
    if (!selectedClass?.value || !editSubjectId) return;

    // compute diffs
    const beforeIds = new Set(
      assignments
        .filter((a) => a.subject === editSubjectId)
        .map((a) => a.section)
    );
    const afterIds = new Set(editSelectedSections.map((s) => s.value));

    const toAdd = [];
    const toRemove = [];
    // additions
    afterIds.forEach((id) => {
      if (!beforeIds.has(id)) toAdd.push(id);
    });
    // removals (collect assignment ids to delete)
    assignments
      .filter((a) => a.subject === editSubjectId)
      .forEach((a) => {
        if (!afterIds.has(a.section)) toRemove.push(a.id);
      });

    try {
      setLoading(true);

      if (toAdd.length) {
        await AxiosInstance.post("class-subjects/bulk-assign/", {
          class_id: selectedClass.value,
          section_ids: toAdd,
          subject_ids: [editSubjectId],
        });
      }

      for (const id of toRemove) {
        // delete each removed assignment
        await AxiosInstance.delete(`class-subjects/${id}/`);
      }

      toast.success("Updated assignments");
      await loadAssignments(selectedClass.value);
      closeEdit();
    } catch (e) {
      console.error(e);
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Toaster position="top-center" />

      {/* Assign form */}
      <div className="bg-white rounded shadow p-4 mb-4">
        <h2 className="text-xl font-semibold mb-3">
          Assign Subjects to Class Sections
        </h2>

        <div className="grid md:grid-cols-3 gap-3">
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
            <label className="block text-sm mb-1">Sections</label>
            <Select
              isMulti
              options={sectionOptions}
              value={selectedSections}
              onChange={setSelectedSections}
              placeholder="Select sections"
              isDisabled={!selectedClass}
              closeMenuOnSelect={false}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Subjects</label>
            <Select
              isMulti
              options={subjectOptions}
              value={selectedSubjects}
              onChange={setSelectedSubjects}
              placeholder="Select subjects"
              isDisabled={!selectedClass}
              closeMenuOnSelect={false}
            />
          </div>
        </div>

        <div className="mt-3">
          <button
            onClick={assign}
            disabled={loading}
            className="px-5 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>

      {/* Grouped table */}
      <div className="bg-white rounded shadow p-4">
        <h3 className="text-lg font-semibold mb-3">
          Current Assignments {selectedClass ? `— ${selectedClass.label}` : ""}
        </h3>

        {!selectedClass ? (
          <div className="text-slate-500">Select a class to view assignments.</div>
        ) : grouped.length === 0 ? (
          <div className="text-slate-500">No assignments yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left">Subject</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Sections</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((g) => (
                  <tr key={g.subjectId} className="border-t align-top">
                    <td className="px-3 py-2">{g.subjectName}</td>
                    <td className="px-3 py-2">{g.typeText}</td>
                    <td className="px-3 py-2">
                      {g.rows.map((r) => (
                        <Badge key={r.id}>{r.section_name}</Badge>
                      ))}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => openEdit(g.subjectId)}
                        className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 mr-2"
                      >
                        Edit
                      </button>
                      {/* Optional: Remove all for this subject (commented)
                      <button
                        onClick={() => removeAllForSubject(g.subjectId)}
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Remove all
                      </button> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-5">
              <h3 className="text-lg font-semibold mb-3">
                Edit sections for{" "}
                <span className="text-indigo-700 font-bold">
                  {subjectsById.get(editSubjectId)?.name || "Subject"}
                </span>
              </h3>

              <label className="block text-sm mb-1">Sections</label>
              <Select
                isMulti
                closeMenuOnSelect={false}
                options={sectionOptions}
                value={editSelectedSections}
                onChange={setEditSelectedSections}
                placeholder="Select sections"
              />

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={closeEdit}
                  className="px-4 py-2 rounded border"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={loading}
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
