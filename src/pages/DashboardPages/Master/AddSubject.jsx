import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import Select from "react-select";
import axiosInstance from "../../../components/AxiosInstance";



const AddSubject = () => {
  // State for subjects and classes
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [classMap, setClassMap] = useState({});

  // State for modal and form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSubjectId, setCurrentSubjectId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    class_name: "",
  });

  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, classesRes] = await Promise.all([
          axiosInstance.get("subjects/"),
          axiosInstance.get("classes/"),
        ]);
        setSubjects(subjectsRes.data);
        setFilteredSubjects(subjectsRes.data);
        setClasses(classesRes.data);

        // Create class name mapping
        const mapping = {};
        classesRes.data.forEach((cls) => {
          mapping[cls.id] = cls.name;
        });
        setClassMap(mapping);
      } catch (error) {
        toast.error("ডেটা লোড করতে সমস্যা হয়েছে");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter subjects based on search term and class filter
  useEffect(() => {
    let results = subjects;

    if (searchTerm) {
      results = results.filter((subject) =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedClassFilter) {
      results = results.filter(
        (subject) =>
          subject.class_name &&
          subject.class_name.id.toString() === selectedClassFilter.value
      );
    }

    setFilteredSubjects(results);
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page when filtering
  }, [searchTerm, selectedClassFilter, subjects]);

  // Prepare class options for React Select
  const classOptions = classes.map((cls) => ({
    value: cls.id,
    label: cls.name,
  }));

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle class selection change
  const handleClassChange = (selectedOption) => {
    setFormData({ ...formData, class_name: selectedOption?.value || "" });
  };

  // Submit form (both add and edit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.class_name) {
      toast.error("দয়া করে বিষয়ের নাম এবং শ্রেণি নির্বাচন করুন");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        class_name: formData.class_name,
      };

      if (isEditing) {
        await axiosInstance.put(`subjects/${currentSubjectId}/`, payload);
        toast.success("বিষয় সফলভাবে আপডেট হয়েছে");
      } else {
        await axiosInstance.post("subjects/", payload);
        toast.success("বিষয় সফলভাবে যোগ হয়েছে");
      }

      // Refresh data
      const response = await axiosInstance.get("subjects/");
      setSubjects(response.data);
      setFilteredSubjects(response.data);
      resetForm();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন"
      );
    }
  };

  const handleEdit = (subject) => {
    setFormData({
      name: subject.name,
      class_name: subject.class_name || "", // This should be the class ID
    });
    setCurrentSubjectId(subject.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Delete subject
  const handleDelete = async (id) => {
    if (window.confirm("আপনি কি এই বিষয়টি মুছে ফেলতে চান?")) {
      try {
        await axiosInstance.delete(`subjects/${id}/`);
        toast.success("বিষয় সফলভাবে মুছে ফেলা হয়েছে");

        // Refresh data
        const response = await axiosInstance.get("subjects/");
        setSubjects(response.data);
        setFilteredSubjects(response.data);
      } catch (error) {
        toast.error("মুছে ফেলতে সমস্যা হয়েছে");
      }
    }
  };

  // Reset form and modal
  const resetForm = () => {
    setFormData({
      name: "",
      class_name: "",
    });
    setCurrentSubjectId(null);
    setIsEditing(false);
    setIsModalOpen(false);
  };

  // Pagination logic
  const totalPages = Math.ceil(
    filteredSubjects.length / pagination.itemsPerPage
  );
  const paginatedSubjects = filteredSubjects.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
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
        <h2 className="text-xl font-semibold">বিষয় ব্যবস্থাপনা</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          বিষয় যোগ করুন
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-4 max-w-md grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            নাম দিয়ে খুঁজুন
          </label>
          <input
            type="text"
            placeholder="বিষয়ের নাম লিখুন..."
            className="block w-full py-1.5 px-3 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            শ্রেণি দিয়ে ফিল্টার করুন
          </label>
          <Select
            options={classOptions}
            isClearable
            placeholder="সকল শ্রেণি"
            value={selectedClassFilter}
            onChange={setSelectedClassFilter}
            className="basic-single"
            classNamePrefix="select"
            styles={{
              control: (provided) => ({
                ...provided,
                minHeight: "36px",
                height: "36px",
              }),
              placeholder: (provided) => ({
                ...provided,
                fontSize: "0.875rem",
              }),
            }}
          />
        </div>
      </div>

      {/* Subjects Table */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">ডেটা লোড হচ্ছে...</p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <svg
            className="w-16 h-16 mx-auto text-gray-400"
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
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            কোনো বিষয় পাওয়া যায়নি
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            নতুন বিষয় যোগ করতে উপরের বাটনে ক্লিক করুন
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-blue-500 text-center text-white text-sm font-semibold ">
                <tr>
                  <th className="py-2 px-4 text-left  ">#</th>
                  <th className="py-2 px-4 text-left ">বিষয়ের নাম</th>
                  <th className="py-2 px-4 text-left ">শ্রেণি</th>
                  <th className="py-2 px-4 text-left ">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedSubjects.map((subject, index) => (
                  <tr key={subject.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {(pagination.currentPage - 1) * pagination.itemsPerPage +
                        index +
                        1}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {subject.name || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {subject.class_name
                        ? classMap[subject.class_name] || "-"
                        : "-"}
                    </td>
                    <td className="py-3 px-4 text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        এডিট
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
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
            <div className="flex justify-center mt-4">
              <nav className="flex items-center space-x-1">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {"<<"}
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {"<"}
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded ${
                        pagination.currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {">"}
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={pagination.currentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {">>"}
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Subject Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
            {/* Modal header and close button */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-center mb-4 text-blue-600">
                {isEditing ? "বিষয় এডিট করুন" : "নতুন বিষয় যোগ করুন"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Subject name field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    বিষয়ের নাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Math, Bangla..."
                    required
                    className="block w-full py-1.5 px-3 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Class selection field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    শ্রেণি নির্বাচন করুন <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={classOptions}
                    value={classOptions.find(
                      (option) => option.value === formData.class_name
                    )}
                    onChange={handleClassChange}
                    placeholder="শ্রেণি নির্বাচন করুন"
                    className="basic-single"
                    classNamePrefix="select"
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        minHeight: "36px",
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        fontSize: "0.875rem",
                      }),
                    }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 mt-4 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                >
                  {isEditing ? "আপডেট করুন" : "সংরক্ষণ করুন"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddSubject;
