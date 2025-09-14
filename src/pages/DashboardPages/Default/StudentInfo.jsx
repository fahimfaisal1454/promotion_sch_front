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

  // master data
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  // UI / form
  const [formData, setFormData] = useState({
    full_name: "",
    roll_number: "",
    class_name: null, // PK (number)
    section: null,    // PK (number) or null
    date_of_birth: "",
    address: "",
    guardian_name: "",
    guardian_phone: "",
    contact_email: "",
    contact_phone: "",
    photo: null,
  });

  const [pagination, setPagination] = useState({ currentPage: 1, itemsPerPage: 10 });
  const [preview, setPreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState(null); // number | null
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // option builders / maps
  const classOptions = useMemo(
    () => classes.map((c) => ({ value: c.id, label: c.name })),
    [classes]
  );
  const sectionOptionsAll = useMemo(
    () =>
      sections.map((s) => ({
        value: s.id,
        label: s.name,
        classId: s.class_name, // backend should return class_name id here
      })),
    [sections]
  );
  const classMap = useMemo(() => {
    const m = {};
    classes.forEach((c) => (m[c.id] = c.name));
    return m;
  }, [classes]);
  const sectionMap = useMemo(() => {
    const m = {};
    sections.forEach((s) => (m[s.id] = s.name));
    return m;
  }, [sections]);

  // sections filtered by selected class in the form
  const sectionOptionsForForm = useMemo(() => {
    if (!formData.class_name) return [];
    return sectionOptionsAll.filter((s) => Number(s.classId) === Number(formData.class_name));
  }, [formData.class_name, sectionOptionsAll]);

  // initial fetch
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const [studentsRes, classesRes, sectionsRes] = await Promise.all([
          axiosInstance.get("students/"),
          axiosInstance.get("class-names/"),
          axiosInstance.get("sections/"),
        ]);
        setStudents(studentsRes.data || []);
        setFilteredStudents(studentsRes.data || []);
        setClasses(classesRes.data || []);
        setSections(sectionsRes.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // table filters
  useEffect(() => {
    let out = [...students];
    if (searchTerm) {
      out = out.filter((s) =>
        (s.full_name || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedClassFilter != null) {
      out = out.filter((s) => Number(s.class_name) === Number(selectedClassFilter));
    }
    setFilteredStudents(out);
  }, [students, searchTerm, selectedClassFilter]);

  // handlers
  const handleChange = (e) => {
    const { name, value, type, files } = e.target || {};
    if (type === "file") {
      const file = files?.[0];
      if (file && file.size > 2 * 1024 * 1024) {
        toast.error("File must be 2MB or smaller.");
        return;
      }
      setFormData((f) => ({ ...f, photo: file || null }));
      setPreview(file ? URL.createObjectURL(file) : null);
      return;
    }
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // required minimal fields
    if (!formData.full_name || !formData.roll_number || formData.class_name == null) {
      toast.error("Please fill Name, Roll Number and Class.");
      setIsSubmitting(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("full_name", formData.full_name);
      fd.append("roll_number", String(formData.roll_number));
      fd.append("class_name", String(Number(formData.class_name))); // PK as number

      if (formData.section != null) {
        fd.append("section", String(Number(formData.section))); // PK as number
      }
      if (formData.date_of_birth) fd.append("date_of_birth", formData.date_of_birth);
      if (formData.address) fd.append("address", formData.address);
      if (formData.guardian_name) fd.append("guardian_name", formData.guardian_name);
      if (formData.guardian_phone) fd.append("guardian_phone", formData.guardian_phone);
      if (formData.contact_email) fd.append("contact_email", formData.contact_email);
      if (formData.contact_phone) fd.append("contact_phone", formData.contact_phone);
      if (formData.photo) fd.append("photo", formData.photo);

      if (isEditing) {
        await axiosInstance.put(`students/${currentStudentId}/`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Student updated.");
      } else {
        await axiosInstance.post("students/", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Student created.");
      }

      const refreshed = await axiosInstance.get("students/");
      setStudents(refreshed.data || []);
      setFilteredStudents(refreshed.data || []);
      resetForm();
    } catch (err) {
      console.error(err);
      const detail =
        err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data || "Request failed");
      toast.error(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (s) => {
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
    });
    setCurrentStudentId(s.id);
    setIsEditing(true);
    setIsModalOpen(true);
    setPreview(s.photo || null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await axiosInstance.delete(`students/${id}/`);
      toast.success("Student deleted.");
      const refreshed = await axiosInstance.get("students/");
      setStudents(refreshed.data || []);
      setFilteredStudents(refreshed.data || []);
    } catch {
      toast.error("Delete failed.");
    }
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
    });
    setPreview(null);
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentStudentId(null);
  };

  // pagination helpers
  const paginatedStudents = filteredStudents.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );
  const totalPages = Math.ceil(filteredStudents.length / pagination.itemsPerPage);
  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setPagination((p) => ({ ...p, currentPage: page }));
    }
  };

  return (
    <div className="p-4">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Students</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Add Student
        </button>
      </div>

      {/* Quick filters */}
      <div className="mb-4 max-w-md grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search by Name
          </label>
          <input
            className="w-full border p-2 rounded"
            placeholder="Type a name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Class
          </label>
          <Select
            options={classOptions}
            isClearable
            placeholder="All classes"
            value={classOptions.find((o) => Number(o.value) === Number(selectedClassFilter))}
            onChange={(opt) => setSelectedClassFilter(opt ? Number(opt.value) : null)}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-10">Loading…</div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium">No students found</h3>
          <p className="text-sm text-gray-500">Click “Add Student” to create one.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-blue-500 text-sm font-semibold text-white text-center">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedStudents.map((s, i) => (
                  <tr key={s.id}>
                    <td className="text-center">
                      {(pagination.currentPage - 1) * pagination.itemsPerPage + i + 1}
                    </td>
                    <td className="text-center">{s.full_name}</td>
                    <td className="text-center">{s.roll_number}</td>
                    <td className="text-center">{s.class_name_label || classMap[s.class_name] || "-"}</td>
                    <td className="text-center">{s.section_label || sectionMap[s.section] || "-"}</td>
                    <td className="text-center space-x-2">
                      <button
                        onClick={() => handleEdit(s)}
                        className="px-3 py-1 bg-blue-600 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`px-3 py-1 border rounded ${
                    pagination.currentPage === p ? "bg-blue-600 text-white" : ""
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
            <button
              onClick={resetForm}
              className="absolute top-3 right-3 p-1 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <div className="p-6">
              <h2 className="text-md font-semibold text-center mb-4 text-blue-600">
                {isEditing ? "Edit Student" : "Student Form"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-2">
                <input
                  type="text"
                  name="full_name"
                  placeholder="Full Name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full border p-2 rounded"
                />

                <input
                  type="text"
                  name="roll_number"
                  placeholder="Roll Number"
                  value={formData.roll_number}
                  onChange={handleChange}
                  required
                  className="w-full border p-2 rounded"
                />

                {/* Class */}
                <Select
                  options={classOptions}
                  value={classOptions.find((o) => Number(o.value) === Number(formData.class_name))}
                  onChange={(opt) =>
                    setFormData((f) => ({
                      ...f,
                      class_name: opt ? Number(opt.value) : null,
                      section: null, // reset section if class changes
                    }))
                  }
                  placeholder="Select class"
                />

                {/* Section (filtered by class) */}
                <Select
                  options={sectionOptionsForForm}
                  value={sectionOptionsForForm.find((o) => Number(o.value) === Number(formData.section)) || null}
                  onChange={(opt) =>
                    setFormData((f) => ({
                      ...f,
                      section: opt ? Number(opt.value) : null,
                    }))
                  }
                  placeholder="Select section"
                  isClearable
                  isDisabled={!formData.class_name}
                />

                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />

                <input
                  type="text"
                  name="guardian_name"
                  placeholder="Guardian Name"
                  value={formData.guardian_name}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />

                <input
                  type="tel"
                  name="guardian_phone"
                  placeholder="Guardian Phone"
                  value={formData.guardian_phone}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />

                <input
                  type="email"
                  name="contact_email"
                  placeholder="Email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />

                <input
                  type="tel"
                  name="contact_phone"
                  placeholder="Phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />

                <textarea
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />

                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-2 rounded"
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
