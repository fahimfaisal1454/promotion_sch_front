import React, { useEffect, useRef, useState } from "react";
import AxiosInstance from "../../../components/AxiosInstance"; // adjust path if needed
import { Toaster, toast } from "react-hot-toast";
import { UploadCloud, Loader2, Trash2, Pencil, FileText, Image as ImageIcon, X } from "lucide-react";

/**
 * AdminAcknowledgment.jsx
 * Admin page to create/manage acknowledgements (image or PDF)
 * API endpoint base: "acknowledgment/"
 * Fields: title (str), image (file url), date (date string)
 */
export default function AdminAcknowledgment() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({ id: null, title: "", date: "", file: null });
  const [previewUrl, setPreviewUrl] = useState("");
  const fileRef = useRef(null);

  const endpoint = "acknowledgment/"; // list/create: GET/POST, update: PUT/PATCH `${endpoint}{id}/`, delete: DELETE `${endpoint}{id}/`

  // Helpers
  const isImageUrl = (url = "") => /\.(png|jpe?g|webp|gif|bmp|tiff?)($|\?)/i.test(url);
  const isPdfUrl = (url = "") => /\.pdf($|\?)/i.test(url);

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toISOString().slice(0, 10); // yyyy-mm-dd for inputs
    } catch {
      return iso;
    }
  };

  const niceDate = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return iso;
    }
  };

  // Load existing
  const fetchRows = async () => {
    try {
      setLoading(true);
      const res = await AxiosInstance.get(endpoint);
      const data = Array.isArray(res.data) ? res.data : [];
      data.sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0));
      setRows(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load acknowledgements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  // Form handlers
  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      const f = files && files[0];
      setForm((prev) => ({ ...prev, file: f }));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (f && f.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(f));
      } else if (f) {
        setPreviewUrl("");
      } else {
        setPreviewUrl("");
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setForm({ id: null, title: "", date: "", file: null });
    setPreviewUrl("");
    setEditing(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const validate = () => {
    if (!form.title?.trim()) return "Title is required";
    if (!form.date) return "Date is required";
    if (!editing && !form.file) return "Please choose a file (image/PDF)";
    if (form.file && !/(image\/.+|application\/pdf)/.test(form.file.type)) return "Only image or PDF allowed";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) return toast.error(v);

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("date", form.date);
    if (form.file) fd.append("image", form.file); // backend field name: image

    try {
      setSubmitting(true);
      if (editing && form.id) {
        // Try PATCH; if backend expects PUT, change accordingly
        await AxiosInstance.patch(`${endpoint}${form.id}/`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Acknowledgment updated");
      } else {
        await AxiosInstance.post(endpoint, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Acknowledgment created");
      }
      resetForm();
      fetchRows();
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = (row) => {
    setEditing(true);
    setForm({ id: row.id, title: row.title || "", date: formatDate(row.date), file: null });
    setPreviewUrl("");
    if (fileRef.current) fileRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (row) => {
    if (!confirm(`Delete \"${row.title}\"?`)) return;
    try {
      await AxiosInstance.delete(`${endpoint}${row.id}/`);
      toast.success("Deleted");
      fetchRows();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  return (
    <section className="w-full py-8 px-4 md:px-8">
      <Toaster position="top-center" />

      <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Manage Acknowledgements
      </h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-5 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title<span className="text-red-500">*</span></label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="e.g., Best Paper Award"
              className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date<span className="text-red-500">*</span></label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={onChange}
              className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload (Image/PDF){!editing && <span className="text-red-500">*</span>}</label>
            <input
              ref={fileRef}
              type="file"
              name="file"
              accept="image/*,application/pdf"
              onChange={onChange}
              className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              required={!editing}
            />
          </div>
        </div>

        {/* Preview */}
        {form.file && (
          <div className="mt-4">
            <div className="inline-flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
              {form.file.type.startsWith("image/") ? (
                <>
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                  <img src={previewUrl} alt="preview" className="h-24 w-24 object-cover rounded-lg border" />
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{form.file.name}</span>
                </>
              )}
              <button type="button" onClick={() => { setForm((p) => ({ ...p, file: null })); if (fileRef.current) fileRef.current.value = ""; setPreviewUrl(""); }} className="ml-2 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                <X className="w-4 h-4" /> Clear
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {editing ? "Update" : "Upload"}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} className="rounded-xl border px-4 py-2 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700">
              Cancel edit
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <div className="flex items-end justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Existing Acknowledgements</h3>
        <span className="text-sm text-gray-500">Total: {rows.length}</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="mt-2 h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="h-44 bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-gray-600 dark:text-gray-300">
          Nothing uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rows.map((r) => {
            const url = r?.image || r?.file || "";
            return (
              <div key={r.id || r.title} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
                <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{r.title || "Untitled"}</h4>
                    {r.date && <p className="text-xs text-gray-500 mt-1">{niceDate(r.date)}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => onEdit(r)} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm">
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => onDelete(r)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>

                <div className="relative">
                  {url ? (
                    isImageUrl(url) ? (
                      <img src={url} alt={r.title} className="h-44 w-full object-cover" />
                    ) : isPdfUrl(url) ? (
                      <div className="h-44 w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                        <FileText className="h-10 w-10" />
                        <span className="ml-2 text-sm">PDF</span>
                      </div>
                    ) : (
                      <div className="h-44 w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-sm text-gray-600">Document</span>
                      </div>
                    )
                  ) : (
                    <div className="h-44 w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                      <span className="text-sm text-gray-600">No file</span>
                    </div>
                  )}

                  {url && (
                    <a href={url} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/35">
                      <span className="px-3 py-1.5 rounded-full bg-white text-gray-800 text-xs font-semibold shadow">View / Download</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
