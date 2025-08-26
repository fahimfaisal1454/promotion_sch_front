import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import AxiosInstance from "../../../components/AxiosInstance";

const getNoticeDate = (n) => n?.date || n?.created_at || n?.updated_at || null;

const formatDate = (dStr) => {
  if (!dStr) return "N/A";
  const d = new Date(dStr);
  if (isNaN(d)) return "N/A";
  return new Intl.DateTimeFormat("bn-BD", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
};

const isNew = (dStr) => {
  if (!dStr) return false;
  const d = new Date(dStr);
  if (isNaN(d)) return false;
  return Date.now() - d.getTime() <= 7 * 24 * 60 * 60 * 1000;
};

export default function AddNotice() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    pdf_file: null,
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState("");
  const [search, setSearch] = useState("");

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await AxiosInstance.get("notices/");
      const sorted = [...(res?.data || [])].sort((a, b) => {
        const da = new Date(getNoticeDate(a) || 0).getTime();
        const db = new Date(getNoticeDate(b) || 0).getTime();
        return db - da;
      });
      setNotices(sorted);
    } catch {
      toast.error("নোটিশ লোড করতে ব্যর্থ ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notices;
    return notices.filter((n) => {
      const t = (n?.title || "").toLowerCase();
      const d = (n?.description || "").toLowerCase();
      return t.includes(q) || d.includes(q);
    });
  }, [search, notices]);

  const truncate = (text, max = 60) =>
    text?.length > max ? `${text.slice(0, max)}…` : text || "N/A";

  const openCreateModal = () => {
    resetForm();
    setEditMode(false);
    setEditId(null);
    setExistingPdfUrl("");
    document.getElementById("notice_modal")?.showModal();
  };

  const editNotice = (notice) => {
    resetForm();
    setFormData({
      title: notice.title || "",
      description: notice.description || "",
      category: notice.category || "",
      pdf_file: null,
    });
    setExistingPdfUrl(notice?.pdf_file || "");
    setEditMode(true);
    setEditId(notice.id);
    document.getElementById("notice_modal")?.showModal();
  };

  const deleteNotice = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে নোটিশটি মুছে ফেলতে চান?")) return;
    try {
      await AxiosInstance.delete(`notices/${id}/`);
      toast.success("নোটিশ মুছে ফেলা হয়েছে ✅");
      fetchNotices();
    } catch {
      toast.error("নোটিশ মুছে ফেলতে ব্যর্থ ❌");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    const f = e?.target?.files?.[0] || null;
    setFormData((p) => ({ ...p, pdf_file: f }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("description", formData.description);
    payload.append("category", formData.category || "general");
    if (formData.pdf_file instanceof File) {
      payload.append("pdf_file", formData.pdf_file);
    }

    try {
      if (editMode) {
        await AxiosInstance.put(`notices/${editId}/`, payload);
        toast.success("নোটিশ আপডেট হয়েছে ✅");
      } else {
        await AxiosInstance.post("notices/", payload);
        toast.success("নোটিশ যুক্ত হয়েছে ✅");
      }
      closeModalAndRefresh();
    } catch {
      toast.error(editMode ? "আপডেট ব্যর্থ ❌" : "নোটিশ যুক্ত করতে ব্যর্থ ❌");
    }
  };

  const closeModalAndRefresh = () => {
    resetForm();
    setEditMode(false);
    setEditId(null);
    setExistingPdfUrl("");
    document.getElementById("notice_modal")?.close();
    fetchNotices();
  };

  const resetForm = () => {
    setFormData({ title: "", description: "",category: "", pdf_file: null });
    const input = document.getElementById("pdf_input");
    if (input) input.value = "";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-base-100 text-base-content text-lg">
      {/* Header */}
      <div className="sticky top-0 z-10 mb-4 bg-base-100/80 backdrop-blur border border-base-300 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-primary">📌 নোটিশ বোর্ড</h2>
          <p className="text-base opacity-70">
            সর্বশেষ নোটিশগুলো উপরে প্রদর্শিত হবে
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="খুঁজুন (শিরোনাম/বর্ণনা)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full md:w-72 text-base"
          />
          <button
            onClick={openCreateModal}
            className="btn btn-primary text-primary-content text-base px-5"
          >
            + Add Notice
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-base-300 rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-10 text-center opacity-70 text-xl">লোড হচ্ছে…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-xl font-semibold">কোন নোটিশ পাওয়া যায়নি</div>
            <div className="text-base opacity-70">
              নতুন নোটিশ যোগ করতে “Add Notice” বাটনে ক্লিক করুন
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table text-lg">
              <thead className="bg-primary text-primary-content">
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th className="whitespace-nowrap">Date</th>
                  <th>Description</th>
                  <th className="text-center">PDF</th>
                  <th className="text-center w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((notice, i) => {
                  const dStr = getNoticeDate(notice);
                  return (
                    <tr
                      key={notice.id ?? i}
                      className="hover:bg-base-200 transition-colors"
                    >
                      <td>{i + 1}</td>
                      <td className="font-semibold">
                        <div className="flex items-center gap-2">
                          <span>{notice.title}</span>
                          {isNew(dStr) && (
                            <span className="badge badge-success">NEW</span>
                          )}
                        </div>
                      </td>
                      <td>{notice.category}</td>
                      <td className="whitespace-nowrap">{formatDate(dStr)}</td>
                      <td className="opacity-90">{truncate(notice.description)}</td>
                      <td className="text-center">
                        {notice.pdf_file ? (
                          <a
                            href={notice.pdf_file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link link-primary"
                          >
                            View
                          </a>
                        ) : (
                          <span className="opacity-50">N/A</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => editNotice(notice)}
                            className="btn btn-outline btn-warning text-base px-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteNotice(notice.id)}
                            className="btn btn-outline btn-error text-base px-4"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="text-right p-3 opacity-70 text-base">
                    মোট: {filtered.length} টি নোটিশ
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <dialog id="notice_modal" className="modal">
        <div className="modal-box max-w-xl bg-base-100 text-base-content border border-base-300 text-lg">
          <h3 className="font-bold text-2xl text-primary mb-4">
            {editMode ? "Edit Notice" : "Add Notice"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Title <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="input input-bordered w-full text-lg"
                placeholder="নোটিশের শিরোনাম"
              />
            </div>

            <div>
              <label className="label py-1">
                Category<span className="mr-1 text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="select select-bordered select-sm w-full focus:outline-none focus:ring ring-primary/30"
              >
                <option value="">Select Category</option>
                <option value="government_order">সরকারি আদেশ</option>
                <option value="executive_order">নির্বাহী আদেশ</option>
                <option value="notification">প্রজ্ঞাপন</option>

              </select> 
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Description</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="textarea textarea-bordered w-full min-h-28 text-lg"
                placeholder="সংক্ষিপ্ত বর্ণনা (ঐচ্ছিক)"
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                PDF File<span className="mr-1 text-red-500">*</span>
              </label>
              {editMode && existingPdfUrl && !formData.pdf_file && (
                <div className="flex items-center justify-between border border-base-300 rounded-lg p-3 mb-2 bg-base-200/50 text-base">
                  <a
                    href={existingPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary text-sm"
                    required
                  >
                    View current PDF
                  </a>
                  <span className="opacity-70 text-sm">
                    (Selecting a new file will replace it)
                  </span>
                </div>
              )}
              <input
                id="pdf_input"
                type="file"
                name="pdf_file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="file-input file-input-bordered w-full text-base"
              />
            </div>

            <div className="modal-action">
              <button type="submit" className="btn btn-primary text-base px-5">
                {editMode ? "Update" : "Save"}
              </button>
              <button
                type="button"
                className="btn text-base px-5"
                onClick={() => document.getElementById("notice_modal")?.close()}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button className="bg-black/30 dark:bg-black/50">close</button>
        </form>
      </dialog>
    </div>
  );
}