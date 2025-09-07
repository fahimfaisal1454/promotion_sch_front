// src/pages/DashboardPages/academics/TeacherInfo.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { toast, Toaster } from "react-hot-toast";
import AxiosInstance from "../../../components/AxiosInstance";

export default function TeacherInfo() {
  const navigate = useNavigate();

  // UI state
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState(null);

  // data
  const [rawTeachers, setRawTeachers] = useState([]); // keep raw; we normalize after subjects arrive
  const [subjects, setSubjects] = useState([]);

  // filters
  const [search, setSearch] = useState("");
  const [designationFilter, setDesignationFilter] = useState(null);

  // form
  const blankForm = {
    full_name: "",
    designation: "",
    contact_email: "",
    contact_phone: "",
    subject: "", // will hold subject ID
    profile: "",
    photo: null,
  };
  const [formData, setFormData] = useState(blankForm);

  /* -------------------------------- Helpers -------------------------------- */

  const isLinked = (t) =>
    Boolean(t?.user || t?.user_id || t?.user_username || t?.userId);

  const subjectById = useMemo(() => {
    const m = {};
    for (const s of subjects) m[String(s.id)] = s.name || s.title || `Subject #${s.id}`;
    return m;
  }, [subjects]);

  const normalizeTeacher = (t) => {
    const subjId = t.subject?.id ?? t.subject ?? null;
    const subjLabel =
      t.subject_name ||
      t.subject?.name ||
      (subjId != null ? subjectById[String(subjId)] : null) ||
      (typeof t.subject === "string" ? t.subject : "-");

    return {
      id: t.id,
      full_name: t.full_name || "-",
      designation: (t.designation || "").toString(),
      subject_id: subjId,
      subject_label: subjLabel,
      contact_email: t.contact_email || "-",
      contact_phone: t.contact_phone || "-",
      profile: t.profile || "",
      photo: t.photo || null,
      // possible user fields coming from serializer
      user: t.user ?? null,
      user_id: t.user_id ?? null,
      user_username: t.user_username ?? null,
    };
  };

  const teachers = useMemo(
    () => rawTeachers.map(normalizeTeacher),
    [rawTeachers, subjectById] // re-normalize when subjects arrive
  );

  const designationOptions = useMemo(() => {
    const set = new Set(
      teachers.map((t) => (t.designation ? t.designation : "Teacher"))
    );
    return Array.from(set).map((d) => ({ value: d, label: d }));
  }, [teachers]);

  const subjectOptions = useMemo(
    () =>
      (subjects || []).map((s) => ({
        value: s.id,
        label: s.name || s.title || `Subject #${s.id}`,
      })),
    [subjects]
  );

  /* --------------------------------- Load ---------------------------------- */

  const loadSubjects = async () => {
    try {
      const res = await AxiosInstance.get("subjects/");
      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setSubjects([]);
      toast.error("Failed to load subjects");
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
    // load subjects first so initial normalization has names
    (async () => {
      await loadSubjects();
      await loadTeachers();
    })();
  }, []);

  /* -------------------------------- Filter --------------------------------- */

  const filteredTeachers = useMemo(() => {
    let data = [...teachers];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (t) =>
          (t.full_name || "").toLowerCase().includes(q) ||
          (t.subject_label || "").toLowerCase().includes(q) ||
          (t.contact_email || "").toLowerCase().includes(q) ||
          (t.contact_phone || "").toLowerCase().includes(q)
      );
    }

    if (designationFilter?.value) {
      const d = designationFilter.value;
      data = data.filter((t) => (t.designation || "") === d);
    }

    return data;
  }, [teachers, search, designationFilter]);

  /* --------------------------------- CRUD ---------------------------------- */

  const openCreate = () => {
    setFormData(blankForm);
    setCurrentTeacherId(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    setFormData({
      full_name: row.full_name || "",
      designation: row.designation || "",
      contact_email: row.contact_email || "",
      contact_phone: row.contact_phone || "",
      subject: row.subject_id || "", // subject id
      profile: row.profile || "",
      photo: null, // set via file input
    });
    setCurrentTeacherId(row.id);
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
    try {
      const payload = new FormData();
      // append scalar fields
      payload.append("full_name", formData.full_name);
      if (formData.designation) payload.append("designation", formData.designation);
      if (formData.contact_email) payload.append("contact_email", formData.contact_email);
      if (formData.contact_phone) payload.append("contact_phone", formData.contact_phone);
      if (formData.profile) payload.append("profile", formData.profile);
      if (formData.subject) payload.append("subject", String(formData.subject)); // send id
      if (formData.photo) payload.append("photo", formData.photo);

      if (isEditing) {
        await AxiosInstance.put(`teachers/${currentTeacherId}/`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Updated");
      } else {
        await AxiosInstance.post("teachers/", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Created");
      }

      setIsModalOpen(false);
      setFormData(blankForm);
      await loadTeachers();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data
        ? typeof e.response.data === "string"
          ? e.response.data
          : "Save failed"
        : "Save failed";
      toast.error(msg);
    }
  };

  /* ----------------------------- Create Login ------------------------------ */

  const goCreateLogin = (t) => {
    if (isLinked(t)) {
      return toast("Already linked to a login.", { icon: "ℹ️" });
    }
    navigate("/dashboard/users", { state: { teacherId: t.id } });
  };

  /* --------------------------------- UI ------------------------------------ */

  return (
    <div className="p-4">
      <Toaster position="top-center" />

      {/* header / actions */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name / subject / email / phone"
            className="border rounded-lg px-3 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="w-56">
            <Select
              isClearable
              placeholder="Filter by designation"
              value={designationFilter}
              onChange={setDesignationFilter}
              options={designationOptions}
              classNamePrefix="select"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm"
          >
            + Add Teacher
          </button>
          <span className="text-sm text-gray-600">
            Total: {filteredTeachers.length}
          </span>
        </div>
      </div>

      {/* table */}
      <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Photo</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Designation</th>
              <th className="px-3 py-2 text-left">Subject</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Login</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-6 text-slate-500" colSpan={9}>
                  Loading…
                </td>
              </tr>
            ) : filteredTeachers.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-slate-500" colSpan={9}>
                  No data
                </td>
              </tr>
            ) : (
              filteredTeachers.map((t, i) => (
                <tr key={t.id} className="border-t hover:bg-slate-50/50">
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

                  {/* login cell */}
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

      {/* modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white rounded-2xl p-5 w-[95%] max-w-2xl shadow-xl border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                {isEditing ? "Edit Teacher" : "Add Teacher"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm text-slate-700">Full name *</label>
                  <input
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData((s) => ({ ...s, full_name: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-slate-700">Designation</label>
                  <input
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Lecturer"
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData((s) => ({ ...s, designation: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-slate-700">Subject</label>
                  <Select
                    classNamePrefix="select"
                    placeholder="Select subject"
                    value={
                      subjectOptions.find((o) => String(o.value) === String(formData.subject)) ||
                      null
                    }
                    onChange={(opt) =>
                      setFormData((s) => ({ ...s, subject: opt ? opt.value : "" }))
                    }
                    options={subjectOptions}
                    isClearable
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-slate-700">Email</label>
                  <input
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) =>
                      setFormData((s) => ({
                        ...s,
                        contact_email: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-slate-700">Phone</label>
                  <input
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone"
                    value={formData.contact_phone}
                    onChange={(e) =>
                      setFormData((s) => ({
                        ...s,
                        contact_phone: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-slate-700">Photo</label>
                  <input
                    className="border rounded-lg px-3 py-2 w-full"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData((s) => ({
                        ...s,
                        photo: e.target.files?.[0] || null,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-slate-700">Profile</label>
                <textarea
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Short bio / profile"
                  rows={4}
                  value={formData.profile}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, profile: e.target.value }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
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
