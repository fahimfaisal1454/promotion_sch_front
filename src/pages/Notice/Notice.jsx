import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, Search, Filter, FileText } from "lucide-react";
import AxiosInstance from "../../components/AxiosInstance";

const RESULTS_PER_PAGE = 6;

const categoryColors = {
  Public: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
  Internal: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  Exam: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300",
  Academic: "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-300",
  Notice: "bg-slate-50 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:text-slate-300",
};

export default function Notice() {
  const [notices, setNotices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const res = await AxiosInstance.get("notices/");
        const data = Array.isArray(res.data) ? res.data : [];

        const normalized = data.map((n) => {
          const rawDate = n.date ? new Date(n.date) : null;
          return {
            rawDate: rawDate ? rawDate.getTime() : 0,
            dateLabel: rawDate
              ? rawDate.toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "No date",
            title: n.title || "No title",
            downloadLink: n.pdf_file,
            category: n.category || "Notice",
            description: n.description || "",
          };
        });

        normalized.sort((a, b) => b.rawDate - a.rawDate);
        setNotices(normalized);
      } catch (e) {
        console.error("Error fetching notices:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return notices.filter((n) => {
      const matchesCategory = category === "All" ? true : n.category === category;
      const hay = `${n.title} ${n.category} ${n.description}`.toLowerCase();
      const matchesSearch = !term || hay.includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [notices, searchTerm, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / RESULTS_PER_PAGE));
  const startIdx = (currentPage - 1) * RESULTS_PER_PAGE;
  const current = filtered.slice(startIdx, startIdx + RESULTS_PER_PAGE);

  const distinctCategories = useMemo(() => {
    const set = new Set(["All"]);
    notices.forEach((n) => set.add(n.category));
    return Array.from(set);
  }, [notices]);

  useEffect(() => setCurrentPage(1), [searchTerm, category]);

  return (
    <div className="py-6">
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-6 rounded-t-2xl">
            <h1 className="text-2xl md:text-3xl font-bold text-white text-center tracking-wide">
              Notice Board
            </h1>
            <p className="text-white/80 text-center mt-1">
              Latest notices appear first.
            </p>
          </div>

          {/* Toolbar */}
          <div className="px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search notices…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 
                           bg-white dark:bg-slate-800 
                           text-slate-800 dark:text-slate-100 
                           placeholder-slate-400 dark:placeholder-slate-500 
                           focus:outline-none focus:ring-2 focus:ring-[#0a3b68] focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 
                           bg-white dark:bg-slate-800 
                           text-slate-800 dark:text-slate-100
                           focus:outline-none focus:ring-2 focus:ring-[#0a3b68]"
              >
                {distinctCategories.map((c) => (
                  <option
                    key={c}
                    value={c}
                    className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    {c === "All" ? "All categories" : c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="px-2 pb-6">
            {loading ? (
              <SkeletonList />
            ) : current.length ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 px-4">
                {current.map((n, i) => (
                  <li
                    key={`${n.title}-${i}`}
                    className="group rounded-xl border border-slate-200 dark:border-slate-700 
                               bg-white dark:bg-slate-800/90 
                               backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-4 md:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center text-slate-600 dark:text-slate-300 text-sm">
                          <CalendarDays className="w-4 h-4 mr-2" />
                          <span>{n.dateLabel}</span>
                        </div>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-full ${
                            categoryColors[n.category] || categoryColors["Notice"]
                          }`}
                        >
                          {n.category}
                        </span>
                      </div>

                      <h3 className="mt-2.5 text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">
                        {n.title}
                      </h3>

                      {n.description ? (
                        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                          {n.description}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 italic flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          No description attached
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Last updated: <span className="font-medium">{n.dateLabel}</span>
                        </div>

                        {n.downloadLink ? (
                          <a
                            href={n.downloadLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-[#0a3b68] px-3 py-2 
                                       text-white text-sm font-medium hover:bg-[#0a2068] transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            No file attached
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState />
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${
                    currentPage === 1
                      ? "text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                      : "text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  Prev
                </button>

                {[...Array(totalPages)].map((_, idx) => {
                  const page = idx + 1;
                  const active = page === currentPage;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg border text-sm ${
                        active
                          ? "bg-[#0a3b68] text-white border-[#0a3b68]"
                          : "text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${
                    currentPage === totalPages
                      ? "text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                      : "text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Skeleton */
function SkeletonList() {
  const items = Array.from({ length: 6 });
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 px-4">
      {items.map((_, i) => (
        <li
          key={i}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 shadow-sm p-4 md:p-5"
        >
          <div className="animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* Empty state */
function EmptyState() {
  return (
    <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
      <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <FileText className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        No results found
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
        Try changing the search term or category.
      </p>
    </div>
  );
}
