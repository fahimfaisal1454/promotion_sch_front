import React, { useState, useEffect } from "react";
import AxiosInstance from "./AxiosInstance";

export default function HeroSection() {
  const [instituteInfo, setInstituteInfo] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Convert relative media paths (e.g., "/media/xyz.jpg") to absolute URLs using Axios baseURL
  const fixUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const base = AxiosInstance?.defaults?.baseURL || "";
    const baseClean = base?.replace(/\/+$/, "");
    const pathClean = url?.replace(/^\/+/, "");
    return `${baseClean}/${pathClean}`;
  };

  const fetchInstitution = async () => {
    try {
      const res = await AxiosInstance.get("institutions/");
      const info = Array.isArray(res.data) ? res.data[0] : res.data;
      setInstituteInfo(info || null);
    } catch (err) {
      console.error("Failed to fetch institution info:", err);
      setInstituteInfo(null);
    }
  };

  useEffect(() => {
    fetchInstitution();
  }, []);

  const bgImage = fixUrl(instituteInfo?.institution_image);

  return (
    <div className="relative w-full h-[400px] md:h-[550px] overflow-hidden bg-gray-200">
      {/* Background Image (dynamic from institution_image) */}
      {bgImage ? (
        <>
          <img
            src={bgImage}
            alt={instituteInfo?.name}
            className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgLoaded(true)}
            loading="eager"
            fetchpriority="high"
          />
          {/* Simple skeleton while loading */}
          {!imgLoaded && (
            <div className="absolute inset-0 z-0 animate-pulse bg-gradient-to-r from-gray-200 to-gray-300" />
          )}
        </>
      ) : (
        // Fallback if no image found
        <div className="absolute inset-0 w-full h-full z-0 bg-gradient-to-br from-slate-300 to-slate-400" />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 z-10" />

      {/* Text Content */}
      <div className="relative z-20 flex items-center justify-start h-full px-6 md:px-16">
        <div className="text-white max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            {instituteInfo?.name}
          </h1>
          <p className="text-lg md:text-xl text-gray-200">
            শিক্ষার আলো ছড়ানোর দৃঢ় প্রত্যয়ে আমরা নিরলসভাবে কাজ করে যাচ্ছি।
          </p>
        </div>
      </div>
    </div>
  );
}
