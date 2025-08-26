import React, { useState, useEffect, useRef } from "react";
import AxiosInstance from "../../../components/AxiosInstance";
import { toast, Toaster } from "react-hot-toast";

export default function InstitutionInfo() {
  const [formData, setFormData] = useState({
    name: "",
    government_approval_number: "",
    government_approval_date: "",
    history: "",
    mission: "",
    objective: "",
    address: "",
    address_code: "",
    contact_email: "",
    contact_phone: "",
    logo: null,
    institution_image: null,
  });

  const [fileNames, setFileNames] = useState({
    logo: "",
    institution_image: "",
  });

  const [existingImages, setExistingImages] = useState({
    logoUrl: "",
    institutionImageUrl: "",
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [institutionId, setInstitutionId] = useState(null);

  console.log("InstitutionInfo component rendered", formData);

  const urlToFile = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const filename = url.split("/").pop();
    const contentType = response.headers.get("content-type") || "image/png";
    return new File([blob], filename, { type: contentType });
  };

  const updateInstitutionState = async (info) => {
    const logoFile = info.logo ? await urlToFile(info.logo) : null;
    const imageFile = info.institution_image
      ? await urlToFile(info.institution_image)
      : null;

    setFormData({
      name: info.name || "",
      government_approval_number: info.government_approval_number || "",
      government_approval_date: info.government_approval_date || "",
      history: info.history || "",
      mission: info.mission || "",
      objective: info.objective || "",
      address: info.address || "",
      address_code: info.address_code || "",
      contact_email: info.contact_email || "",
      contact_phone: info.contact_phone || "",
      logo: logoFile,
      institution_image: imageFile,
    });

    setExistingImages({
      logoUrl: info.logo || "",
      institutionImageUrl: info.institution_image || "",
    });

    setFileNames({
      logo: info.logo ? info.logo.split("/").pop() : "",
      institution_image: info.institution_image
        ? info.institution_image.split("/").pop()
        : "",
    });

    setIsEditMode(true);
    setInstitutionId(info.id);
  };

  const fetchInstitutionInfo = async () => {
    try {
      let res;
      if (institutionId) {
        res = await AxiosInstance.get(`institutions/${institutionId}/`);
        if (res.data) {
          updateInstitutionState(res.data);
        }
      } else {
        res = await AxiosInstance.get("institutions/");
        if (res.data.length > 0) {
          updateInstitutionState(res.data[0]);
        }
      }

      console.log("Institution info fetched:", res.data);
    } catch (error) {
      console.error("Error fetching institution info:", error);
    }
  };

  useEffect(() => {
    fetchInstitutionInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      const file = files[0];

      setFormData((prev) => ({ ...prev, [name]: file }));
      setFileNames((prev) => ({ ...prev, [name]: file.name }));

      const reader = new FileReader();
      reader.onload = () => {
        setExistingImages((prev) => ({
          ...prev,
          [name === "logo" ? "logoUrl" : "institutionImageUrl"]: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        data.append(key, value);
      }
    });

    try {
      if (isEditMode && institutionId) {
        await AxiosInstance.patch(`/institutions/${institutionId}/`, data);
        toast.success("তথ্য সফলভাবে আপডেট হয়েছে");
      } else {
        await AxiosInstance.post("/institutions/", data);
        toast.success("তথ্য সফলভাবে জমা হয়েছে");
      }

      fetchInstitutionInfo();
    } catch (error) {
      console.error("Submit error:", error.response?.data || error.message);
      toast.error("তথ্য জমা দিতে ব্যর্থ হয়েছে");
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto bg-white dark:bg-gray-900 p-6 rounded-lg shadow"
        >
          <h2 className="text-2xl font-semibold mb-6 text-center text-blue-800">
            প্রতিষ্ঠানের তথ্য ফর্ম
          </h2>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="space-y-4">
              {/* প্রতিষ্ঠানের নাম */}
              <div>
                <label className="block text-sm text-black dark:text-gray-300">
                  প্রতিষ্ঠানের নাম*
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="প্রতিষ্ঠানের নাম লিখুন"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                />
              </div>

              {/* সরকারি অনুমোদন নম্বর */}
              <div>
                <label className="block text-sm text-black dark:text-gray-300">
                  সরকারি অনুমোদন নম্বর
                </label>
                <input
                  type="text"
                  name="government_approval_number"
                  placeholder="অনুমোদন নম্বর লিখুন"
                  value={formData.government_approval_number}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                />
              </div>

              {/* সরকারি অনুমোদনের তারিখ */}
              <div>
                <label className="block text-sm text-black dark:text-gray-300">
                  সরকারি অনুমোদনের তারিখ
                </label>
                <input
                  type="date"
                  name="government_approval_date"
                  value={formData.government_approval_date}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              {/* যোগাযোগ ইমেইল */}
              <div>
                <label className="block text-sm text-black dark:text-gray-300">
                  যোগাযোগ ইমেইল*
                </label>
                <input
                  type="email"
                  name="contact_email"
                  required
                  placeholder="ইমেইল লিখুন"
                  value={formData.contact_email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                />
              </div>

              {/* যোগাযোগ ফোন নম্বর */}
              <div>
                <label className="block text-sm text-black dark:text-gray-300">
                  যোগাযোগ ফোন নম্বর*
                </label>
                <input
                  type="text"
                  name="contact_phone"
                  placeholder="ফোন নম্বর লিখুন"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                />
              </div>

              {/* ঠিকানা কোড */}
              <div>
                <label className="block text-sm text-black dark:text-gray-300">
                  ঠিকানা কোড
                </label>
                <input
                  type="text"
                  name="address_code"
                  placeholder="ঠিকানা কোড লিখুন"
                  value={formData.address_code}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
            </div>
          </div>

          {/* ঠিকানা (Full Width - 2 Column Span) */}
          <div className="mt-4 md:col-span-2">
            <label className="block text-sm text-black dark:text-gray-300">
              ঠিকানা*
            </label>
            <textarea
              name="address"
              rows={1}
              required
              placeholder="ঠিকানা লিখুন"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 
               focus:outline-none focus:ring-1 focus:ring-sky-400 
               dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            />
          </div>

          {/* Logo + Institution Image (Side by Side in one row) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 md:col-span-2">
            {/* Logo */}
            <div>
              <label
                htmlFor="logo"
                className="block text-sm text-black dark:text-gray-300"
              >
                প্রতিষ্ঠানের লোগো
              </label>
              {existingImages.logoUrl && (
                <div className="mb-2">
                  <img
                    src={existingImages.logoUrl}
                    alt="Institution Logo"
                    className="h-16 w-16 object-contain border rounded"
                  />
                </div>
              )}
              <input
                id="logo"
                type="file"
                name="logo"
                accept="image/jpeg, image/png, image/jpg , image/webp"
                onChange={handleChange}
                className="block w-full px-3 py-2 mt-1 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg 
                 file:bg-gray-200 file:text-gray-700 file:text-sm file:px-4 file:py-1 file:border-none file:rounded-full 
                 dark:file:bg-gray-800 dark:file:text-gray-200 dark:text-gray-300 focus:outline-none focus:ring focus:ring-blue-300 
                 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900"
              />
              {fileNames.logo && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Selected: {fileNames.logo}
                </p>
              )}
            </div>

            {/* Institution Image */}
            <div>
              <label
                htmlFor="institution_image"
                className="block text-sm text-black dark:text-gray-300"
              >
                প্রতিষ্ঠানের ছবি
              </label>
              {existingImages.institutionImageUrl && (
                <div className="mb-2">
                  <img
                    src={existingImages.institutionImageUrl}
                    alt="Institution"
                    className="h-24 w-full object-cover border rounded"
                  />
                </div>
              )}
              <input
                id="institution_image"
                type="file"
                name="institution_image"
                accept="image/jpeg, image/png, image/jpg , image/webp"
                onChange={handleChange}
                className="block w-full px-3 py-2 mt-1 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg 
                 file:bg-gray-200 file:text-gray-700 file:text-sm file:px-4 file:py-1 file:border-none file:rounded-full 
                 dark:file:bg-gray-800 dark:file:text-gray-200 dark:text-gray-300 focus:outline-none focus:ring focus:ring-blue-300 
                 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900"
              />
              {fileNames.institution_image && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Selected: {fileNames.institution_image}
                </p>
              )}
            </div>
          </div>

          {/* প্রতিষ্ঠানের লক্ষ্য (Full Width) */}
          <div className="mt-4">
            <label className="block text-sm text-black dark:text-gray-300">
              প্রতিষ্ঠানের লক্ষ্য
            </label>
            <textarea
              name="mission"
              rows={3}
              placeholder="প্রতিষ্ঠানের লক্ষ্য লিখুন"
              value={formData.mission}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            />
          </div>

          {/* প্রতিষ্ঠানের উদ্দেশ্য (Full Width) */}
          <div className="mt-4">
            <label className="block text-sm text-black dark:text-gray-300">
              প্রতিষ্ঠানের উদ্দেশ্য
            </label>
            <textarea
              name="objective"
              rows={3}
              placeholder="প্রতিষ্ঠানের উদ্দেশ্য লিখুন"
              value={formData.objective}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            />
          </div>

          {/* প্রতিষ্ঠানের ইতিহাস (Full Width) */}
          <div className="mt-4">
            <label className="block text-sm text-black dark:text-gray-300">
              প্রতিষ্ঠানের ইতিহাস
            </label>
            <textarea
              name="history"
              rows={3}
              placeholder="প্রতিষ্ঠানের ইতিহাস লিখুন"
              value={formData.history}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            />
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              className="w-full md:w-auto px-6 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 rounded-md transition duration-300 text-sm"
            >
              {isEditMode ? "আপডেট করুন" : "সাবমিট করুন"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}