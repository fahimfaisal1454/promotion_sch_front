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
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);

  // filters
  const [search, setSearch] = useState("");
  const [designationFilter, setDesignationFilter] = useState(null);

  // form
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

  // ---------- helpers ----------
  const isLinked = (t) =>
    Boolean(t?.user || t?.user_id || t?.user_username || t?.userId);

  const normalizeTeacher = (t) => ({
    id: t.id,
    full_name: t.full_name || "-",
    designation: (t.designation || "").toString().toLowerCase(),
    subject: t.subject || "-",
    contact_email: t.contact_email || "-",
    contact_phone: t.contact_phone || "-",
    profile: t.profile || "",
    photo: t.photo || null,
    // possible user fields coming from serializer
    user: t.user ?? null,
    user_id: t.user_id ?? null,
    user_username: t.user_username ?? null,
  });

  const designationOptions = useMemo(() => {
    const set = new Set(
      teachers.map((t) =>
        t.designation ? t.designation.toLowerCase() : "teacher"
      )
    );
    return Array.from(set).map((d) => ({ value: d, label: d }));
  }, [teachers]);

  // ---------- load ----------
  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await AxiosInstance.get("teachers/");
      const items = Array.isArray(res.data) ? res.data.map(normalizeTeacher) : [];
      setTeachers(items);
      setFilteredTeachers(items);
    } catch (e) {
      console.error(e);
      toast.error("শিক্ষকের তালিকা লোড করা যায়নি!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  // ---------- filter ----------
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
      data = data.filter(
        (t) => (t.designation || "").toLowerCase() === d
      );
    }

    setFilteredTeachers(data);
  }, [search, designationFilter, teachers]);

  // ---------- CRUD ----------
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
      subject: row.subject === "-" ? "" : row.subject || "",
      profile: row.profile || "",
      photo: null,
    });
    setCurrentTeacherId(row.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm("ডিলিট করতে চান?")) return;
    try {
      await AxiosInstance.delete(`teachers/${row.id}/`);
      toast.success("ডিলিট হয়েছে");
      await loadTeachers();
    } catch (e) {
      console.error(e);
      toast.error("ডিলিট ব্যর্থ");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (v !== null && v !== undefined) payload.append(k, v);
      });

      if (isEditing) {
        await AxiosInstance.put(`teachers/${currentTeacherId}/`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("আপডেট সম্পন্ন");
      } else {
        await AxiosInstance.post("teachers/", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("তৈরি হয়েছে");
      }

      setIsModalOpen(false);
      setFormData(blankForm);
      await loadTeachers();
    } catch (e) {
      console.error(e);
      toast.error("সংরক্ষণ ব্যর্থ");
    }
  };

  // ---------- jump to Users to create login ----------
  const goCreateLogin = (t) => {
    // Only allow if not linked yet
    if (isLinked(t)) {
      return toast("ইতিমধ্যে ইউজার লিংক করা আছে!", { icon: "ℹ️" });
    }
    navigate("/dashboard/users", { state: { teacherId: t.id } });
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
            + Add Teacher
          </button>
          <span className="text-sm text-gray-600">
            Total: {filteredTeachers.length}
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
              <th className="px-3 py-2 text-left">লগইন</th>
              <th className="px-3 py-2 text-left">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4" colSpan={9}>Loading…</td>
              </tr>
            ) : filteredTeachers.length === 0 ? (
              <tr>
                <td className="px-3 py-4" colSpan={9}>No data</td>
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
                  <td className="px-3 py-2">{t.full_name}</td>
                  <td className="px-3 py-2">{t.designation || "-"}</td>
                  <td className="px-3 py-2">{t.subject || "-"}</td>
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
                        এডিট
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
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

      {/* modal */}
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
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, full_name: e.target.value }))
                  }
                  required
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Designation (e.g., teacher)"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, designation: e.target.value }))
                  }
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Subject (e.g., maths)"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, subject: e.target.value }))
                  }
                />
                <input
                  className="border rounded px-3 py-2"
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
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Phone"
                  value={formData.contact_phone}
                  onChange={(e) =>
                    setFormData((s) => ({
                      ...s,
                      contact_phone: e.target.value,
                    }))
                  }
                />
                <input
                  className="border rounded px-3 py-2"
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
              <textarea
                className="border rounded px-3 py-2 w-full"
                placeholder="Profile"
                rows={4}
                value={formData.profile}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, profile: e.target.value }))
                }
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
