import { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import Select from "react-select";
import axiosInstance from "../../../components/AxiosInstance";

export default function StudentInfo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [classOptions, setClassOptions] = useState([]);
  const [classes, setClasses] = useState([]); // To store raw class data
  const [classMap, setClassMap] = useState({});
  const [formData, setFormData] = useState({
    full_name: "",
    roll_number: "",
    class_name: "",
    section: "",
    date_of_birth: "",
    address: "",
    guardian_name: "",
    guardian_contact: "",
    contact_email: "",
    contact_phone: "",
    photo: null,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
  });
  const [preview, setPreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [nameOptions, setNameOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [studentsRes, classesRes] = await Promise.all([
          axiosInstance.get("students/"),
          axiosInstance.get("classes/"),
        ]);

        setStudents(studentsRes.data || []);
        setFilteredStudents(studentsRes.data || []);
        setClasses(classesRes.data || []);

        // Create mapping of ID to class name
        const mapping = {};
        classesRes.data.forEach((cls) => {
          mapping[cls.id] = cls.name;
        });
        setClassMap(mapping);

        // Prepare class options for react-select
        setClassOptions(
          classesRes.data.map((cls) => ({
            value: cls.id,
            label: cls.name,
          }))
        );
      } catch (error) {
        // toast.error("ডেটা লোড করতে সমস্যা হয়েছে");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update filtered students when search term or class changes
  useEffect(() => {
    let results = students;

    if (searchTerm) {
      results = results.filter((student) =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedClass) {
      results = results.filter(
        (student) => student.class_name.toString() === selectedClass.toString()
      );
    }

    setFilteredStudents(results);
  }, [searchTerm, selectedClass, students]);
  // Prepare name options for react-select
  useEffect(() => {
    const options = students.map((student) => ({
      value: student.id,
      label: student.full_name,
    }));
    setNameOptions(options);
  }, [students]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("ফাইলের সাইজ 2MB এর বেশি হতে পারবে না");
        return;
      }
      setFormData({ ...formData, photo: file });
      setPreview(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields
    if (!formData.full_name || !formData.roll_number || !formData.class_name) {
      toast.error("দয়া করে নাম, রোল নম্বর এবং শ্রেণী পূরণ করুন");
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();

      // Required fields
      formDataToSend.append("full_name", formData.full_name);
      formDataToSend.append("roll_number", formData.roll_number);
      formDataToSend.append("class_name", formData.class_name);

      // Optional fields (only append if they have values)
      if (formData.photo) formDataToSend.append("photo", formData.photo);
      if (formData.contact_email)
        formDataToSend.append("contact_email", formData.contact_email);
      if (formData.contact_phone)
        formDataToSend.append("contact_phone", formData.contact_phone);
      if (formData.section) formDataToSend.append("section", formData.section);
      if (formData.date_of_birth)
        formDataToSend.append("date_of_birth", formData.date_of_birth);
      if (formData.address) formDataToSend.append("address", formData.address);
      if (formData.guardian_name)
        formDataToSend.append("guardian_name", formData.guardian_name);
      if (formData.guardian_contact)
        formDataToSend.append("guardian_contact", formData.guardian_contact);

      // Generate a simple digitaal_id_code if not provided
      const digitalIdCode =
        formData.digital_id_code ||
        `${formData.roll_number}-${formData.class_name}-${Date.now()}`;
      formDataToSend.append("digital_id_code", digitalIdCode);

      if (isEditing) {
        await axiosInstance.put(
          `students/${currentStudentId}/`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("শিক্ষার্থীর তথ্য সফলভাবে আপডেট হয়েছে");
      } else {
        await axiosInstance.post("students/", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("শিক্ষার্থীর তথ্য সফলভাবে জমা হয়েছে");
      }

      // Refresh data
      const response = await axiosInstance.get("students/");
      setStudents(response.data || []);
      setFilteredStudents(response.data || []);
      resetForm();
    } catch (error) {
      console.error(
        "Error submitting form:",
        error.response?.data || error.message
      );
      toast.error(
        `একটি সমস্যা হয়েছে: ${error.response?.data?.detail || error.message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (student) => {
    setFormData({
      full_name: student.full_name || "",
      roll_number: student.roll_number || "",
      class_name: student.class_name ? String(student.class_name) : "", // Force string conversion
      section: student.section || "",
      date_of_birth: student.date_of_birth || "",
      address: student.address || "",
      guardian_name: student.guardian_name || "",
      guardian_contact: student.guardian_contact || "",
      contact_email: student.contact_email || "",
      contact_phone: student.contact_phone || "",
      photo: null,
    });
    setCurrentStudentId(student.id);
    setIsEditing(true);
    setIsModalOpen(true);
    if (student.photo) {
      setPreview(student.photo);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("আপনি কি এই শিক্ষার্থীর তথ্য মুছে ফেলতে চান?")) {
      try {
        await axiosInstance.delete(`students/${id}/`);
        toast.success("শিক্ষার্থীর তথ্য সফলভাবে মুছে ফেলা হয়েছে");
        const response = await axiosInstance.get("students/");
        setStudents(response.data || []);
        setFilteredStudents(response.data || []);
      } catch (error) {
        toast.error("মুছে ফেলতে সমস্যা হয়েছে");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      roll_number: "",
      class_name: "",
      section: "",
      date_of_birth: "",
      address: "",
      guardian_name: "",
      guardian_contact: "",
      contact_email: "",
      contact_phone: "",
      photo: null,
    });
    setPreview(null);
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentStudentId(null);
  };

  // Pagination logic
  const paginatedStudents = filteredStudents.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const totalPages = Math.ceil(
    filteredStudents.length / pagination.itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setPagination({ ...pagination, currentPage: page });
    }
  };

  // Get unique classes
  const getUniqueClasses = () => {
    const classes = [...new Set(students.map((student) => student.class_name))];
    return classes.map((cls) => ({ value: cls, label: cls }));
  };

  return (
    <div className="p-4">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">শিক্ষার্থীদের তালিকা</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          শিক্ষার্থী যোগ করুন
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-4 max-w-md grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            নাম দিয়ে খুঁজুন
          </label>
          <Select
            options={nameOptions}
            isClearable
            placeholder="শিক্ষার্থীর নাম লিখুন..."
            onChange={(selectedOption) =>
              setSearchTerm(selectedOption?.label || "")
            }
            onInputChange={(inputValue) => setSearchTerm(inputValue)}
            className="basic-single"
            classNamePrefix="select"
            styles={{
              control: (provided) => ({
                ...provided,
                minHeight: "32px",
                height: "32px",
              }),
              placeholder: (provided) => ({
                ...provided,
                fontSize: "0.875rem",
              }),
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            শ্রেণী দিয়ে ফিল্টার করুন
          </label>

          <Select
            options={classOptions}
            isClearable
            placeholder="সকল শ্রেণী"
            value={classOptions.find(
              (option) => option.value.toString() === selectedClass.toString()
            )}
            onChange={(selectedOption) =>
              setSelectedClass(selectedOption?.value?.toString() || "")
            }
            className="basic-single"
            classNamePrefix="select"
            styles={{
              control: (provided) => ({
                ...provided,
                minHeight: "32px",
                height: "32px",
              }),
              placeholder: (provided) => ({
                ...provided,
                fontSize: "0.875rem",
              }),
            }}
          />
        </div>
      </div>

      {/* Students Table */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">ডেটা লোড হচ্ছে...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            ></path>
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            কোনো শিক্ষার্থী পাওয়া যায়নি
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            নতুন শিক্ষার্থী যোগ করতে উপরের বাটনে ক্লিক করুন
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-blue-500 text-sm font-semibold text-white text-center dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 ">#</th>
                  <th className="py-3 px-4 ">ছবি</th>
                  <th className="py-3 px-4 ">নাম</th>
                  <th className="py-3 px-4 ">রোল</th>
                  <th className="py-3 px-4 ">শ্রেণী</th>
                  <th className="py-3 px-4 ">সেকশন</th>
                  <th className="py-3 px-4 ">অভিভাবক</th>
                  <th className="py-3 px-4 ">মোবাইল</th>
                  <th className="py-3 px-4 ">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="py-3 px-4 text-center text-gray-500 dark:text-gray-400">
                      {(pagination.currentPage - 1) * pagination.itemsPerPage +
                        index +
                        1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        {student.photo ? (
                          <img
                            src={student.photo}
                            alt={student.full_name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                student.full_name
                              )}&background=random`;
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                student.full_name
                              )}&background=random`}
                              alt={student.full_name}
                              className="rounded-full w-full h-full"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-gray-900 dark:text-gray-100">
                      {student.full_name}
                    </td>
                    <td className="py-3 px-4 text-center  text-gray-700 dark:text-gray-300">
                      {student.roll_number}
                    </td>

                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                      {classMap[student.class_name] || "-"}
                    </td>

                    <td className="py-3 px-4 text-center  text-gray-700 dark:text-gray-300">
                      {student.section || "-"}
                    </td>
                    <td className="py-3 px-4 text-center  text-gray-700 dark:text-gray-300">
                      {student.guardian_name || "-"}
                    </td>
                    <td className="py-3 px-4 text-center  text-gray-700 dark:text-gray-300">
                      {student.contact_phone}
                    </td>
                    <td className="py-3 flex justify-center items-center px-4 space-x-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        এডিট
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors dark:bg-red-500 dark:hover:bg-red-600"
                      >
                        ডিলিট
                      </button>
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

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
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
                  )
                )}

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

      {/* Student Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={resetForm}
              className="absolute top-3 right-3 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="p-6">
              <h2 className="text-md font-semibold text-center mb-4 text-blue-600 dark:text-blue-400">
                {isEditing
                  ? "শিক্ষার্থীর তথ্য এডিট করুন"
                  : "শিক্ষার্থীর তথ্য ফর্ম"}
              </h2>

              {/* Image Preview */}
              <div className="flex justify-center mb-1">
                {preview ? (
                  <img
                    src={preview}
                    alt="শিক্ষার্থীর ছবি প্রিভিউ"
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-400"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 dark:bg-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-1">
                <div className="grid grid-cols-1 gap-1">
                  {/* Required Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        পূর্ণ নাম <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        className="block w-full py-1.5 px-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm  font-medium text-gray-700 dark:text-gray-300 mb-1">
                        রোল নম্বর <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="roll_number"
                        value={formData.roll_number}
                        onChange={handleChange}
                        required
                        className="block w-full py-1.5 px-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        শ্রেণী <span className="text-red-500">*</span>
                      </label>
                      <Select
                        options={classOptions}
                        value={classOptions.find(
                          (option) =>
                            String(option.value) === String(formData.class_name)
                        )}
                        onChange={(selectedOption) =>
                          setFormData({
                            ...formData,
                            class_name: selectedOption?.value || "",
                          })
                        }
                        placeholder="শ্রেণী নির্বাচন করুন"
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                          control: (provided, state) => ({
                            ...provided,
                            minHeight: "36px",
                            height: "36px",
                            fontSize: "14px",
                            boxShadow: state.isFocused
                              ? "0 0 0 1px #3b82f6"
                              : "none",
                            borderColor: state.isFocused
                              ? "#3b82f6"
                              : "#d1d5db",
                            "&:hover": {
                              borderColor: state.isFocused
                                ? "#3b82f6"
                                : "#9ca3af",
                            },
                          }),
                          // ... other styles
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        সেকশন
                      </label>
                      <input
                        type="text"
                        name="section"
                        value={formData.section}
                        onChange={handleChange}
                        className="block w-full py-1.5 px-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        জন্ম তারিখ
                      </label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        className="block w-full py-1.5 px-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        মোবাইল নম্বর <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contact_phone"
                        value={formData.contact_phone}
                        onChange={handleChange}
                        required
                        className="block w-full py-1.5 px-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ইমেইল
                    </label>
                    <input
                      type="email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleChange}
                      className="block w-full py-1.5 px-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ঠিকানা
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={2}
                      className="block w-full py-1.5 px-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        অভিভাবকের নাম
                      </label>
                      <input
                        type="text"
                        name="guardian_name"
                        value={formData.guardian_name}
                        onChange={handleChange}
                        className="block w-full py-1.5 px-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        অভিভাবকের মোবাইল
                      </label>
                      <input
                        type="tel"
                        name="guardian_contact"
                        value={formData.guardian_contact}
                        onChange={handleChange}
                        className="block w-full py-1.5 px-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ছবি আপলোড করুন
                    </label>
                    <input
                      type="file"
                      name="photo"
                      accept="image/*"
                      onChange={handleChange}
                      className="block w-full text-sm text-gray-600 bg-white border border-gray-300 rounded-lg file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 dark:file:bg-gray-700 dark:file:text-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      JPG, PNG ফরম্যাট (সর্বোচ্চ 2MB)
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-2 mt-4 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      প্রক্রিয়াকরণ...
                    </span>
                  ) : isEditing ? (
                    "আপডেট করুন"
                  ) : (
                    "তথ্য সংরক্ষণ করুন"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
