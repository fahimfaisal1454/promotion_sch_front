import React, { useEffect, useState, useCallback } from "react";
import AxiosInstance from "../components/AxiosInstance";

export default function Gallery() {
  const [gallery, setGallery] = useState([]);
  const [instituteInfo, setInstituteInfo] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null); // index of selected image
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fetchGallery = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await AxiosInstance.get("gallery/");
      setGallery(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to fetch gallery:", e);
      setErr("Failed to load gallery.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitution = async () => {
    try {
      const res = await AxiosInstance.get("institutions/");
      setInstituteInfo(Array.isArray(res.data) ? res.data[0] : null);
    } catch (e) {
      console.error("Failed to fetch institution info:", e);
      // Non-blocking — no error UI needed here
    }
  };

  useEffect(() => {
    fetchInstitution();
    fetchGallery();
  }, []);

  const openModal = (idx) => setSelectedIndex(idx);
  const closeModal = () => setSelectedIndex(null);

  const goPrev = useCallback(() => {
    setSelectedIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length));
  }, [gallery.length]);

  const goNext = useCallback(() => {
    setSelectedIndex((i) => (i === null ? null : (i + 1) % gallery.length));
  }, [gallery.length]);

  // Keyboard controls for modal
  useEffect(() => {
    if (selectedIndex === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIndex, goPrev, goNext]);

  const title = instituteInfo ? `${instituteInfo.name} - Gallery` : "Gallery";

  return (
    <div className="px-4 py-4">
      <h1 className="text-3xl md:text-4xl text-center mb-8 text-[#0A3B68] font-bold">
        {title}
      </h1>

      {/* Loading / Error / Empty */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-white p-2 shadow">
              <div className="aspect-[4/3] w-full bg-gray-200 animate-pulse rounded" />
              <div className="h-4 bg-gray-200 animate-pulse mt-2 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : err ? (
        <p className="text-center text-red-600">{err}</p>
      ) : gallery.length === 0 ? (
        <div className="text-center text-gray-600 bg-white border border-gray-200 rounded-xl py-10">
          No images found.
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {gallery.map((image, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => openModal(idx)}
                className="cursor-pointer overflow-hidden rounded-lg shadow bg-white transform transition duration-300 hover:scale-105 text-left"
              >
                <div className="aspect-[4/3] w-full">
                  <img
                    src={image.image}
                    alt={image.caption || `Gallery ${idx + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                {image.caption && (
                  <div className="text-sm text-center text-gray-700 px-2 py-1 bg-white">
                    {image.caption}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Modal */}
          {selectedIndex !== null && gallery[selectedIndex] && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
              onClick={closeModal}
              aria-modal="true"
              role="dialog"
            >
              <div
                className="relative max-w-5xl w-[92%] mx-auto"
                onClick={(e) => e.stopPropagation()} // prevent closing when clicking the image/card
              >
                <img
                  src={gallery[selectedIndex].image}
                  alt={gallery[selectedIndex].caption || "Selected"}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                {gallery[selectedIndex].caption && (
                  <p className="text-center text-white mt-2">
                    {gallery[selectedIndex].caption}
                  </p>
                )}

                {/* Close */}
                <button
                  className="absolute top-3 right-3 text-white text-3xl font-bold"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  ×
                </button>

                {/* Prev / Next */}
                {gallery.length > 1 && (
                  <>
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 grid place-items-center"
                      onClick={goPrev}
                      aria-label="Previous"
                    >
                      ‹
                    </button>
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 grid place-items-center"
                      onClick={goNext}
                      aria-label="Next"
                    >
                      ›
                    </button>
                    <div className="absolute bottom-3 right-3 text-white/80 text-sm">
                      {selectedIndex + 1} / {gallery.length}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
