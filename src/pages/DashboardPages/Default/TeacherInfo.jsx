import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { toast, Toaster } from "react-hot-toast";
import AxiosInstance from "../../../components/AxiosInstance";

export default function TeacherInfo() {
  // UI state
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState(null);
  const [currentSource, setCurrentSource] = useState(null); // 'manual' | 'approved'

  // Raw buckets
  const [manualTeachers, setManualTeachers] = useState([]);
  const [approvedStaff, setApprovedStaff] = useState([]);

  // Combined / filtered
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);

  // Filters
  const [search, setSearch] = useState("");
  const [designationFilter, setDesignationFilter] = useState(null);

  // Form
  const blankForm = {
    full_name: "",
    designation: "",
    contact_email: "",
    contact_phone: "",
    subject: "",
    profile: "",
    photo: null,
  };
  const [formData, setFormData] = useState(blankForm);

  // ---------- Helpers ----------
  const isApprovedUser = (u) => {
    const raw = (u?.approved ?? u?.is_approved ?? u?.status ?? "").toString().toLowerCase();
    if (!raw) return true;
    return raw === "true" || raw === "approved" || raw === "active" || raw === "1" || raw === "yes";
  };

  const normalizeApprovedToTeacher = (u) => ({
    id: `appr-${u.id}`,
    source: "approved",
    full_name:
      u.full_name ||
      [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
      u.username ||
      "—",
    designation:
      (u.designation || (u.role ? u.role.toString() : "") || "Teacher")
        .toString()
        .toLowerCase(),
    subject: u.subject || "-",
    contact_email: u.email || "-",
    contact_phone: u.phone || u.mobile || "-",
    profile: u.profile || "",
    photo: u.photo || u.avatar || u.profile_picture || null,
  });

  const normalizeManualTeacher = (t) => ({
    id: `man-${t.id}`,
    source: "manual",
    full_name: t.full_name || "-",
    designation: (t.designation || "").toString().toLowerCase(),
    subject: t.subject || "-",
    contact_email: t.contact_email || "-",
    contact_phone: t.contact_phone || "-",
    profile: t.profile || "",
    photo: t.photo || null,
  });

  const designationOptions = useMemo(() => {
    const set = new Set(
      teachers.map((t) => (t.designation ? t.designation.toLowerCase() : "teacher"))
    );
    return Array.from(set).map((d) => ({ value: d, label: d }));
  }, [teachers]);

  const stripPrefixId = (prefixedId) => {
    if (!prefixedId) return null;
    return prefixedId.replace(/^man-/, "").replace(/^appr-/, "");
  };

  // ---------- Load ----------
  const loadAll = async () => {
    setLoading(true);
    try {
      // 1) Manual teachers
      const manRes = await AxiosInstance.get("teachers/");
      const manual = Array.isArray(manRes.data) ? manRes.data.map(normalizeManualTeacher) : [];

      // 2) Approved staff (teachers only)
      const apprRes = await AxiosInstance.get("approve_staff/");
      const raw = Array.isArray(apprRes.data) ? apprRes.data : [];
      const onlyApprovedTeachers = raw
        .filter((u) => (u?.role || "").toString().toLowerCase() === "teacher")
        .filter((u) => isApprovedUser(u))
        .map(normalizeApprovedToTeacher);

      setManualTeachers(manual);
      setApprovedStaff(onlyApprovedTeachers);

      const merged = [...onlyApprovedTeachers, ...manual].sort((a, b) =>
        a.full_name.localeCompare(b.full_name)
      );
      setTeachers(merged);
      setFilteredTeachers(merged);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load teachers!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Filter ----------
  useEffect(() => {
    let data = [...teachers];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (t) =>
          (t.full_name || "").toLowerCase().includes(q) ||
          (t.subject || "").toLowerCase().includes(q) ||
          (t.contact_email || "").toLowerCase().includes(q) ||
          (t.contact_phone || "").toLowerCase().includes(q)
      );
    }

    if (designationFilter?.value) {
      const d = designationFilter.value.toLowerCase();
      data = data.filter((t) => (t.designation || "").toLowerCase() === d);
    }

    setFilteredTeachers(data);
  }, [search, designationFilter, teachers]);

  // ---------- CRUD ----------
  const openCreate = () => {
    setFormData(blankForm);
    setCurrentTeacherId(null);
    setCurrentSource("manual");
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    // ✅ allow editing for BOTH sources
    setFormData({
      full_name: row.full_name || "",
      designation: row.designation || "",
      contact_email: row.contact_email || "",
      contact_phone: row.contact_phone || "",
      subject: row.subject === "-" ? "" : row.subject || "",
      profile: row.profile || "",
      photo: null,
    });
    setCurrentTeacherId(stripPrefixId(row.id)); // works for both man- and appr-
    setCurrentSource(row.source); // 'manual' | 'approved'
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      if (row.source === "manual") {
        await AxiosInstance.delete(`teachers/${stripPrefixId(row.id)}/`);
      } else {
        await AxiosInstance.delete(`approve_staff/${stripPrefixId(row.id)}/`);
      }
      toast.success("Deleted");
      await loadAll();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (!currentSource) throw new Error("Unknown source");

      if (currentSource === "manual") {
        const payload = new FormData();
        Object.entries(formData).forEach(([k, v]) => {
          if (v !== null && v !== undefined) payload.append(k, v);
        });

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
      } else {
        // approved → PATCH approve_staff/:id/
        // Use FormData so photo works; map to common field names for typical backends
        const fd = new FormData();
        if (formData.full_name) fd.append("username", formData.full_name);
        if (formData.designation) fd.append("role", formData.designation);
        if (formData.contact_email) fd.append("email", formData.contact_email);
        if (formData.contact_phone) fd.append("phone", formData.contact_phone);
        if (formData.subject) fd.append("subject", formData.subject);
        if (formData.profile) fd.append("profile", formData.profile);
        if (formData.photo) fd.append("profile_picture", formData.photo); // common field name

        await AxiosInstance.patch(`approve_staff/${currentTeacherId}/`, fd);
        toast.success("Updated");
      }

      setIsModalOpen(false);
      setFormData(blankForm);
      await loadAll();
    } catch (e) {
      console.error(e);
      toast.error("Save failed");
    }
  };

  return (
    <div className="p-4">
      <Toaster />
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম/বিষয়/ইমেইল/ফোনে খুঁজুন…"
            className="border rounded px-3 py-2 w-72"
          />
          <div className="w-56">
            <Select
              isClearable
              placeholder="পদবি দিয়ে ফিল্টার"
              value={designationFilter}
              onChange={setDesignationFilter}
              options={designationOptions}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            + Add Teacher (Manual)
          </button>
          <span className="text-sm text-gray-600">
            Total: {filteredTeachers.length} &nbsp;|&nbsp; Approved:{" "}
            {approvedStaff.length} &nbsp;|&nbsp; Manual: {manualTeachers.length}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">ছবি</th>
              <th className="px-3 py-2 text-left">নাম</th>
              <th className="px-3 py-2 text-left">পদবি</th>
              <th className="px-3 py-2 text-left">বিষয়</th>
              <th className="px-3 py-2 text-left">ইমেইল</th>
              <th className="px-3 py-2 text-left">মোবাইল</th>
              <th className="px-3 py-2 text-left">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4" colSpan={8}>
                  Loading…
                </td>
              </tr>
            ) : filteredTeachers.length === 0 ? (
              <tr>
                <td className="px-3 py-4" colSpan={8}>
                  No data
                </td>
              </tr>
            ) : (
              filteredTeachers.map((t, i) => (
                <tr key={t.id} className="border-b">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">
                    {t.photo ? (
                      <img
                        src={t.photo}
                        alt={t.full_name}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gray-200 grid place-items-center text-xs">
                        {t.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span>{t.full_name}</span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full ${
                          t.source === "approved"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                        title={t.source === "approved" ? "Approved staff" : "Manually added"}
                      >
                        {t.source}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">{t.designation || "-"}</td>
                  <td className="px-3 py-2">{t.subject || "-"}</td>
                  <td className="px-3 py-2">{t.contact_email || "-"}</td>
                  <td className="px-3 py-2">{t.contact_phone || "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      {/* ✅ enable Edit for BOTH sources */}
                      <button
                        onClick={() => openEdit(t)}
                        className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                        title="Edit"
                      >
                        এডিট
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        title="Delete"
                      >
                        ডিলিট
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white rounded-lg p-4 w-[95%] max-w-2xl">
            <h3 className="text-lg font-semibold mb-3">
              {isEditing ? "Edit Teacher" : "Add Teacher"}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Full name"
                  value={formData.full_name}
                  onChange={(e) => setFormData((s) => ({ ...s, full_name: e.target.value }))}
                  required
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Designation (e.g., teacher)"
                  value={formData.designation}
                  onChange={(e) => setFormData((s) => ({ ...s, designation: e.target.value }))}
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Subject (e.g., maths)"
                  value={formData.subject}
                  onChange={(e) => setFormData((s) => ({ ...s, subject: e.target.value }))}
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData((s) => ({ ...s, contact_email: e.target.value }))}
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData((s) => ({ ...s, contact_phone: e.target.value }))}
                />
                <input
                  className="border rounded px-3 py-2"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData((s) => ({ ...s, photo: e.target.files?.[0] || null }))}
                />
              </div>
              <textarea
                className="border rounded px-3 py-2 w-full"
                placeholder="Profile"
                rows={4}
                value={formData.profile}
                onChange={(e) => setFormData((s) => ({ ...s, profile: e.target.value }))}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded border"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
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
