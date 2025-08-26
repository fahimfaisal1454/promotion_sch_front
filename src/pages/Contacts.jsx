import React, { useState } from 'react';
import AxiosInstance from '../components/AxiosInstance';
import useInstitutionInfo from '../utils/useInstituteInfo';
import {
  FaSchool,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaMapMarkerAlt,
  FaPaperPlane,
} from 'react-icons/fa';

export default function Contact() {
  const { info } = useInstitutionInfo();
  const institute = info?.[0] || {};

  const [status, setStatus] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() && !formData.phone.trim()) {
      setStatus('❌ অনুগ্রহ করে ইমেইল অথবা ফোন নম্বর প্রদান করুন।');
      return;
    }

    setStatus('পাঠানো হচ্ছে...');
    try {
      await AxiosInstance.post('contacts/', formData);
      setStatus('✅ মেসেজ সফলভাবে পাঠানো হয়েছে!');
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (error) {
      console.error('❌ মেসেজ পাঠাতে সমস্যা:', error);
      setStatus('❌ দুঃখিত, মেসেজ পাঠানো যায়নি। পরে চেষ্টা করুন।');
    }
  };

  return (
    <div id="contact" className="bg-[#f1f5f9] px-4 py-10">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0a3b68] border-b-4 border-[#0a3b68] inline-block px-4 pb-1">
          যোগাযোগ করুন
        </h1>
        <p className="text-sm text-gray-700 mt-1">
          {institute?.name || 'School'}, {institute?.address || 'School Address'}
        </p>
      </div>

      {/* Grid Layout */}
      <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2">
        {/* 📌 Institution Info Card */}
        <div className="relative bg-white border border-yellow-500 rounded-md p-4 pt-6 shadow-sm text-center text-sm">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow">
            <FaSchool className="text-yellow-500 text-base" />
          </div>
          <div className="mb-3">
            <h2 className="inline-block bg-lime-900 px-3 py-1 rounded text-white text-xs font-bold">
              যোগাযোগের তথ্য
            </h2>
          </div>

          <div className="space-y-3 text-xs text-gray-800">
            <div>
              <FaMapMarkerAlt className="text-yellow-500 mx-auto mb-1" />
              <p className="font-semibold">ঠিকানা</p>
              <p>{institute?.name}</p>
              <p>{institute?.address}</p>
            </div>
            <div>
              <FaPhone className="text-yellow-500 mx-auto mb-1" />
              <p className="font-semibold">ফোন</p>
              <p>{institute?.contact_phone || '—'}</p>
            </div>
            <div>
              <FaEnvelope className="text-yellow-500 mx-auto mb-1" />
              <p className="font-semibold">ইমেইল</p>
              <p>{institute?.contact_email || '—'}</p>
            </div>
            <div>
              <FaClock className="text-yellow-500 mx-auto mb-1" />
              <p className="font-semibold">অফিস সময়</p>
              <p>রবি - বৃহঃ: সকাল ৯টা - বিকেল ৫টা</p>
            </div>
          </div>
        </div>

        {/* 📨 Contact Form Card */}
        <div className="relative bg-white border border-teal-500 rounded-md p-4 pt-6 shadow-sm text-black text-sm">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow">
            <FaPaperPlane className="text-teal-500 text-base" />
          </div>
          <div className="text-center mb-3">
            <h2 className="inline-block bg-lime-900 px-3 py-1 rounded text-white text-xs font-bold">
              যোগাযোগ ফর্ম
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col space-y-2 text-xs">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="আপনার নাম"
              required
              className="border border-gray-300 rounded px-2 py-1 outline-none"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="আপনার ইমেইল (ঐচ্ছিক)"
              className="border border-gray-300 rounded px-2 py-1 outline-none"
            />
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="আপনার ফোন নম্বর (ঐচ্ছিক)"
              className="border border-gray-300 rounded px-2 py-1 outline-none"
            />
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="আপনার বার্তা"
              rows={3}
              required
              className="border border-gray-300 rounded px-2 py-1 outline-none"
            />
            <button
              type="submit"
              className="bg-[#0a3b68] text-white hover:bg-[#072f53] font-semibold py-1 rounded-sm transition"
            >
              পাঠান
            </button>
          </form>

          {status && (
            <p className="mt-2 text-xs text-gray-800 italic text-center">{status}</p>
          )}
        </div>
      </div>
    </div>
  );
}