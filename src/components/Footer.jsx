import React, { useState, useEffect } from "react";
import AxiosInstance from "./AxiosInstance";

export default function Footer() {
  const [institutionInfo, setInstitutionInfo] = useState(null);

  useEffect(() => {
    const fetchInstitutionInfo = async () => {
      try {
        const response = await AxiosInstance.get("institutions/");
        if (response.data && response.data.length > 0) {
          setInstitutionInfo(response.data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch institution info:", error);
      }
    };
    fetchInstitutionInfo();
  }, []);

  if (!institutionInfo) return null;

  return (
    <footer className="bg-[#2c8e3f] text-gray-800 text-sm">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 px-4 py-4">
        {/* Institution Info */}
        <div className="space-y-1 text-sm leading-snug text-white">
          <h1 className="text-lg font-semibold">{institutionInfo.name}</h1>
          <p>ঠিকানা: {institutionInfo.address}</p>
          <p>লোকেশন কোড: {institutionInfo.location_code}</p>
          <p>
            📞{" "}
            <a href={`tel:${institutionInfo.contact_phone}`} className="hover:underline">
              {institutionInfo.contact_phone}
            </a>
          </p>
          <p>
            📧{" "}
            <a href={`mailto:${institutionInfo.contact_email}`} className="hover:underline">
              {institutionInfo.contact_email}
            </a>
          </p>
        </div>

        {/* Updated Map Embed for Hamidpur High School */}
        <div>
          <iframe
            title="School Location Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6168.860406734528!2d89.34594281946336!3d23.16923860447996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ff09ff0286ff4b%3A0x46be9f7ed5d3cabc!2sMahmudpur%20Bazar!5e0!3m2!1sen!2sbd!4v1756015038428!5m2!1sen!2sbd"
            className="w-full h-28 md:h-32 rounded-md border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="border-t border-gray-300 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-2 text-center text-xs text-gray-400">
          © 2025 {institutionInfo.name}. All rights reserved.
          <span className="mx-1">|</span>
          Powered by{" "}
          <a
            href="https://utshabtech.com.bd/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Utshab Technology Ltd.
          </a>
        </div>
      </div>
    </footer>
  );
}
