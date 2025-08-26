import { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import Select from "react-select";
import axiosInstance from "../../../components/AxiosInstance";

export default function StaffInfo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffs, setStaffs] = useState([]);
  const [filteredStaffs, setFilteredStaffs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    designation: "",
    contact_email: "",
    contact_phone: "",
    photo: null,
    profile: "",
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

  // Fetch staffs data
  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get("staff/");
        setStaffs(response.data || []);
        setFilteredStaffs(response.data || []);
      } catch (error) {
        console.error("স্টাফদের ডেটা লোড করতে সমস্যা হয়েছে");
        setStaffs([]);
        setFilteredStaffs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaffs();
  }, []);

  // Update filtered staffs when search term or designation changes
  useEffect(() => {
    let results = staffs;

    if (searchTerm) {
      results = results.filter((staff) =>
        staff.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDesignation) {
      results = results.filter(
        (staff) => staff.designation === selectedDesignation
      );
    }

    setFilteredStaffs(results);
  }, [searchTerm, selectedDesignation, staffs]);

  // Prepare name options for react-select
  useEffect(() => {
    const options = staffs.map((staff) => ({
      value: staff.id,
      label: staff.full_name,
    }));
    setNameOptions(options);
  }, [staffs]);

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
      formDataToSend.append("profile", formData.profile || "");

      if (formData.photo) {
        formDataToSend.append("photo", formData.photo);
      }

      if (isEditing) {
        await axiosInstance.put(`staff/${currentStaffId}/`, formDataToSend);
        toast.success("স্টাফের তথ্য সফলভাবে আপডেট হয়েছে");
      } else {
        await axiosInstance.post("staff/", formDataToSend);
        toast.success("স্টাফের তথ্য সফলভাবে জমা হয়েছে");
      }

      const response = await axiosInstance.get("staff/");
      setStaffs(response.data || []);
      setFilteredStaffs(response.data || []);
      resetForm();
    } catch (error) {
      toast.error("একটি সমস্যা হয়েছে। আবার চেষ্টা করুন");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (staff) => {
    setFormData({
      full_name: staff.full_name || "",
      designation: staff.designation || "",
      contact_email: staff.contact_email || "",
      contact_phone: staff.contact_phone || "",
      photo: null,
      profile: staff.profile || "",
    });
    setCurrentStaffId(staff.id);
    setIsEditing(true);
    setIsModalOpen(true);
    if (staff.photo) {
      setPreview(staff.photo);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("আপনি কি এই স্টাফের তথ্য মুছে ফেলতে চান?")) {
      try {
        await axiosInstance.delete(`staff/${id}/`);
        toast.success("স্টাফের তথ্য সফলভাবে মুছে ফেলা হয়েছে");
        const response = await axiosInstance.get("staff/");
        setStaffs(response.data || []);
        setFilteredStaffs(response.data || []);
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
      photo: null,
      profile: "",
    });
    setPreview(null);
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentStaffId(null);
  };

  // Pagination logic
  const paginatedStaffs = filteredStaffs.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const totalPages = Math.ceil(filteredStaffs.length / pagination.itemsPerPage);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setPagination({ ...pagination, currentPage: page });
    }
  };

  // Get unique designations
  const getUniqueDesignations = () => {
    const designations = [...new Set(staffs.map((staff) => staff.designation))];
    return designations.map((desig) => ({ value: desig, label: desig }));
  };

  return (
    <div className="p-4">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">স্টাফদের তালিকা</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          স্টাফ যোগ করুন
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
            placeholder="স্টাফের নাম লিখুন..."
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
            পদবি দিয়ে ফিল্টার করুন
          </label>
          <select
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
            className="block w-full h-8 px-3 text-sm border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
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

      {/* Staffs Table */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">ডেটা লোড হচ্ছে...</p>
        </div>
      ) : filteredStaffs.length === 0 ? (
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
            কোনো স্টাফ পাওয়া যায়নি
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            নতুন স্টাফ যোগ করতে উপরের বাটনে ক্লিক করুন
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-blue-500 text-white text-sm text-center dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 ">#</th>
                  <th className="py-3 px-4">ছবি</th>
                  <th className="py-3 px-4 ">নাম</th>
                  <th className="py-3 px-4 ">পদবি</th>
                  <th className="py-3 px-4 ">ইমেইল</th>
                  <th className="py-3 px-4">মোবাইল নম্বর</th>
                  <th className="py-3 px-4 t">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedStaffs.map((staff, index) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="py-3 px-4 text-center text-gray-500 dark:text-gray-400">
                      {(pagination.currentPage - 1) * pagination.itemsPerPage +
                        index +
                        1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        {staff.photo ? (
                          <img
                            src={staff.photo}
                            alt={staff.full_name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                staff.full_name
                              )}&background=random`;
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                staff.full_name
                              )}&background=random`}
                              alt={staff.full_name}
                              className="rounded-full w-full h-full"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-center text-gray-900 dark:text-gray-100">
                      {staff.full_name}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                      {staff.designation}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                      {staff.contact_email}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                      {staff.contact_phone}
                    </td>
                    <td className="py-3 px-4 flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(staff)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        এডিট
                      </button>
                      <button
                        onClick={() => handleDelete(staff.id)}
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

      {/* Staff Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md relative">
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
                {isEditing ? "স্টাফের তথ্য এডিট করুন" : "স্টাফের তথ্য ফর্ম"}
              </h2>

              {/* Image Preview */}
              <div className="flex justify-center mb-4">
                {preview ? (
                  <img
                    src={preview}
                    alt="স্টাফের ছবি প্রিভিউ"
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-400"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 dark:bg-gray-700">
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

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* নাম */}
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
                    স্টাফের নাম
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="স্টাফের পূর্ণ নাম লিখুন"
                    required
                    className="block w-full py-1.5 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

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
                    placeholder="যেমন: অফিস সহকারী, লাইব্রেরিয়ান"
                    required
                    className="block w-full py-1.5 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* ইমেইল */}
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
                    ইমেইল ঠিকানা
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="অফিসিয়াল ইমেইল লিখুন"
                    className="block w-full py-1.5 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* ফোন নম্বর */}
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    placeholder="01XXXXXXXXX"
                    pattern="[0-9০-৯]{11}"
                    className="block w-full py-1.5 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    11 ডিজিটের মোবাইল নম্বর লিখুন (01XXXXXXXXX)
                  </p>
                </div>

                {/* ছবি */}
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
                    স্টাফের ছবি
                  </label>
                  <input
                    type="file"
                    name="photo"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleChange}
                    className="block w-full px-3 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg file:bg-gray-100 file:text-gray-700 file:text-sm file:px-4 file:py-1 file:border-none file:rounded-lg dark:file:bg-gray-700 dark:file:text-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    (JGP, PNG, WEBP, JPEG) Format.
                  </p>
                </div>

                {/* সাবমিট বাটন */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-2 mt-4 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ${
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