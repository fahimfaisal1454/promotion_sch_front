// src/admin/ClassRoutine.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import AxiosInstance from "../../../components/AxiosInstance";
import { Toaster, toast } from "react-hot-toast";
import {
  UploadCloud,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  Download,
  X,
  Search,
  Filter,
  RefreshCcw,
} from "lucide-react";

const CATEGORY_OPTIONS = ["Academic", "Exam"];

export default function ClassRoutine({
  endpoint = "routines/",
  classesEndpoint = "classes/",
  title = "Class Routine (Admin)",
}) {
  // ---------- Shared ----------
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingClasses(true);
        const res = await AxiosInstance.get(classesEndpoint);
        if (!alive) return;
        setClasses(Array.isArray(res.data) ? res.data : []);
      } catch {
        toast.error("Failed to load classes.");
      } finally {
        if (alive) setLoadingClasses(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [classesEndpoint]);

  const classNameById = (id) => {
    const found = classes.find((c) => String(c.id) === String(id));
    return found?.name || "N/A";
  };

  // ---------- Create (Upload) ----------
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    category: CATEGORY_OPTIONS[0],
    class_name: "",
    file: null,
  });
  const [createPreviewUrl, setCreatePreviewUrl] = useState("");
  const createFileRef = useRef(null);

  const acceptMime = ".pdf,.jpg,.jpeg,.png,.webp";
  const isImage = (file) => file && /^image\//.test(file.type);
  const isPdf = (file) => file && file.type === "application/pdf";

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((p) => ({ ...p, [name]: value }));
  };

  const handleCreateFile = (file) => {
    if (!file) return;
    if (!isPdf(file) && !isImage(file)) {
      toast.error("Only PDF or image files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10 MB.");
      return;
    }
    setCreateForm((p) => ({ ...p, file }));
    setCreatePreviewUrl(isImage(file) ? URL.createObjectURL(file) : "");
  };

  const onCreateFileChange = (e) => handleCreateFile(e.target.files?.[0]);

  const resetCreate = () => {
    setCreateForm({
      category: CATEGORY_OPTIONS[0],
      class_name: "",
      file: null,
    });
    setCreatePreviewUrl("");
    if (createFileRef.current) createFileRef.current.value = "";
  };

  const validateCreate = () => {
    if (!createForm.category) return "Category is required.";
    if (!createForm.class_name) return "Class is required.";
    if (!createForm.file) return "Please attach a PDF or image.";
    return null;
  };

  // ---------- List / Filters ----------
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);

  const [filterCat, setFilterCat] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [q, setQ] = useState("");

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterCat && r.category !== filterCat) return false;
      if (
        filterClass &&
        String(r.class_name) !== String(filterClass) &&
        String(r.class_name?.id) !== String(filterClass)
      )
        return false;

      if (q?.trim()) {
        const needle = q.toLowerCase();
        const clsText =
          typeof r.class_name === "object"
            ? r.class_name?.name || ""
            : classNameById(r.class_name);
        return (
          (r.category || "").toLowerCase().includes(needle) ||
          clsText.toLowerCase().includes(needle)
        );
      }
      return true;
    });
  }, [rows, filterCat, filterClass, q, classes]);

  const fetchRows = async () => {
    try {
      setLoadingRows(true);
      const res = await AxiosInstance.get(endpoint);
      const data = Array.isArray(res.data) ? res.data : [];
      data.sort((a, b) => Number(b.id) - Number(a.id)); // newest first
      setRows(data);
    } catch {
      toast.error("Failed to fetch routines.");
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [endpoint]);

  const clearFilters = () => {
    setFilterCat("");
    setFilterClass("");
    setQ("");
  };

  // ---------- Edit ----------
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    category: "",
    class_name: "",
    file: null, // optional
  });
  const [editPreviewUrl, setEditPreviewUrl] = useState("");
  const editFileRef = useRef(null);
  const [updating, setUpdating] = useState(false);

  const openEdit = (row) => {
    setEditing(true);
    setEditForm({
      id: row.id,
      category: row.category || CATEGORY_OPTIONS[0],
      class_name:
        typeof row.class_name === "object"
          ? String(row.class_name?.id || "")
          : String(row.class_name || ""),
      file: null,
    });
    setEditPreviewUrl("");
    if (editFileRef.current) editFileRef.current.value = "";
  };

  const closeEdit = () => {
    setEditing(false);
    setEditForm({ id: null, category: "", class_name: "", file: null });
    setEditPreviewUrl("");
    if (editFileRef.current) editFileRef.current.value = "";
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
  };

  const onEditFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isPdf(file) && !isImage(file)) {
      toast.error("Only PDF or image files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10 MB.");
      return;
    }
    setEditForm((p) => ({ ...p, file }));
    setEditPreviewUrl(isImage(file) ? URL.createObjectURL(file) : "");
  };

  const validateEdit = () => {
    if (!editForm.category) return "Category is required.";
    if (!editForm.class_name) return "Class is required.";
    return null;
  };

  // ---------- CRUD handlers ----------
  const handleCreate = async (e) => {
    e.preventDefault();
    const err = validateCreate();
    if (err) return toast.error(err);

    try {
      setCreating(true);
      const fd = new FormData();
      fd.append("category", createForm.category);
      fd.append("class_name", createForm.class_name);
      fd.append("file", createForm.file);

      await AxiosInstance.post(endpoint, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Routine uploaded successfully.");
      resetCreate();
      fetchRows();
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload routine.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const err = validateEdit();
    if (err) return toast.error(err);

    try {
      setUpdating(true);
      const fd = new FormData();
      fd.append("category", editForm.category);
      fd.append("class_name", editForm.class_name);
      if (editForm.file) fd.append("file", editForm.file); // optional

      await AxiosInstance.patch(`${endpoint}${editForm.id}/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Routine updated.");
      closeEdit();
      fetchRows();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update routine.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this routine permanently?")) return;
    try {
      await AxiosInstance.delete(`${endpoint}${id}/`);
      toast.success("Routine deleted.");
      fetchRows();
    } catch {
      toast.error("Failed to delete routine.");
    }
  };

  // ---------- UI ----------
  return (
    <section className="w-full py-8 px-4 md:px-8" style={{ backgroundColor: "#D2D3D4", color: "#111" }}>
      <Toaster position="top-center" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
          <button
            onClick={fetchRows}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-white text-sm font-semibold"
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Create Card */}
        <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
          <form onSubmit={handleCreate}>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Category */}
              <div>
                <label className="block mb-1 font-semibold text-sm text-black">Category</label>
                <select
                  name="category"
                  value={createForm.category}
                  onChange={handleCreateChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class */}
              <div>
                <label className="block mb-1 font-semibold text-sm text-black">Class</label>
                <select
                  name="class_name"
                  value={createForm.class_name}
                  onChange={handleCreateChange}
                  disabled={loadingClasses}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-60"
                >
                  <option value="">{loadingClasses ? "Loading classes..." : "Select class"}</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* File */}
              <div className="md:col-span-2">
                <label className="block mb-1 font-semibold text-sm text-black">File (PDF/Image)</label>
                <input
                  ref={createFileRef}
                  type="file"
                  accept={acceptMime}
                  onChange={onCreateFileChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Accepted: PDF, JPG, JPEG, PNG, WEBP. Max size 10 MB.
                </p>

                {createForm.file && (
                  <div className="mt-4 flex items-center gap-3">
                    {isImage(createForm.file) ? (
                      <img src={createPreviewUrl} alt="preview" className="h-28 w-28 object-cover rounded border" />
                    ) : (
                      <div className="h-28 w-28 rounded border bg-gray-50 flex items-center justify-center">
                        <FileText className="h-10 w-10 text-gray-500" />
                      </div>
                    )}
                    <div className="text-sm">
                      <div className="font-semibold">{createForm.file.name}</div>
                      <div className="text-gray-600">
                        {(createForm.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-gray-200 border-t border-gray-300 flex items-center justify-between">
              <button
                type="button"
                onClick={resetCreate}
                className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm font-semibold"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-60"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    Upload Routine
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Filters + List */}
        <div className="max-w-6xl mx-auto mt-8 bg-white rounded-xl shadow border border-gray-300 p-5">
          <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Filter className="h-4 w-4" />
              <span className="font-semibold text-sm">Filters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
              >
                <option value="">All Categories</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white"
                />
              </div>
            </div>

            <button
              onClick={clearFilters}
              className="ml-auto px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
            >
              Clear
            </button>
          </div>

          {/* Table */}
          {loadingRows ? (
            <div className="py-10 text-center text-gray-600">Loading routines…</div>
          ) : filteredRows.length === 0 ? (
            <div className="py-10 text-center text-gray-600">No routines found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2">Category</th>
                    <th className="border border-gray-300 px-3 py-2">Class</th>
                    <th className="border border-gray-300 px-3 py-2">File</th>
                    <th className="border border-gray-300 px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => {
                    const clsText =
                      typeof r.class_name === "object"
                        ? r.class_name?.name || "N/A"
                        : classNameById(r.class_name);
                    return (
                      <tr key={r.id}>
                        <td className="border border-gray-300 px-3 py-2">{r.category}</td>
                        <td className="border border-gray-300 px-3 py-2">{clsText}</td>
                        <td className="border border-gray-300 px-3 py-2">
                          <a
                            href={r.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Download className="w-4 h-4" /> View / Download
                          </a>
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(r)}
                              className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-1"
                            >
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-3">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-gray-300 overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between bg-gray-100 border-b">
              <h3 className="text-lg font-bold">Edit Routine</h3>
              <button onClick={closeEdit} className="p-1 rounded hover:bg-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Category */}
                <div>
                  <label className="block mb-1 font-semibold text-sm text-black">Category</label>
                  <select
                    name="category"
                    value={editForm.category}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class */}
                <div>
                  <label className="block mb-1 font-semibold text-sm text-black">Class</label>
                  <select
                    name="class_name"
                    value={editForm.class_name}
                    onChange={handleEditChange}
                    disabled={loadingClasses}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-60"
                  >
                    <option value="">{loadingClasses ? "Loading classes..." : "Select class"}</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* File (optional) */}
                <div className="md:col-span-2">
                  <label className="block mb-1 font-semibold text-sm text-black">
                    Replace File (PDF/Image) — optional
                  </label>
                  <input
                    ref={editFileRef}
                    type="file"
                    accept={acceptMime}
                    onChange={onEditFileChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Leave empty to keep existing file. Max 10 MB. Accepted: PDF, JPG, JPEG, PNG, WEBP.
                  </p>

                  {editForm.file && (
                    <div className="mt-4 flex items-center gap-3">
                      {isImage(editForm.file) ? (
                        <img src={editPreviewUrl} alt="preview" className="h-28 w-28 object-cover rounded border" />
                      ) : (
                        <div className="h-28 w-28 rounded border bg-gray-50 flex items-center justify-center">
                          <FileText className="h-10 w-10 text-gray-500" />
                        </div>
                      )}
                      <div className="text-sm">
                        <div className="font-semibold">{editForm.file.name}</div>
                        <div className="text-gray-600">
                          {(editForm.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button type="button" onClick={closeEdit} className="px-4 py-2 rounded-lg border bg-white">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-60"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}