// src/pages/DashboardPages/academics/TeacherInfo.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { toast, Toaster } from "react-hot-toast";
import AxiosInstance from "../../../components/AxiosInstance";

const emptyTeacher = {
  full_name: "",
  designation: "",
  contact_email: "",
  contact_phone: "",
  subject: "", // stores subject ID (number or "")
  profile: "",
  photo: null,
};

export default function TeacherInfo() {
  const navigate = useNavigate();

  // UI
  const [loading, setLoading] = useState(false);
  const [tableBusy, setTableBusy] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [subjects, setSubjects] = useState([]); // [{id, name, class_name, class_name_label, ...}]
  const [rawTeachers, setRawTeachers] = useState([]); // keep raw; normalize in memo

  // Filters
  const [search, setSearch] = useState("");
  const [designationFilter, setDesignationFilter] = useState(null);

  // Subject options mode
  const [showSubjectsByClass, setShowSubjectsByClass] = useState(false);

  // Form
  const [form, setForm] = useState(emptyTeacher);

  /* ----------------------------- Fetch Helpers ----------------------------- */

  const loadSubjects = async () => {
    try {
      // If your API supports filtering by class, you can pass ?class_id=...
      const res = await AxiosInstance.get("subjects/");
      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load subjects");
      setSubjects([]);
    }
  };

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await AxiosInstance.get("teachers/");
      setRawTeachers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadSubjects();
      await loadTeachers();
    })();
  }, []);

  /* ----------------------------- Normalization ----------------------------- */

  const subjectName = (s) => (s?.name || s?.title || `Subject #${s?.id}`).trim();

  // Deduped options (one label per subject name, first ID wins)
  const subjectOptionsDeduped = useMemo(() => {
    const map = new Map(); // lower(label) -> {value,label}
    for (const s of subjects) {
      const label = subjectName(s);
      const key = label.toLowerCase();
      if (!map.has(key)) map.set(key, { value: s.id, label });
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [subjects]);

  // By-class options (“Bangla — Class 5”)
  const subjectOptionsByClass = useMemo(() => {
    return (subjects || [])
      .map((s) => ({
        value: s.id,
        label: `${subjectName(s)}${
          s.class_name_label ? ` — ${s.class_name_label}` : s.class_name ? ` — Class #${s.class_name}` : ""
        }`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [subjects]);

  const subjectOptions = showSubjectsByClass ? subjectOptionsByClass : subjectOptionsDeduped;

  const isLinked = (t) => Boolean(t?.user || t?.user_id || t?.user_username);

  const subjectLabelById = useMemo(() => {
    const m = {};
    for (const s of subjects) m[String(s.id)] = subjectName(s);
    return m;
  }, [subjects]);

  const teachers = useMemo(() => {
    return (rawTeachers || []).map((t) => {
      const subjId = t.subject?.id ?? t.subject ?? null;
      const subjLabel =
        t.subject_name ||
        t.subject?.name ||
        (subjId != null ? subjectLabelById[String(subjId)] : null) ||
        (typeof t.subject === "string" ? t.subject : "-");

      return {
        id: t.id,
        full_name: t.full_name || "-",
        designation: String(t.designation || ""),
        subject_id: subjId,
        subject_label: subjLabel,
        contact_email: t.contact_email || "-",
        contact_phone: t.contact_phone || "-",
        profile: t.profile || "",
        photo: t.photo || null,
        user: t.user ?? null,
        user_id: t.user_id ?? null,
        user_username: t.user_username ?? null,
      };
    });
  }, [rawTeachers, subjectLabelById]);

  const designationOptions = useMemo(() => {
    const set = new Set(teachers.map((t) => (t.designation ? t.designation : "Teacher")));
    return Array.from(set)
      .map((d) => ({ value: d, label: d }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    let data = [...teachers];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (t) =>
          (t.full_name || "").toLowerCase().includes(q) ||
          (t.subject_label || "").toLowerCase().includes(q) ||
          (t.contact_email || "").toLowerCase().includes(q) ||
          (t.designation || "").toLowerCase().includes(q) ||
          (t.contact_phone || "").toLowerCase().includes(q)
      );
    }
    if (designationFilter?.value) {
      data = data.filter((t) => (t.designation || "") === designationFilter.value);
    }
    return data;
  }, [teachers, search, designationFilter]);

  /* --------------------------------- CRUD ---------------------------------- */

  const openCreate = () => {
    setForm(emptyTeacher);
    setCurrentId(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    setForm({
      full_name: row.full_name || "",
      designation: row.designation || "",
      contact_email: row.contact_email || "",
      contact_phone: row.contact_phone || "",
      subject: row.subject_id || "",
      profile: row.profile || "",
      photo: null,
    });
    setCurrentId(row.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Delete this teacher?")) return;
    try {
      await AxiosInstance.delete(`teachers/${row.id}/`);
      toast.success("Deleted");
      await loadTeachers();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name?.trim()) {
      toast.error("Full name is required");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("full_name", form.full_name.trim());
      if (form.designation) fd.append("designation", form.designation);
      if (form.contact_email) fd.append("contact_email", form.contact_email);
      if (form.contact_phone) fd.append("contact_phone", form.contact_phone);
      if (form.profile) fd.append("profile", form.profile);
      if (form.subject) fd.append("subject", String(form.subject)); // send ID
      if (form.photo) fd.append("photo", form.photo);

      if (isEditing) {
        await AxiosInstance.put(`teachers/${currentId}/`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Updated");
      } else {
        await AxiosInstance.post("teachers/", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Created");
      }
      setIsModalOpen(false);
      setForm(emptyTeacher);
      await loadTeachers();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data && typeof e.response.data === "object"
          ? JSON.stringify(e.response.data)
          : "Save failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------ Create Login ----------------------------- */

  const goCreateLogin = (t) => {
    if (isLinked(t)) {
      toast("Already linked to a login.", { icon: "ℹ️" });
      return;
    }
    navigate("/dashboard/users", { state: { teacherId: t.id } });
  };

  /* ---------------------------------- UI ----------------------------------- */

  return (
    <div className="p-4 md:p-6">
      <Toaster position="top-center" />

      {/* Header + filters */}
      <div className="bg-white border rounded-2xl p-3 mb-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <input
              className="border border-slate-300 rounded-lg px-3 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Search name / subject / email / phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="w-56">
              <Select
                isClearable
                placeholder="Filter by designation"
                value={designationFilter}
                onChange={setDesignationFilter}
                options={designationOptions}
                classNamePrefix="rs"
                styles={{
                  control: (base) => ({ ...base, borderRadius: 12, paddingBlock: 2 }),
                  menu: (base) => ({ ...base, borderRadius: 12 }),
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700"
            >
              + Add Teacher
            </button>
            <button
              onClick={async () => {
                setTableBusy(true);
                await loadTeachers();
                setTableBusy(false);
              }}
              className="px-3 py-2 rounded-xl border text-sm hover:bg-slate-50 disabled:opacity-50"
              disabled={tableBusy}
              title="Refresh"
            >
              {tableBusy ? "Refreshing…" : "Refresh"}
            </button>
            <span className="text-sm text-slate-500">Total: {filteredTeachers.length}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white border rounded-2xl shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr className="text-slate-700">
              <th className="px-3 py-2 text-left font-semibold">#</th>
              <th className="px-3 py-2 text-left font-semibold">Photo</th>
              <th className="px-3 py-2 text-left font-semibold">Name</th>
              <th className="px-3 py-2 text-left font-semibold">Designation</th>
              <th className="px-3 py-2 text-left font-semibold">Subject</th>
              <th className="px-3 py-2 text-left font-semibold">Email</th>
              <th className="px-3 py-2 text-left font-semibold">Phone</th>
              <th className="px-3 py-2 text-left font-semibold">Login</th>
              <th className="px-3 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
            {loading ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500" colSpan={9}>
                  Loading…
                </td>
              </tr>
            ) : filteredTeachers.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500" colSpan={9}>
                  No data
                </td>
              </tr>
            ) : (
              filteredTeachers.map((t, i) => (
                <tr key={t.id} className="border-t hover:bg-slate-50/60">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">
                    {t.photo ? (
                      <img
                        src={t.photo}
                        alt={t.full_name}
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-200"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-slate-200 grid place-items-center text-xs font-semibold text-slate-700">
                        {t.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium">{t.full_name}</td>
                  <td className="px-3 py-2">{t.designation || "-"}</td>
                  <td className="px-3 py-2">{t.subject_label || "-"}</td>
                  <td className="px-3 py-2">{t.contact_email || "-"}</td>
                  <td className="px-3 py-2">{t.contact_phone || "-"}</td>
                  <td className="px-3 py-2">
                    {isLinked(t) ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        linked
                      </span>
                    ) : (
                      <button
                        onClick={() => goCreateLogin(t)}
                        className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Create Login
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="px-3 py-1 rounded bg-slate-600 text-white hover:bg-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal (scrollable content) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] flex flex-col border">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="px-6 pt-6 pb-3 border-b">
              <h3 className="text-lg font-semibold">
                {isEditing ? "Edit Teacher" : "Add Teacher"}
              </h3>
            </div>

            {/* Scrollable form body */}
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Full name <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="w-full border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                    placeholder="Full name"
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Designation</label>
                  <input
                    className="w-full border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                    placeholder="e.g., Lecturer"
                    value={form.designation}
                    onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Subject
                  </label>

                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-500">
                      {showSubjectsByClass
                        ? "Showing subjects with class labels"
                        : "Showing unique subject names"}
                    </span>
                    <label className="inline-flex items-center gap-2 text-[12px]">
                      <input
                        type="checkbox"
                        checked={showSubjectsByClass}
                        onChange={(e) => setShowSubjectsByClass(e.target.checked)}
                      />
                      Show by class
                    </label>
                  </div>

                  <Select
                    classNamePrefix="rs"
                    placeholder="Select subject"
                    value={
                      subjectOptions.find((o) => String(o.value) === String(form.subject)) || null
                    }
                    onChange={(opt) => setForm((f) => ({ ...f, subject: opt ? opt.value : "" }))}
                    options={subjectOptions}
                    isClearable
                    styles={{
                      control: (base) => ({ ...base, borderRadius: 12, paddingBlock: 2 }),
                      menu: (base) => ({ ...base, borderRadius: 12 }),
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                    placeholder="Email"
                    value={form.contact_email}
                    onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                  <input
                    className="w-full border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                    placeholder="Phone"
                    value={form.contact_phone}
                    onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full border border-slate-300 p-2 rounded-lg"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, photo: e.target.files?.[0] || null }))
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Profile</label>
                  <textarea
                    rows={4}
                    className="w-full border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                    placeholder="Short bio / profile"
                    value={form.profile}
                    onChange={(e) => setForm((f) => ({ ...f, profile: e.target.value }))}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : isEditing ? "Update" : "Save"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
