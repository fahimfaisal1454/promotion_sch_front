// src/components/Routine.jsx
import React, { useEffect, useMemo, useState } from "react";
import AxiosInstance from "../../components/AxiosInstance";

const CATEGORY_TABS = ["Academic", "Exam"];

export default function Routine({
  endpoint = "routines/",
  classesEndpoint = "classes/",
  title = "Routines",
}) {
  const [rows, setRows] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeCat, setActiveCat] = useState(CATEGORY_TABS[0]);

  // --- helpers ---
  const classNameFromId = (idOrName) => {
    if (!idOrName) return "N/A";
    if (typeof idOrName === "string" && isNaN(Number(idOrName))) return idOrName;
    const id = Number(idOrName);
    const found = classes.find((c) => c.id === id);
    return found?.name || String(idOrName);
  };

  const createdOrUpdated = (r) => r?.created_at || r?.updated_at || r?.date || null;

  const normalizeCategory = (c) => {
    const s = String(c || "").toLowerCase();
    if (s.includes("exam")) return "Exam";
    return "Academic";
  };

  const fileUrl = (r) =>
    r.file || r.file_url || r.pdf_file || r.document || r.attachment || r.image || r.image_url || "";

  const fixRelative = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const base = AxiosInstance?.defaults?.baseURL?.replace(/\/+$/, "") || "";
    const clean = url.replace(/^\/+/, "");
    return base ? `${base}/${clean}` : url;
  };

  // --- fetch classes ---
  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const res = await AxiosInstance.get(classesEndpoint);
        if (!ok) return;
        setClasses(Array.isArray(res.data) ? res.data : []);
      } catch {
        // ignore silently
      }
    })();
    return () => {
      ok = false;
    };
  }, [classesEndpoint]);

  // --- fetch routines by category ---
  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await AxiosInstance.get(endpoint, { params: { category: activeCat } });
        if (!ok) return;
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        const normalized = data.map((r) => ({
          ...r,
          _category: normalizeCategory(r.category || r.type),
        }));
        setRows(normalized);
      } catch {
        setErr("Failed to load routines.");
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, [endpoint, activeCat]);

  // --- sort (latest first) ---
  const filtered = useMemo(() => {
    const arr = rows.filter(
      (r) => (r?._category || normalizeCategory(r?.category)) === activeCat
    );
    return [...arr].sort((a, b) => {
      const da = new Date(createdOrUpdated(a) || 0).getTime();
      const db = new Date(createdOrUpdated(b) || 0).getTime();
      return db - da;
    });
  }, [rows, activeCat]);

  // --- headers ---
  const headers = ["Class", "Title", "File"];

  return (
    <section
      className="w-full py-8 px-4 md:px-8"
      style={{ backgroundColor: "#D2D3D4", color: "#111" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
        </div>

        {/* Tabs */}
        <div className="mb-5">
          <div className="inline-flex rounded-xl border border-gray-500 bg-[#D2D3D4] p-1 shadow-sm">
            {CATEGORY_TABS.map((cat) => {
              const active = cat === activeCat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={[
                    "px-4 py-2 text-base font-semibold rounded-lg transition",
                    active ? "bg-green-600 text-white" : "text-black hover:bg-gray-300",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="p-4 rounded-lg bg-white shadow text-base">Loading routines…</div>
        )}
        {err && !loading && (
          <div className="p-4 rounded-lg bg-red-100 border border-red-300 text-red-700 text-base">
            {err}
          </div>
        )}
        {!loading && !err && filtered.length === 0 && (
          <div className="p-4 rounded-lg bg-white shadow text-base">
            No routines found for <b>{activeCat}</b>.
          </div>
        )}

        {/* Table */}
        {!loading && !err && filtered.length > 0 && (
          <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-base">
                <thead className="bg-gray-200">
                  <tr>
                    {headers.map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-2.5 font-bold text-black text-base"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const file = fixRelative(fileUrl(r));
                    const titleText = r.title || r.name || r.caption || "Routine";
                    return (
                      <tr
                        key={r.id ?? `${titleText}-${file}`}
                        className="border-t border-gray-300 hover:bg-gray-100"
                      >
                        <td className="px-5 py-2.5 font-medium">
                          {classNameFromId(r.class_name ?? r.class ?? r.class_id)}
                        </td>
                        <td className="px-5 py-2.5">{titleText}</td>
                        <td className="px-5 py-2.5">
                          {file ? (
                            <a
                              href={file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-blue-700 font-semibold"
                            >
                              View / Download
                            </a>
                          ) : (
                            <span className="opacity-70">No File</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 text-sm border-t border-gray-300 bg-gray-200">
              Showing {filtered.length} record{filtered.length > 1 ? "s" : ""} for{" "}
              <b>{activeCat}</b>.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}