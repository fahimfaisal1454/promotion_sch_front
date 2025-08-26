// src/components/Results.jsx
import React, { useEffect, useMemo, useState } from "react";
import AxiosInstance from "../../components/AxiosInstance";

const CATEGORY_TABS = ["Public", "Internal"];

export default function Results({
  endpoint = "results/",
  classesEndpoint = "classes/",
  title = "Exam Results",
}) {
  const [rows, setRows] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeCat, setActiveCat] = useState(CATEGORY_TABS[0]);

  // Fetch classes
  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const res = await AxiosInstance.get(classesEndpoint);
        if (!ok) return;
        setClasses(Array.isArray(res.data) ? res.data : []);
      } catch {}
    })();
    return () => {
      ok = false;
    };
  }, [classesEndpoint]);

  // Fetch results
  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await AxiosInstance.get(endpoint, {
          params: { category: activeCat },
        });
        if (!ok) return;
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.results || [];
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setErr("Failed to load results.");
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, [endpoint, activeCat]);

  const classNameFromId = (idOrName) => {
    if (!idOrName) return "N/A";
    if (typeof idOrName === "string" && isNaN(Number(idOrName))) return idOrName;
    const id = Number(idOrName);
    const found = classes.find((c) => c.id === id);
    return found?.name || String(idOrName);
  };

  const createdOrUpdated = (r) => r?.created_at || r?.updated_at || null;

  const filtered = useMemo(() => {
    const arr = rows.filter((r) => !r?.category || r.category === activeCat);
    return [...arr].sort((a, b) => {
      const ya = Number(a?.year) || 0;
      const yb = Number(b?.year) || 0;
      if (yb !== ya) return yb - ya;
      const da = new Date(createdOrUpdated(a) || 0).getTime();
      const db = new Date(createdOrUpdated(b) || 0).getTime();
      return db - da;
    });
  }, [rows, activeCat]);

  const showClassCol = activeCat !== "Public";

  const headers = ["Year", "Category", ...(showClassCol ? ["Class"] : []), "Exam", "File"];

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
                    active
                      ? "bg-green-600 text-white"
                      : "text-black hover:bg-gray-300",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading / Error / Empty states */}
        {loading && (
          <div className="p-4 rounded-lg bg-white shadow text-base">Loading results…</div>
        )}
        {err && !loading && (
          <div className="p-4 rounded-lg bg-red-100 border border-red-300 text-red-700 text-base">
            {err}
          </div>
        )}
        {!loading && !err && filtered.length === 0 && (
          <div className="p-4 rounded-lg bg-white shadow text-base">
            No results found for <b>{activeCat}</b>.
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
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-gray-300 hover:bg-gray-100"
                    >
                      <td className="px-5 py-2.5 font-medium">{r.year ?? "-"}</td>
                      <td className="px-5 py-2.5">{r.category ?? "-"}</td>

                      {showClassCol && (
                        <td className="px-5 py-2.5">
                          {classNameFromId(r.class_name ?? r.className)}
                        </td>
                      )}

                      <td className="px-5 py-2.5">{r.exam_name ?? "-"}</td>
                      <td className="px-5 py-2.5">
                        {r.file ? (
                          <a
                            href={r.file}
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
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 text-sm border-t border-gray-300 bg-gray-200">
              Showing {filtered.length} record{filtered.length > 1 ? "s" : ""} for <b>{activeCat}</b>.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}