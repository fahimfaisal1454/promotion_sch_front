import { useEffect, useMemo, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import Select from "react-select";
import axiosInstance from "../../../components/AxiosInstance";

export default function StudentInfo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState(null);

  // master data from /api/class-names/ (includes sections per class)
  const [classes, setClasses] = useState([]); // [{id,name,sections:[{id,name}]}]
  const [classToSections, setClassToSections] = useState({}); // { [classId]: [{id,name}] }

  // student form
  const [formData, setFormData] = useState({
    full_name: "",
    roll_number: "",
    class_name: null,
    section: null,
    date_of_birth: "",
    address: "",
    guardian_name: "",
    guardian_phone: "",
    contact_email: "",
    contact_phone: "",
    photo: null,
    user: null, // user id if linked (comes from backend)
  });

  // user form (create/update login)
  const [createLogin, setCreateLogin] = useState(false);
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "", // optional on update
    is_active: true,
    must_change_password: true,
  });

  const [pagination, setPagination] = useState({ currentPage: 1, itemsPerPage: 10 });
  const [preview, setPreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const classOptions = useMemo(
    () => classes.map((c) => ({ value: c.id, label: c.name })),
    [classes]
  );
  const sectionOptionsForForm = useMemo(() => {
    if (!formData.class_name) return [];
    const secs = classToSections[Number(formData.class_name)] || [];
    return secs.map((s) => ({ value: s.id, label: s.name }));
  }, [formData.class_name, classToSections]);
  const classMap = useMemo(() => {
    const m = {};
    classes.forEach((c) => (m[c.id] = c.name));
    return m;
  }, [classes]);
  const sectionNameById = useMemo(() => {
    const m = {};
    Object.values(classToSections).forEach((arr) => arr.forEach((s) => (m[s.id] = s.name)));
    return m;
  }, [classToSections]);

  // initial fetch
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const [studentsRes, classNamesRes] = await Promise.all([
          axiosInstance.get("students/"),
          axiosInstance.get("class-names/"),
        ]);

        const cls = Array.isArray(classNamesRes.data) ? classNamesRes.data : [];
        const map = {};
        cls.forEach((c) => {
          map[c.id] = Array.isArray(c.sections) ? c.sections : [];
        });

        setClasses(cls);
        setClassToSections(map);
        setStudents(studentsRes.data || []);
        setFilteredStudents(studentsRes.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // filters (search + class)
  useEffect(() => {
    let out = Array.isArray(students) ? [...students] : [];
    if (searchTerm) {
      const needle = searchTerm.toLowerCase();
      out = out.filter((s) => (s.full_name || "").toLowerCase().includes(needle));
    }
    if (selectedClassFilter != null) {
      out = out.filter((s) => Number(s.class_name) === Number(selectedClassFilter));
    }
    setFilteredStudents(out);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  }, [students, searchTerm, selectedClassFilter]);

  // helpers
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target || {};
    if (type === "file") {
      const file = files?.[0];
      if (file && file.size > 2 * 1024 * 1024) {
        toast.error("Photo must be 2MB or smaller.");
        return;
      }
      setFormData((f) => ({ ...f, photo: file || null }));
      setPreview(file ? URL.createObjectURL(file) : null);
      return;
    }
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleUserChange = (field, value) => {
    setUserForm((f) => ({ ...f, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      roll_number: "",
      class_name: null,
      section: null,
      date_of_birth: "",
      address: "",
      guardian_name: "",
      guardian_phone: "",
      contact_email: "",
      contact_phone: "",
      photo: null,
      user: null,
    });
    setCreateLogin(false);
    setUserForm({
      username: "",
      email: "",
      phone: "",
      password: "",
      is_active: true,
      must_change_password: true,
    });
    setPreview(null);
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentStudentId(null);
  };

  const loadUserIfLinked = async (userId) => {
    try {
      if (!userId) return;
      const res = await axiosInstance.get(`admin/users/${userId}/`);
      const u = res?.data || {};
      setUserForm((f) => ({
        ...f,
        username: u.username || "",
        email: u.email || "",
        phone: u.phone || "",
        password: "",
        is_active: u.is_active ?? true,
        must_change_password: u.must_change_password ?? true,
      }));
    } catch (err) {
      console.warn("Could not load linked user", err);
    }
  };

  const handleEdit = async (s) => {
    setFormData({
      full_name: s.full_name || "",
      roll_number: s.roll_number || "",
      class_name: s.class_name != null ? Number(s.class_name) : null,
      section: s.section != null ? Number(s.section) : null,
      date_of_birth: s.date_of_birth || "",
      address: s.address || "",
      guardian_name: s.guardian_name || "",
      guardian_phone: s.guardian_phone || "",
      contact_email: s.contact_email || "",
      contact_phone: s.contact_phone || "",
      photo: null,
      user: s.user || null,
    });
    setCurrentStudentId(s.id);
    setIsEditing(true);
    setIsModalOpen(true);
    setPreview(s.photo || null);

    // if user is linked, prefill user form & show login panel
    if (s.user) {
      setCreateLogin(true);
      await loadUserIfLinked(s.user);
    } else {
      setCreateLogin(false);
      setUserForm({
        username: (s.full_name || "").toLowerCase().replace(/\s+/g, ""),
        email: s.contact_email || "",
        phone: s.contact_phone || "",
        password: "",
        is_active: true,
        must_change_password: true,
      });
    }
  };

  const afterSaveRefresh = async () => {
    const refreshed = await axiosInstance.get("students/");
    setStudents(refreshed.data || []);
    setFilteredStudents(refreshed.data || []);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await axiosInstance.delete(`students/${id}/`);
      toast.success("Student deleted.");
      await afterSaveRefresh();
    } catch {
      toast.error("Delete failed.");
    }
  };

  // main submit: create/update student, then (optionally) create/update user + link
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.full_name || !formData.roll_number || formData.class_name == null) {
      toast.error("Please fill Name, Roll Number and Class.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 1) build student payload
      const fd = new FormData();
      fd.append("full_name", formData.full_name);
      fd.append("roll_number", String(formData.roll_number));
      fd.append("class_name", String(Number(formData.class_name)));
      if (formData.section != null) fd.append("section", String(Number(formData.section)));
      if (formData.date_of_birth) fd.append("date_of_birth", formData.date_of_birth);
      if (formData.address) fd.append("address", formData.address);
      if (formData.guardian_name) fd.append("guardian_name", formData.guardian_name);
      if (formData.guardian_phone) fd.append("guardian_phone", formData.guardian_phone);
      if (formData.contact_email) fd.append("contact_email", formData.contact_email);
      if (formData.contact_phone) fd.append("contact_phone", formData.contact_phone);
      if (formData.photo) fd.append("photo", formData.photo);

      // 2) create/update student
      let savedStudentId = currentStudentId;
      let savedUserId = formData.user;

      if (isEditing) {
        await axiosInstance.put(`students/${currentStudentId}/`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const res = await axiosInstance.post("students/", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        savedStudentId = res?.data?.id;
        savedUserId = res?.data?.user || null;
      }

      // 3) create/update user (if requested)
      if (createLogin) {
        if (savedUserId) {
          // update existing user
          const patchPayload = {
            username: userForm.username,
            email: userForm.email,
            phone: userForm.phone,
            is_active: userForm.is_active,
            must_change_password: userForm.must_change_password,
          };
          // allow password change if provided
          if (userForm.password) patchPayload.password = userForm.password;

          await axiosInstance.patch(`admin/users/${savedUserId}/`, patchPayload);
          toast.success("User updated & linked.");
        } else {
          // create new user and link to this student
          const createPayload = {
            username: userForm.username,
            email: userForm.email,
            phone: userForm.phone,
            role: "Student",
            is_active: userForm.is_active,
            must_change_password: userForm.must_change_password,
          };
          if (userForm.password) createPayload.password = userForm.password;

          const ures = await axiosInstance.post("admin/users/", createPayload);
          const newUserId = ures?.data?.id;
          const tempPw = ures?.data?.temp_password;

          // link user -> student
          await axiosInstance.post(`students/${savedStudentId}/link-user/`, { user_id: newUserId }); // Student link-user
          toast.success(
            `Student user created & linked.${tempPw ? " Temp password: " + tempPw : ""}`
          );
        }
      }

      await afterSaveRefresh();
      resetForm();
    } catch (err) {
      console.error(err);
      const detail =
        err?.response?.data?.detail ||
        (typeof err?.response?.data === "object" ? JSON.stringify(err.response.data) : "Request failed");
      toast.error(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  // pagination
  const paginatedStudents = filteredStudents.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );
  const totalPages = Math.ceil(filteredStudents.length / pagination.itemsPerPage);
  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setPagination((p) => ({ ...p, currentPage: page }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="p-4 md:p-6">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Students</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Add Student
        </button>
      </div>

      {/* Quick filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search by Name
          </label>
          <input
            className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
            placeholder="Type a name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Class
          </label>
          <Select
            options={classOptions}
            isClearable
            placeholder="All classes"
            value={classOptions.find((o) => Number(o.value) === Number(selectedClassFilter)) || null}
            onChange={(opt) => setSelectedClassFilter(opt ? Number(opt.value) : null)}
            classNamePrefix="rs"
            styles={{
              control: (base) => ({ ...base, borderRadius: 12, paddingBlock: 2 }),
              menu: (base) => ({ ...base, borderRadius: 12 }),
            }}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-600">Loading…</div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow border">
          <h3 className="text-lg font-semibold">No students found</h3>
          <p className="text-sm text-gray-500">Click “Add Student” to create one.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 sticky top-0 z-10">
                <tr className="text-slate-700">
                  <th className="py-3 px-4 text-left font-semibold">#</th>
                  <th className="py-3 px-4 text-left font-semibold">Name</th>
                  <th className="py-3 px-4 text-left font-semibold">Roll</th>
                  <th className="py-3 px-4 text-left font-semibold">Class</th>
                  <th className="py-3 px-4 text-left font-semibold">Section</th>
                  <th className="py-3 px-4 text-left font-semibold">Login</th>
                  <th className="py-3 px-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
                {paginatedStudents.map((s, i) => (
                  <tr key={s.id} className="border-t last:border-b-0">
                    <td className="py-3 px-4">
                      {(pagination.currentPage - 1) * pagination.itemsPerPage + i + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {s.photo ? (
                          <img
                            src={s.photo}
                            alt={s.full_name}
                            className="h-9 w-9 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-slate-200 grid place-items-center text-xs text-slate-600">
                            {String(s.full_name || "?")
                              .split(" ")
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{s.roll_number ?? "-"}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium">
                        {s.class_name_label || classMap[s.class_name] || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium">
                        {s.section_label || sectionNameById[s.section] || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {s.user ? (
                        <span className="inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium text-green-700 border-green-200 bg-green-50">
                          Linked
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEdit(s)}
                          className="text-xs px-2 py-1 rounded-lg border hover:bg-slate-50"
                          title="Create & link login"
                        >
                          Create login
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(s)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1.5 border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`px-3 py-1.5 border rounded-lg ${
                    pagination.currentPage === p ? "bg-blue-600 text-white" : ""
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === totalPages}
                className="px-3 py-1.5 border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative">
            <button
              onClick={resetForm}
              className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="p-6">
              <h2 className="text-xl font-bold text-center mb-4">
                {isEditing ? "Edit Student" : "Add Student"}
              </h2>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Student fields */}
                <input
                  type="text"
                  name="full_name"
                  placeholder="Full Name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg md:col-span-2"
                />

                <input
                  type="text"
                  name="roll_number"
                  placeholder="Roll Number"
                  value={formData.roll_number}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                />

                <Select
                  options={classOptions}
                  value={classOptions.find((o) => Number(o.value) === Number(formData.class_name)) || null}
                  onChange={(opt) =>
                    setFormData((f) => ({
                      ...f,
                      class_name: opt ? Number(opt.value) : null,
                      section: null, // reset section if class changes
                    }))
                  }
                  placeholder="Select Class"
                  className="md:col-span-1"
                  classNamePrefix="rs"
                  styles={{
                    control: (base) => ({ ...base, borderRadius: 12, paddingBlock: 2 }),
                    menu: (base) => ({ ...base, borderRadius: 12 }),
                  }}
                />

                <Select
                  options={sectionOptionsForForm}
                  value={
                    sectionOptionsForForm.find((o) => Number(o.value) === Number(formData.section)) || null
                  }
                  onChange={(opt) =>
                    setFormData((f) => ({
                      ...f,
                      section: opt ? Number(opt.value) : null,
                    }))
                  }
                  placeholder="Select Section"
                  isClearable
                  isDisabled={!formData.class_name}
                  className="md:col-span-1"
                  classNamePrefix="rs"
                  styles={{
                    control: (base) => ({ ...base, borderRadius: 12, paddingBlock: 2 }),
                    menu: (base) => ({ ...base, borderRadius: 12 }),
                  }}
                />

                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                />

                <input
                  type="text"
                  name="guardian_name"
                  placeholder="Guardian Name"
                  value={formData.guardian_name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                />

                <input
                  type="tel"
                  name="guardian_phone"
                  placeholder="Guardian Phone"
                  value={formData.guardian_phone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                />

                <input
                  type="email"
                  name="contact_email"
                  placeholder="Email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                />

                <input
                  type="tel"
                  name="contact_phone"
                  placeholder="Phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                />

                <textarea
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg md:col-span-2"
                />

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                  />
                  {preview && (
                    <div className="flex items-center gap-3">
                      <img src={preview} alt="Preview" className="h-16 w-16 rounded-lg object-cover border" />
                      <button
                        type="button"
                        onClick={() => {
                          setPreview(null);
                          setFormData((f) => ({ ...f, photo: null }));
                        }}
                        className="px-3 py-1.5 rounded-lg border hover:bg-slate-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="md:col-span-2 h-px bg-slate-200 my-1" />

                {/* Login panel toggle */}
                <label className="md:col-span-2 inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={createLogin}
                    onChange={(e) => setCreateLogin(e.target.checked)}
                  />
                  <span className="text-sm font-medium">Create / update login for this student</span>
                </label>

                {/* Login fields */}
                {createLogin && (
                  <>
                    <input
                      placeholder="Username"
                      value={userForm.username}
                      onChange={(e) => handleUserChange("username", e.target.value)}
                      className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={userForm.email}
                      onChange={(e) => handleUserChange("email", e.target.value)}
                      className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                    />
                    <input
                      placeholder="Phone"
                      value={userForm.phone}
                      onChange={(e) => handleUserChange("phone", e.target.value)}
                      className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                    />
                    <input
                      type="password"
                      placeholder={formData.user ? "New Password (optional)" : "Password (optional)"}
                      value={userForm.password}
                      onChange={(e) => handleUserChange("password", e.target.value)}
                      className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 rounded-lg"
                    />
                    <div className="flex items-center gap-4 md:col-span-2">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={userForm.is_active}
                          onChange={(e) => handleUserChange("is_active", e.target.checked)}
                        />
                        <span className="text-sm">Active</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={userForm.must_change_password}
                          onChange={(e) => handleUserChange("must_change_password", e.target.checked)}
                        />
                        <span className="text-sm">Must change password on first login</span>
                      </label>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                >
                  {isSubmitting ? "Processing..." : isEditing ? "Update" : "Save"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
