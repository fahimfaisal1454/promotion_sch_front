import React, { useState, useEffect } from "react";
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

  const urlToFile = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const filename = url.split("/").pop();
    const contentType = response.headers.get("content-type") || "image/png";
    return new File([blob], filename, { type: contentType });
  };

  const updateInstitutionState = async (info) => {
    const logoFile = info.logo ? await urlToFile(info.logo) : null;
    const imageFile = info.institution_image ? await urlToFile(info.institution_image) : null;

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
      institution_image: info.institution_image ? info.institution_image.split("/").pop() : "",
    });

    setIsEditMode(true);
    setInstitutionId(info.id);
  };

  const fetchInstitutionInfo = async () => {
    try {
      let res;
      if (institutionId) {
        res = await AxiosInstance.get(`institutions/${institutionId}/`);
        if (res.data) updateInstitutionState(res.data);
      } else {
        res = await AxiosInstance.get("institutions/");
        if (Array.isArray(res.data) && res.data.length > 0) {
          updateInstitutionState(res.data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching institution info:", error);
    }
  };

  useEffect(() => {
    fetchInstitutionInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        toast.success("Information updated successfully.");
      } else {
        await AxiosInstance.post("/institutions/", data);
        toast.success("Information submitted successfully.");
      }
      fetchInstitutionInfo();
    } catch (error) {
      console.error("Submit error:", error.response?.data || error.message);
      toast.error("Failed to submit information.");
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
            Institution Information Form
          </h2>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="space-y-4">
              {/* Institution Name */}
              <div>
                <label className="block text-sm text-black dark:text-gray-300">
                  Institution Name*
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Enter institution name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                />
              </div>

              {/* Government Approval Number */}
              <div>
                <label className="block text-sm text-black dark:text-gray-300">
                  Government Approval Number
                </label>
                <input
                  type="text"
                  name="government_approval_number"
                  placeholder="Enter approval number"
                  value={formData.government_approval_number}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                />
              </div>

              {/* Government Approval Date */}
              <div>
                <label className="block text-sm text-black dark:text-gray-300">
                  Government Approval Date
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
              {/* Contact Email */}
              <div>
                <label className="block text-sm text-black dark:text-gray-300">
                  Contact Email*
                </label>
                <input
                  type="email"
                  name="contact_email"
                  required
                  placeholder="Enter email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                />
              </div>

              {/* Contact Phone Number */}
              <div>
                <label className="block text-sm text-black dark:text-gray-300">
                  Contact Phone Number*
                </label>
                <input
                  type="text"
                  name="contact_phone"
                  placeholder="Enter phone number"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                />
              </div>

              {/* Address Code */}
              <div>
                <label className="block text-sm text-black dark:text-gray-300">
                  Address Code
                </label>
                <input
                  type="text"
                  name="address_code"
                  placeholder="Enter address code"
                  value={formData.address_code}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Address (Full Width) */}
          <div className="mt-4 md:col-span-2">
            <label className="block text-sm text-black dark:text-gray-300">
              Address*
            </label>
            <textarea
              name="address"
              rows={1}
              required
              placeholder="Enter address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 
               focus:outline-none focus:ring-1 focus:ring-sky-400 
               dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            />
          </div>

          {/* Logo + Institution Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 md:col-span-2">
            {/* Logo */}
            <div>
              <label htmlFor="logo" className="block text-sm text-black dark:text-gray-300">
                Institution Logo
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
                accept="image/jpeg, image/png, image/jpg, image/webp"
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
              <label htmlFor="institution_image" className="block text-sm text-black dark:text-gray-300">
                Institution Image
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
                accept="image/jpeg, image/png, image/jpg, image/webp"
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

          {/* Mission */}
          <div className="mt-4">
            <label className="block text-sm text-black dark:text-gray-300">
              Mission
            </label>
            <textarea
              name="mission"
              rows={3}
              placeholder="Enter mission"
              value={formData.mission}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            />
          </div>

          {/* Objectives */}
          <div className="mt-4">
            <label className="block text-sm text-black dark:text-gray-300">
              Objectives
            </label>
            <textarea
              name="objective"
              rows={3}
              placeholder="Enter objectives"
              value={formData.objective}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            />
          </div>

          {/* History */}
          <div className="mt-4">
            <label className="block text-sm text-black dark:text-gray-300">
              History
            </label>
            <textarea
              name="history"
              rows={3}
              placeholder="Enter history"
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
              {isEditMode ? "Update" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
