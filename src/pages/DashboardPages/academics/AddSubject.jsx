// src/pages/DashboardPages/Master/AddSubject.jsx
import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Toaster, toast } from "react-hot-toast";
import axiosInstance from "../../../components/AxiosInstance";

export default function AddSubject() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // form state (create/edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    class_name: "",      // class id
    is_theory: true,
    is_practical: false,
  });

  // filters
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState(null);

  const classOptions = useMemo(
    () =>
      (classes || []).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [classes]
  );

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        axiosInstance.get("subjects/"),
        axiosInstance.get("classes/"),
      ]);
      setSubjects(sRes.data || []);
      setClasses((cRes.data || []).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    let data = [...subjects];
    if (q.trim()) {
      const n = q.trim().toLowerCase();
      data = data.filter((s) => (s.name || "").toLowerCase().includes(n));
    }
    if (classFilter?.value) {
      data = data.filter((s) => String(s.class_name) === String(classFilter.value));
    }
    return data;
  }, [subjects, q, classFilter]);

  const openCreate = () => {
    setForm({ name: "", class_name: "", is_theory: true, is_practical: false });
    setIsEditing(false);
    setCurrentId(null);
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    setForm({
      name: row.name || "",
      class_name: row.class_name || "",
      is_theory: !!row.is_theory,
      is_practical: !!row.is_practical,
    });
    setIsEditing(true);
    setCurrentId(row.id);
    setIsModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Subject name is required");
    if (!form.class_name) return toast.error("Please select a class");

    try {
      const payload = {
        name: form.name.trim(),
        class_name: form.class_name,
        is_theory: !!form.is_theory,
        is_practical: !!form.is_practical,
      };
      if (isEditing) {
        await axiosInstance.put(`subjects/${currentId}/`, payload);
        toast.success("Subject updated");
      } else {
        await axiosInstance.post("subjects/", payload);
        toast.success("Subject created");
      }
      setIsModalOpen(false);
      await loadAll();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data || e?.message || "Save failed";
      toast.error(typeof msg === "string" ? msg : "Save failed");
    }
  };

  const destroy = async (id) => {
    if (!confirm("Delete this subject?")) return;
    try {
      await axiosInstance.delete(`subjects/${id}/`);
      toast.success("Subject deleted");
      await loadAll();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  };

  return (
    <div className="p-4">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Subject Management</h2>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Add Subject
        </button>
      </div>

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-2 max-w-2xl mb-4">
        <div>
          <label className="block text-sm mb-1 text-slate-700">Search by name</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type subject name…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-slate-700">Filter by class</label>
          <Select
            isClearable
            options={classOptions}
            value={classFilter}
            onChange={setClassFilter}
            placeholder="All classes"
            classNamePrefix="select"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left text-sm text-slate-600 w-16">#</th>
              <th className="px-3 py-2 text-left text-sm text-slate-600">Subject</th>
              <th className="px-3 py-2 text-left text-sm text-slate-600">Class</th>
              <th className="px-3 py-2 text-left text-sm text-slate-600">Type</th>
              <th className="px-3 py-2 text-right text-sm text-slate-600 w-44">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500" colSpan={5}>
                  No subjects found
                </td>
              </tr>
            ) : (
              filtered.map((s, i) => {
                const cls = classes.find((c) => String(c.id) === String(s.class_name));
                const typeLabels = [
                  s.is_theory ? "Theoretical" : null,
                  s.is_practical ? "Practical" : null,
                ].filter(Boolean);
                return (
                  <tr key={s.id} className="border-t hover:bg-slate-50/50">
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{s.name || "-"}</td>
                    <td className="px-3 py-2">{cls?.name || "-"}</td>
                    <td className="px-3 py-2">
                      {typeLabels.length ? typeLabels.join(", ") : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => destroy(s.id)}
                          className="px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white rounded-xl w-[94%] max-w-md shadow-xl border">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {isEditing ? "Edit Subject" : "Add Subject"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={save} className="px-5 py-5 grid gap-4">
              <div>
                <label className="block text-sm mb-1 text-slate-700">Subject name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Mathematics, Physics"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-slate-700">Class *</label>
                <Select
                  options={classOptions}
                  value={classOptions.find((o) => String(o.value) === String(form.class_name)) || null}
                  onChange={(opt) => setForm((f) => ({ ...f, class_name: opt?.value || "" }))}
                  placeholder="Select class…"
                  classNamePrefix="select"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-slate-700">Subject type</label>
                <div className="flex items-center gap-5">
                  <label className="inline-flex items-center gap-2 text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.is_theory}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, is_theory: e.target.checked }))
                      }
                    />
                    <span>Theoretical</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.is_practical}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, is_practical: e.target.checked }))
                      }
                    />
                    <span>Practical</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isEditing ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
