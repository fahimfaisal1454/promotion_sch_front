import React, { useState, useEffect } from "react";
import AxiosInstance from "../components/AxiosInstance";
import Banner from '../images/banner.png';

export default function Gallery() {
  const [gallery, setGallery] = useState([]);
  const [instituteInfo, setInstituteInfo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null); // 👈 for modal

  const fetchGallery = async () => {
    try {
      const res = await AxiosInstance.get("gallery/");
      setGallery(res.data);
    } catch (err) {
      console.error("Failed to fetch gallery info:", err);
    }
  };

  const fetchInstitution = async () => {
    try {
      const res = await AxiosInstance.get("institutions/");
      setInstituteInfo(res.data[0]);
    } catch (err) {
      console.error("Failed to fetch institution info:", err);
    }
  };

  useEffect(() => {
    fetchInstitution();
    fetchGallery();
  }, []);

  return (
    <div className="px-4 py-4">
      
      <h1 className="text-3xl md:text-4xl text-center mb-8 text-[#0A3B68] font-bold">
        {instituteInfo ? `${instituteInfo.name} - গ্যালারি` : 'Loading...'}
      </h1>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {gallery.map((image, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedImage(image)} // 👈 click opens modal
            className="cursor-pointer overflow-hidden rounded-lg shadow bg-white transform transition duration-300 hover:scale-105"
          >
            <div className="aspect-[4/3] w-full">
              <img
                src={image.image}
                alt={`Gallery ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            {image.caption && (
              <div className="text-sm text-center text-gray-700 px-2 py-1 bg-white">
                {image.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)} // close on background click
        >
          <div className="relative max-w-4xl w-full mx-4">
            <img
              src={selectedImage.image}
              alt="Selected"
              className="w-full h-auto rounded-lg shadow-lg"
            />
            {selectedImage.caption && (
              <p className="text-center text-white mt-2">{selectedImage.caption}</p>
            )}
            {/* Close Button */}
            <button
              className="absolute top-3 right-3 text-white text-3xl font-bold"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
