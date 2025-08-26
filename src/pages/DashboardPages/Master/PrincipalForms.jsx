import React, { useState, useEffect } from "react";
import AxiosInstance from "../../../components/AxiosInstance";
import { Toaster, toast } from "react-hot-toast";

export default function PrincipalForms() {
  const [formsData, setFormsData] = useState({
    principal: {
      full_name: "",
      designation: "principal",
      contact_email: "",
      contact_phone: "",
      message: "",
      photo: null,
      preview: null,
    },
    vice_principal: {
      full_name: "",
      designation: "vice_principal",
      contact_email: "",
      contact_phone: "",
      message: "",
      photo: null,
      preview: null,
    },
  });
  const [existingData, setExistingData] = useState({
    principal: null,
    vice_principal: null,
  });
  const [isLoading, setIsLoading] = useState({
    principal: false,
    vice_principal: false,
  });

  // Fetch existing data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading((prev) => ({
          ...prev,
          principal: true,
          vice_principal: true,
        }));
        const res = await AxiosInstance.get("principal-vice-principal/");

        const newExistingData = {
          principal: null,
          vice_principal: null,
        };

        res.data.forEach((item) => {
          if (item.designation === "principal") {
            newExistingData.principal = item;
          } else if (item.designation === "vice_principal") {
            newExistingData.vice_principal = item;
          }
        });

        console.log("Existing data after processing:", newExistingData); // Debug line
        setExistingData(newExistingData);

        // Update form data with existing data
        setFormsData((prev) => ({
          principal: {
            ...prev.principal,
            full_name: newExistingData.principal?.full_name || "",
            contact_email: newExistingData.principal?.contact_email || "",
            contact_phone: newExistingData.principal?.contact_phone || "",
            message: newExistingData.principal?.message || "",
            preview: newExistingData.principal?.photo || null,
          },
          vice_principal: {
            ...prev.vice_principal,
            full_name: newExistingData.vice_principal?.full_name || "",
            contact_email: newExistingData.vice_principal?.contact_email || "",
            contact_phone: newExistingData.vice_principal?.contact_phone || "",
            message: newExistingData.vice_principal?.message || "",
            preview: newExistingData.vice_principal?.photo || null,
          },
        }));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading((prev) => ({
          ...prev,
          principal: false,
          vice_principal: false,
        }));
      }
    };

    fetchData();
  }, []);

  const handleChange = (designation, e) => {
    const { name, value, files } = e.target;

    if (name === "photo") {
      const file = files[0];
      setFormsData((prev) => ({
        ...prev,
        [designation]: {
          ...prev[designation],
          photo: file,
          preview: file
            ? URL.createObjectURL(file)
            : existingData[designation]?.photo || null,
        },
      }));
    } else {
      setFormsData((prev) => ({
        ...prev,
        [designation]: {
          ...prev[designation],
          [name]: value,
        },
      }));
    }
  };

  const handleSubmit = async (designation, e) => {
    e.preventDefault();
    const formData = formsData[designation];
    const formPayload = new FormData();

    // Explicitly add designation first
    formPayload.append("designation", designation);

    // Add other fields
    Object.keys(formData).forEach((key) => {
      if (
        formData[key] !== null &&
        formData[key] !== undefined &&
        key !== "preview"
      ) {
        formPayload.append(key, formData[key]);
      }
    });

    // Debug: Check what's being sent
    console.log(`Submitting ${designation} data:`, {
      designation,
      existingData: existingData[designation],
      formData: Object.fromEntries(formPayload.entries()),
    });

    try {
      setIsLoading((prev) => ({ ...prev, [designation]: true }));

      let response;
      if (existingData[designation]) {
        // Update existing data
        console.log(
          `Updating ${designation} with ID:`,
          existingData[designation].id
        );
        response = await AxiosInstance.put(
          `principal-vice-principal/${existingData[designation].id}/`,
          formPayload,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        // Create new data
        console.log(`Creating new ${designation}`);
        response = await AxiosInstance.post(
          "principal-vice-principal/",
          formPayload,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }

      // Update the existing data state with the response
      setExistingData((prev) => ({
        ...prev,
        [designation]: response.data,
      }));

      toast.success(
        `${
          designation === "principal" ? "প্রধান শিক্ষক" : "সহকারি প্রধান শিক্ষক"
        } তথ্য সফলভাবে ${
          existingData[designation] ? "আপডেট" : "সংরক্ষণ"
        } করা হয়েছে!`
      );

      // Update the preview with the new photo URL if it was uploaded
      if (formData.photo) {
        setFormsData((prev) => ({
          ...prev,
          [designation]: {
            ...prev[designation],
            preview: response.data.photo,
          },
        }));
      }
    } catch (error) {
      console.error(`Error saving ${designation} data:`, error);
      console.error("Error details:", error.response?.data);
      toast.error(
        `${
          designation === "principal" ? "প্রধান শিক্ষক" : "সহকারি প্রধান শিক্ষক"
        } তথ্য সংরক্ষণে ব্যর্থ হয়েছে`
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, [designation]: false }));
    }
  };
  const renderForm = (designation) => {
    const formData = formsData[designation];
    const loading = isLoading[designation];
    const existing = existingData[designation];

    return (
      <div
        key={designation}
        className="mb-8 p-6 border border-gray-200 rounded-lg"
      >
        <h3 className="text-lg text-center font-semibold text-gray-800 mb-4">
          {designation === "principal" ? "প্রধান শিক্ষক" : "সহকারি প্রধান শিক্ষক"} এর তথ্য
        </h3>

        {formData.preview && (
          <div className="mt-2 flex justify-center">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
              <img
                src={formData.preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => handleSubmit(designation, e)}
          className="space-y-2"
        >
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ছবি
            </label>
            <input
              type="file"
              name="photo"
              accept="image/jpeg, image/png, image/jpg, image/webp"
              onChange={(e) => handleChange(designation, e)}
              className="block w-full px-3 py-2 text-sm text-black bg-white border border-gray-200 rounded-lg file:bg-gray-200 file:text-gray-700 file:text-sm file:px-4 file:py-1 file:border-none file:rounded-full focus:border-lime-400 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              JPEG/PNG/JPG/WEBP format.
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              পূর্ণ নাম*
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={(e) => handleChange(designation, e)}
              className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded focus:border-lime-400 focus:outline-none"
              placeholder="পূর্ণ নাম লিখুন"
              required
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ইমেইল
              </label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={(e) => handleChange(designation, e)}
                className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded focus:border-lime-400 focus:outline-none"
                placeholder="ইমেইল ঠিকানা"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ফোন নম্বর
              </label>
              <input
                type="text"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => handleChange(designation, e)}
                className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded focus:border-lime-400 focus:outline-none"
                placeholder="মোবাইল নম্বর"
              />
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              বার্তা/মন্তব্য
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={(e) => handleChange(designation, e)}
              className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded focus:border-lime-400 focus:outline-none"
              placeholder="কোনো বার্তা বা মন্তব্য লিখুন"
              rows="3"
            />
          </div>

          {/* Submit/Update Button */}
          <button
            type="submit"
            className={`w-full py-2 text-white text-sm font-medium rounded ${
              existing
                ? "bg-blue-950 hover:bg-blue-800"
                : "bg-blue-950 hover:bg-blue-800"
            }`}
          >
            {existing ? "তথ্য আপডেট করুন" : "তথ্য সংরক্ষণ করুন"}
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <Toaster position="top-center" />
      <h2 className="text-xl font-semibold text-blue-800 mb-6 text-center">
        প্রতিষ্ঠান প্রধানদের তথ্য সংরক্ষণ
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderForm("principal")}
        {renderForm("vice_principal")}
      </div>
    </div>
  );
}