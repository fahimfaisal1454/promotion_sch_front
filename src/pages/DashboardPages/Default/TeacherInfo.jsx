import { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import Select from "react-select";
import AxiosInstance from "../../../components/AxiosInstance";

export default function TeacherInfo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState(null);
  const [currentSource, setCurrentSource] = useState(null); // 'manual' | 'approved'

  // Data buckets
  const [manualTeachers, setManualTeachers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);

  // Combined + filtered
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);

  // Form (works for both sources)
  const [formData, setFormData] = useState({
    full_name: "",
    designation: "",
    contact_email: "",
    contact_phone: "",
    subject: "",
    profile: "",
    photo: null,
    teacher_intro: "",
  });
  const [preview, setPreview] = useState(null);

  // UI state
  const [pagination, setPagination] = useState({ currentPage: 1, itemsPerPage: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [nameOptions, setNameOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------- Helpers (normalize) --------
  const normalizeManual = (t) => ({
    id: `manual-${t.id}`,
    apiId: t.id,
    src: "manual",
    full_name: t.full_name || "",
    designation: t.designation || "",
    subject: t.subject || "",
    contact_email: t.contact_email || "",
    contact_phone: t.contact_phone || "",
    photo: t.photo || null,
    teacher_intro: t.teacher_intro || "",
    is_approved: t.is_approved ?? true,
  });

  const normalizeApproved = (u) => ({
    id: `approved-${u.id}`,
    apiId: u.id,
    src: "approved",
    full_name: u.username || u.full_name || u.email || `User ${u.id}`,
    designation: u.role === "Teacher" ? "Teacher" : (u.role || "Teacher"),
    subject: "",
    contact_email: u.email || "",
    contact_phone: u.phone || "",
    photo: u.profile_picture || null,
    teacher_intro: "",
    is_approved: !!u.is_approved,
  });

  // -------- Load data --------
  useEffect(() => {
    const fetchBoth = async () => {
      try {
        setIsLoading(true);

        const tRes = await AxiosInstance.get("/teachers/");
        const tList = Array.isArray(tRes.data) ? tRes.data : [];
        const manualNormalized = tList.map(normalizeManual);
        setManualTeachers(manualNormalized);

        const aRes = await AxiosInstance.get("approve_staff/");
        const rawUsers = Array.isArray(aRes.data) ? aRes.data : [];
        const onlyApproved = rawUsers.filter((u) => u.is_approved === true);
        const approvedNormalized = onlyApproved
          .filter((u) => u.role?.toLowerCase?.() === "teacher" || !u.role)
          .map(normalizeApproved);
        setApprovedUsers(approvedNormalized);

        // combine and de-dupe by email if present
        const byEmail = new Map();
        const pushUnique = (arr) => {
          arr.forEach((item) => {
            const key = (item.contact_email || "").toLowerCase();
            if (key && !byEmail.has(key)) byEmail.set(key, item);
            if (!key) byEmail.set(`${item.id}`, item);
          });
        };
        pushUnique(approvedNormalized);
        pushUnique(manualNormalized);

        const combined = Array.from(byEmail.values());
        setTeachers(combined);
        setFilteredTeachers(combined);
      } catch (err) {
        console.error("Load error:", err);
        setManualTeachers([]);
        setApprovedUsers([]);
        setTeachers([]);
        setFilteredTeachers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoth();
  }, []);

  // -------- Search & Filter --------
  useEffect(() => {
    let results = [...teachers];

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      results = results.filter((t) => (t.full_name || "").toLowerCase().includes(s));
    }

    if (selectedDesignation) {
      results = results.filter((t) => (t.designation || "") === selectedDesignation);
    }

    setFilteredTeachers(results);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  }, [searchTerm, selectedDesignation, teachers]);

  // react-select options
  useEffect(() => {
    const options = teachers.map((t) => ({ value: t.id, label: t.full_name || `#${t.id}` }));
    setNameOptions(options);
  }, [teachers]);

  // -------- Common helpers --------
  const resetForm = () => {
    setFormData({
      full_name: "",
      designation: "",
      contact_email: "",
      contact_phone: "",
      subject: "",
      profile: "",
      photo: null,
      teacher_intro: "",
    });
    setPreview(null);
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentTeacherId(null);
    setCurrentSource(null);
  };

  const refreshCombined = async () => {
    try {
      setIsLoading(true);
      const tRes = await AxiosInstance.get("/teachers/");
      const tList = Array.isArray(tRes.data) ? tRes.data : [];
      const manualNormalized = tList.map(normalizeManual);
      setManualTeachers(manualNormalized);

      const aRes = await AxiosInstance.get("approve_staff/");
      const rawUsers = Array.isArray(aRes.data) ? aRes.data : [];
      const onlyApproved = rawUsers.filter((u) => u.is_approved === true);
      const approvedNormalized = onlyApproved
        .filter((u) => u.role?.toLowerCase?.() === "teacher" || !u.role)
        .map(normalizeApproved);
      setApprovedUsers(approvedNormalized);

      const byEmail = new Map();
      const pushUnique = (arr) => {
        arr.forEach((item) => {
          const key = (item.contact_email || "").toLowerCase();
          if (key && !byEmail.has(key)) byEmail.set(key, item);
          if (!key) byEmail.set(`${item.id}`, item);
        });
      };
      pushUnique(approvedNormalized);
      pushUnique(manualNormalized);

      const combined = Array.from(byEmail.values());
      setTeachers(combined);
      setFilteredTeachers(combined);
    } catch (e) {
      console.error("Refresh failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // -------- Submit handlers --------
  const saveManual = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append("full_name", formData.full_name);
    formDataToSend.append("designation", formData.designation);
    formDataToSend.append("contact_email", formData.contact_email);
    formDataToSend.append("contact_phone", formData.contact_phone);
    formDataToSend.append("subject", formData.subject || "");
    formDataToSend.append("profile", formData.profile || "");
    formDataToSend.append("teacher_intro", formData.teacher_intro || "");
    if (formData.photo) formDataToSend.append("photo", formData.photo);

    if (isEditing) {
      await AxiosInstance.put(`teachers/${currentTeacherId}/`, formDataToSend);
    } else {
      await AxiosInstance.post("teachers/", formDataToSend);
    }
  };

  const saveApproved = async () => {
    // Most approve-staff APIs accept PATCH with simple fields.
    // 🔧 Adjust field keys here to match your backend if needed.
    const fd = new FormData();
    if (formData.full_name) fd.append("username", formData.full_name);
    if (formData.designation) fd.append("role", formData.designation);
    if (formData.contact_phone) fd.append("phone", formData.contact_phone);
    if (formData.contact_email) fd.append("email", formData.contact_email);
    if (formData.photo) fd.append("profile_picture", formData.photo);

    await AxiosInstance.patch(`approve_staff/${currentTeacherId}/`, fd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentSource === "manual") {
        await saveManual();
      } else if (currentSource === "approved") {
        await saveApproved();
      } else {
        throw new Error("Unknown source");
      }
      toast.success(isEditing ? "তথ্য আপডেট হয়েছে" : "তথ্য সংরক্ষণ হয়েছে");
      resetForm();
      await refreshCombined();
    } catch (error) {
      console.error("Save error:", error?.response?.data || error.message);
      toast.error("একটি সমস্যা হয়েছে, আবার চেষ্টা করুন");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------- Row actions --------
  const handleEdit = (teacher) => {
    setFormData({
      full_name: teacher.full_name || "",
      designation: teacher.designation || "",
      contact_email: teacher.contact_email || "",
      contact_phone: teacher.contact_phone || "",
      subject: teacher.subject || "",
      profile: teacher.profile || "",
      photo: null,
      teacher_intro: teacher.teacher_intro || "",
    });
    setCurrentTeacherId(teacher.apiId);
    setCurrentSource(teacher.src); // 'manual' or 'approved'
    setIsEditing(true);
    setIsModalOpen(true);
    if (teacher.photo) setPreview(teacher.photo);
  };

  const handleDelete = async (teacher) => {
    if (!window.confirm("আপনি কি এই তথ্য মুছে ফেলতে চান?")) return;
    try {
      if (teacher.src === "manual") {
        await AxiosInstance.delete(`/teachers/${teacher.apiId}/`);
      } else {
        await AxiosInstance.delete(`approve_staff/${teacher.apiId}/`);
      }
      toast.success("তথ্য সফলভাবে মুছে ফেলা হয়েছে");
      await refreshCombined();
    } catch (error) {
      console.error("Delete error:", error?.response?.data || error.message);
      toast.error("মুছে ফেলতে সমস্যা হয়েছে");
    }
  };

  // -------- Filters / pagination helpers --------
  const getUniqueDesignations = () => {
    const designations = [...new Set(teachers.map((t) => t.designation).filter(Boolean))];
    return designations.map((desig) => ({ value: desig, label: desig }));
  };

  const paginatedTeachers = filteredTeachers.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const totalPages = Math.ceil(filteredTeachers.length / pagination.itemsPerPage);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setPagination({ ...pagination, currentPage: page });
    }
  };

  // -------- Render --------
  return (
    <div className="p-4">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">শিক্ষকদের তালিকা</h2>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setIsEditing(false);
            setCurrentSource("manual"); // new add always goes to manual /teachers/
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          শিক্ষক যোগ করুন
        </button>
      </div>

      {/* Search & Filter */}
      <div className="grid max-w-md grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            নাম দিয়ে খুঁজুন
          </label>
          <Select
            options={nameOptions}
            isClearable
            placeholder="শিক্ষকের নাম লিখুন..."
            onChange={(opt) => setSearchTerm(opt?.label || "")}
            onInputChange={(v) => setSearchTerm(v)}
            className="basic-single"
            classNamePrefix="select"
            styles={{
              control: (p) => ({ ...p, minHeight: "32px", height: "32px" }),
              valueContainer: (p) => ({ ...p, padding: "0 8px", height: "32px" }),
              input: (p) => ({ ...p, margin: 0, padding: 0, fontSize: "0.875rem" }),
              placeholder: (p) => ({ ...p, fontSize: "0.875rem", margin: 0 }),
              singleValue: (p) => ({ ...p, fontSize: "0.875rem", margin: 0 }),
              dropdownIndicator: (p) => ({ ...p, padding: "4px" }),
              clearIndicator: (p) => ({ ...p, padding: "4px" }),
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            পদবি দিয়ে ফিল্টার করুন
          </label>
          <select
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
            className="block h-8 w-full px-3 text-sm border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
          >
            <option value="">সকল পদবি</option>
            {getUniqueDesignations().map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 mt-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">ডেটা লোড হচ্ছে...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow mt-4">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">কোনো শিক্ষক পাওয়া যায়নি</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">নতুন শিক্ষক যোগ করতে উপরের বাটনে ক্লিক করুন</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
              <thead className="bg-blue-500 text-center text-white text-sm dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">ছবি</th>
                  <th className="py-3 px-4">নাম</th>
                  <th className="py-3 px-4">পদবি</th>
                  <th className="py-3 px-4">বিষয়</th>
                  <th className="py-3 px-4">ইমেইল</th>
                  <th className="py-3 px-4">মোবাইল নম্বর</th>
                  <th className="py-3 px-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedTeachers.map((t, index) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-center text-gray-500 dark:text-gray-400">
                      {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        {t.photo ? (
                          <img
                            src={t.photo}
                            alt={t.full_name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://via.placeholder.com/40";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-gray-900 dark:text-gray-100">{t.full_name}</td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{t.designation || "-"}</td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{t.subject || "-"}</td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{t.contact_email || "-"}</td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{t.contact_phone || "-"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(t)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                          এডিট
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors dark:bg-red-500 dark:hover:bg-red-600"
                        >
                          ডিলিট
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
            <div className="flex justify-center mt-6">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  পূর্ববর্তী
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded ${
                      pagination.currentPage === page
                        ? "bg-blue-600 text-white dark:bg-blue-500"
                        : "border border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  পরবর্তী
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md relative">
            <button
              onClick={resetForm}
              className="absolute top-3 right-3 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6">
              <h2 className="text-xl font-semibold text-center mb-4 text-blue-600 dark:text-blue-400">
                {isEditing ? "শিক্ষকের তথ্য এডিট করুন" : "শিক্ষকের তথ্য ফর্ম"}
                {currentSource ? ` (${currentSource === "manual" ? "Manual" : "Approved"})` : ""}
              </h2>

              {/* Image Preview */}
              <div className="flex justify-center mb-2">
                {preview ? (
                  <img src={preview} alt="প্রিভিউ" className="w-12 h-12 rounded-full object-cover border-2 border-blue-400" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 dark:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-1">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">শিক্ষকের নাম</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="শিক্ষকের পূর্ণ নাম লিখুন"
                    required
                    className="block w-full py-2 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4 mt-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">পদবি</label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="যেমন: Teacher / Assistant Professor"
                      className="block w-full py-2 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">বিষয়</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="যেমন: গণিত/ইংরেজি"
                      className="block w-full py-2 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={currentSource === "approved"} // subject unknown for approved
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">ইমেইল ঠিকানা</label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder=" ইমেইল লিখুন"
                    className="block w-full py-2 px-4 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">মোবাইল নম্বর</label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="block w-full py-2 px-4 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">শিক্ষকের ছবি</label>
                  <input
                    type="file"
                    name="photo"
                    accept="image/jpg, image/jpeg, image/png, image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setFormData({ ...formData, photo: file || null });
                      setPreview(file ? URL.createObjectURL(file) : null);
                    }}
                    className="block w-full px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg file:bg-gray-100 file:text-gray-700 file:text-sm file:px-4 file:py-1.5 file:border-none file:rounded-lg dark:file:bg-gray-700 dark:file:text-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">(JPEG, PNG, JPG, WEBP)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">শিক্ষক পরিচিতি</label>
                  <textarea
                    rows={3}
                    name="teacher_intro"
                    value={formData.teacher_intro}
                    onChange={(e) => setFormData({ ...formData, teacher_intro: e.target.value })}
                    placeholder="শিক্ষক সম্পর্কে সংক্ষিপ্ত বিবরণ লিখুন"
                    className="block w-full py-2 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={currentSource === "approved"}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-2.5 mt-6 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? "প্রক্রিয়াকরণ..." : isEditing ? "আপডেট করুন" : "তথ্য সংরক্ষণ করুন"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
