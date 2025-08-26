import React, { useEffect, useState } from "react";
import AxiosInstance from "../../components/AxiosInstance"; // adjust path if needed

/**
 * Aacknowledgment.jsx
 * Page to display academic acknowledgements (image or PDF) in a 2-column grid of cards.
 * API endpoint: "acknowledgment"
 * Attributes: title (string), image (file URL for image or pdf), date (ISO string)
 */
export default function Aacknowledgment() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await AxiosInstance.get("acknowledgment");
        if (!alive) return;
        const data = Array.isArray(res.data) ? res.data : [];
        // Sort by date desc if available
        const sorted = data.sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0));
        setItems(sorted);
      } catch (err) {
        console.error("Failed to load acknowledgements", err);
        setError("Failed to load acknowledgements.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const isImage = (url = "") => /\.(png|jpe?g|webp|gif|bmp|tiff?)($|\?)/i.test(url);
  const isPdf = (url = "") => /\.pdf($|\?)/i.test(url);

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <section className="w-full py-10 px-4 md:px-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Acknowledgements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="mt-2 h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="h-56 bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full py-10 px-4 md:px-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Acknowledgements
        </h2>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </section>
    );
  }

  return (
    <section className="w-full py-10 px-4 md:px-8">
      <div className="flex items-end justify-between gap-3 mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100">
          Acknowledgements
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total: {items.length}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-gray-600 dark:text-gray-300">
          No acknowledgements found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item, idx) => {
            const fileUrl = item?.image || item?.file || ""; // support either key just in case
            const title = item?.title || "Untitled";
            const date = formatDate(item?.date);
            const _isImage = isImage(fileUrl);
            const _isPdf = isPdf(fileUrl);

            return (
              <a
                key={idx}
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="group block rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                title={title}
              >
                {/* Header */}
                <div className="px-5 pt-5 pb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {title}
                  </h3>
                  {date && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{date}</p>
                  )}
                </div>

                {/* Media */}
                <div className="relative">
                  {_isImage ? (
                    <img
                      src={fileUrl}
                      alt={title}
                      className="h-64 w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='24'%3EImage not available%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ) : _isPdf ? (
                    <div className="h-64 w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                      <PdfIcon className="h-16 w-16" />
                      <span className="ml-3 text-gray-700 dark:text-gray-200 font-medium">PDF Document</span>
                    </div>
                  ) : (
                    <div className="h-64 w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                      <FileIcon className="h-16 w-16" />
                      <span className="ml-3 text-gray-700 dark:text-gray-200 font-medium">Document</span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/40">
                    <span className="px-4 py-2 rounded-full bg-white text-gray-900 text-sm font-semibold shadow">
                      View / Download
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PdfIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`text-red-600 ${className}`}
      aria-hidden="true"
    >
      <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8.5a1.5 1.5 0 0 0 1.06-.44l3.5-3.5A1.5 1.5 0 0 0 19.5 17V4a2 2 0 0 0-2-2H6zm7 18v-2.5a1.5 1.5 0 0 1 1.5-1.5H17l-4 4zM7.5 8h3a1 1 0 1 1 0 2h-2v1h1.5a1 1 0 1 1 0 2H8.5V15a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1zm6 0h1.25A2.25 2.25 0 0 1 17 10.25v.5A2.25 2.25 0 0 1 14.75 13H13v2a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1h1.5zm0 2v1h1.25c.69 0 1.25-.56 1.25-1.25v-.5c0-.69-.56-1.25-1.25-1.25H13.5z" />
    </svg>
  );
}

function FileIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`text-gray-500 ${className}`}
      aria-hidden="true"
    >
      <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8.5a1.5 1.5 0 0 0 1.06-.44l3.5-3.5A1.5 1.5 0 0 0 19.5 17V4a2 2 0 0 0-2-2H6zm7 18v-2.5a1.5 1.5 0 0 1 1.5-1.5H17l-4 4z" />
    </svg>
  );
}
