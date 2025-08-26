import { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import Select from "react-select";
import AxiosInstance from "../../../components/AxiosInstance";


export default function TeacherInfo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    designation: "",
    contact_email: "",
    contact_phone: "",
    photo: null,
    teacher_intro: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
  });
  const [preview, setPreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [nameOptions, setNameOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch teachers data
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setIsLoading(true);
        const response = await AxiosInstance.get("/teachers/");
        setTeachers(response.data || []);
        setFilteredTeachers(response.data || []);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        setTeachers([]);
        setFilteredTeachers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  // Update filtered teachers when search term or designation changes
  useEffect(() => {
    let results = teachers;

    if (searchTerm) {
      results = results.filter((teacher) =>
        teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDesignation) {
      results = results.filter(
        (teacher) => teacher.designation === selectedDesignation
      );
    }

    setFilteredTeachers(results);
  }, [searchTerm, selectedDesignation, teachers]);

  // Prepare name options for react-select
  useEffect(() => {
    const options = teachers.map((teacher) => ({
      value: teacher.id,
      label: teacher.full_name,
    }));
    setNameOptions(options);
  }, [teachers]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0];
      setFormData({ ...formData, photo: file });
      setPreview(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);


    try {
      const formDataToSend = new FormData();
      formDataToSend.append("full_name", formData.full_name);
      formDataToSend.append("designation", formData.designation);
      formDataToSend.append("contact_email", formData.contact_email);
      formDataToSend.append("contact_phone", formData.contact_phone);
      formDataToSend.append("subject", formData.subject || "");
      formDataToSend.append("profile", formData.profile || "");
      formDataToSend.append("teacher_intro", formData.teacher_intro || "");

      if (formData.photo) {
        formDataToSend.append("photo", formData.photo);
      }

      let response;
      if (isEditing) {
        response = await AxiosInstance.put(
          `teachers/${currentTeacherId}/`,
          formDataToSend
        );
      } else {
        response = await AxiosInstance.post("teachers/", formDataToSend);
      }

      toast.success(
        isEditing
          ? "শিক্ষকের তথ্য সফলভাবে আপডেট হয়েছে"
          : "শিক্ষকের তথ্য সফলভাবে জমা হয়েছে"
      );

      // Refresh list
      const listResponse = await AxiosInstance.get("/teachers/");
      setTeachers(listResponse.data || []);
      setFilteredTeachers(listResponse.data || []);
      resetForm();
    } catch (error) {
      console.error(
        "Error:",
        error.response ? error.response.data : error.message
      );
      console.error("একটি সমস্যা হয়েছে। আবার চেষ্টা করুন");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    setCurrentTeacherId(teacher.id);
    setIsEditing(true);
    setIsModalOpen(true);
    if (teacher.photo) {
      setPreview(teacher.photo);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("আপনি কি এই শিক্ষকের তথ্য মুছে ফেলতে চান?")) {
      try {
        await AxiosInstance.delete(`/teachers/${id}/`);
        toast.success("শিক্ষকের তথ্য সফলভাবে মুছে ফেলা হয়েছে");

        // Refresh data
        const response = await AxiosInstance.get("/teachers/");
        setTeachers(response.data || []);
        setFilteredTeachers(response.data || []);
      } catch (error) {
        toast.error("মুছে ফেলতে সমস্যা হয়েছে");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      designation: "",
      contact_email: "",
      contact_phone: "",
      subject: "",
      photo: null,
    });
    setPreview(null);
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentTeacherId(null);
  };

  // Get unique designations for filter dropdown
  const getUniqueDesignations = () => {
    const designations = [
      ...new Set(teachers.map((teacher) => teacher.designation)),
    ];
    return designations.map((desig) => ({ value: desig, label: desig }));
  };

  // Simple pagination logic
  const paginatedTeachers = filteredTeachers.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const totalPages = Math.ceil(
    filteredTeachers.length / pagination.itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setPagination({ ...pagination, currentPage: page });
    }
  };

  return (
    <div className="p-4">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">শিক্ষকদের তালিকা</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          শিক্ষক যোগ করুন
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="grid max-w-md grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name Search - React Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            নাম দিয়ে খুঁজুন
          </label>
          <Select
            options={nameOptions}
            isClearable
            placeholder="শিক্ষকের নাম লিখুন..."
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
              valueContainer: (provided) => ({
                ...provided,
                padding: "0 8px",
                height: "32px",
              }),
              input: (provided) => ({
                ...provided,
                margin: "0",
                padding: "0",
                fontSize: "0.875rem",
              }),
              placeholder: (provided) => ({
                ...provided,
                fontSize: "0.875rem",
                margin: "0",
              }),
              singleValue: (provided) => ({
                ...provided,
                fontSize: "0.875rem",
                margin: "0",
              }),
              dropdownIndicator: (provided) => ({
                ...provided,
                padding: "4px",
              }),
              clearIndicator: (provided) => ({
                ...provided,
                padding: "4px",
              }),
            }}
          />
        </div>

        {/* Designation Filter - Native Select */}
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
            {getUniqueDesignations().map((desig) => (
              <option key={desig.value} value={desig.value}>
                {desig.label}
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            ></path>
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            কোনো শিক্ষক পাওয়া যায়নি
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            নতুন শিক্ষক যোগ করতে উপরের বাটনে ক্লিক করুন
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto mt-4 ">
            <table className=" min-w-full  bg-white dark:bg-gray-800 rounded-lg">
              <thead className="bg-blue-500 text-center text-white text-sm dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 ">#</th>
                  <th className="py-3 px-4 ">ছবি</th>
                  <th className="py-3 px-4 ">নাম</th>
                  <th className="py-3 px-4">পদবি</th>
                  <th className="py-3 px-4">বিষয়</th>
                  <th className="py-3 px-4 ">ইমেইল</th>
                  <th className="py-3 px-4 ">মোবাইল নম্বর</th>
                  <th className="py-3 px-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedTeachers.map((teacher, index) => (
                  <tr
                    key={teacher.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="py-3 px-4 text-center text-gray-500 dark:text-gray-400">
                      {(pagination.currentPage - 1) * pagination.itemsPerPage +
                        index +
                        1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        {teacher.photo ? (
                          <img
                            src={teacher.photo}
                            alt={teacher.full_name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/40";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300">
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-gray-900 dark:text-gray-100">
                      {teacher.full_name}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                      {teacher.designation}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                      {teacher.subject}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                      {teacher.contact_email}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                      {teacher.contact_phone}
                    </td>
                    <td className="py-3 px-4 flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        এডিট
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
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

      {/* Teacher Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md relative ">
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
              <h2 className="text-xl font-semibold text-center mb-4 text-blue-600 dark:text-blue-400">
                {isEditing ? "শিক্ষকের তথ্য এডিট করুন" : "শিক্ষকের তথ্য ফর্ম"}
              </h2>

              {/* Image Preview */}
              <div className="flex justify-center mb-2">
                {preview ? (
                  <img
                    src={preview}
                    alt="শিক্ষকের ছবি প্রিভিউ"
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-400"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 dark:bg-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10"
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
                {/* নাম */}
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
                    শিক্ষকের নাম
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="শিক্ষকের পূর্ণ নাম লিখুন"
                    required
                    className="block w-full py-2 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4 mt-2">

                {/* পদবি */}
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
                    পদবি
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="যেমন: অধ্যাপক, সহকারী অধ্যাপক"
                    className="block w-full py-2 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>


                {/* বিষয় */}
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
                    বিষয়
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="যেমন: গণিত, পদার্থবিজ্ঞান, ইংরেজি"
                    className="block w-full py-2 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                </div>


                {/* ইমেইল */}
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
                    ইমেইল ঠিকানা
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute pl-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-gray-400 dark:text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                        />
                      </svg>
                    </span>
                    <input
                      type="email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleChange}
                      placeholder=" ইমেইল লিখুন"
                      className="block w-full py-2 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* ফোন নম্বর */}
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute pl-3 text-gray-400 dark:text-gray-500">
                      +88
                    </span>
                    <input
                      type="tel"
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleChange}
                      placeholder="01XXXXXXXXX"
                      pattern="[০-৯0-9]{11}"
                      className="block w-full py-2 pl-12 pr-4 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    11 ডিজিটের মোবাইল নম্বর লিখুন (01XXXXXXXXX)
                  </p>
                </div>

                {/* ছবি */}
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
                    শিক্ষকের ছবি
                  </label>
                  <input
                    type="file"
                    name="photo"
                    accept="image/jpg, image/jpeg, image/png, image/webp"
                    onChange={handleChange}
                    className="block w-full px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg file:bg-gray-100 file:text-gray-700 file:text-sm file:px-4 file:py-1.5 file:border-none file:rounded-lg dark:file:bg-gray-700 dark:file:text-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    (JPEG, PNG, JPG, WEBP)
                  </p>
                </div>

                {/* শিক্ষক পরিচিতি */}
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
                    শিক্ষক পরিচিতি
                  </label>
                  <textarea
                    rows={3}
                    type="text"
                    name="teacher_intro"
                    value={formData.teacher_intro}
                    onChange={handleChange}
                    placeholder="শিক্ষক সম্পর্কে সংক্ষিপ্ত বিবরণ লিখুন"
                    className="block w-full py-2 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* সাবমিট বাটন */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-2.5 mt-6 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ${
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