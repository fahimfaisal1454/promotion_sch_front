import { useEffect, useMemo, useState } from "react";
import AxiosInstance from "../../components/AxiosInstance";
import defaultImage from "../../images/person.PNG";
import { FaWindowClose } from "react-icons/fa";

const TEACHERS_API = "teachers/";
const STAFF_API = "staff"; // adjust if needed (removed trailing slash to match your pattern)

/* ------------------ Intro formatting helpers ------------------ */
// Bangla labels kept for parsing incoming data
const INTRO_LABELS = [
  "জন্ম তারিখ",
  "ইনডেক্স নং",
  "শিক্ষাগত যোগ্যতা",
  "১ম যোগদান",
  "MPO ভুক্তির তারিখ",
  "পে কোড",
  "পে-কোড",
  "বর্তমান প্রতিষ্ঠানের যোগদানের তারিখ",
];

// English display labels for the above Bangla keys
const DISPLAY_LABELS = {
  "জন্ম তারিখ": "Date of Birth",
  "ইনডেক্স নং": "Index No.",
  "শিক্ষাগত যোগ্যতা": "Educational Qualification",
  "১ম যোগদান": "First Joining",
  "MPO ভুক্তির তারিখ": "MPO Enrollment Date",
  "পে কোড": "Pay Code",
  "পে-কোড": "Pay Code",
  "বর্তমান প্রতিষ্ঠানের যোগদানের তারিখ": "Current Institution Joining Date",
};

function formatIntroToLines(raw = "") {
  if (!raw || typeof raw !== "string") return [];

  // Normalize spaces (keep Bengali punctuation)
  let text = raw.replace(/\s+/g, " ").trim();

  // Ensure each label starts on a new line and normalize colon
  INTRO_LABELS.forEach((lbl) => {
    const re = new RegExp(`(?:\\s|^)?(${lbl})\\s*[:：]?\\s*`, "g");
    text = text.replace(re, (m, g1, offset) => {
      const atStart = offset === 0 || text[offset - 1] === "\n";
      return `${atStart ? "" : "\n"}${g1}: `;
    });
  });

  // Split to lines and clean empties
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function renderIntro(lines) {
  return lines.map((line, i) => {
    const labelBn = INTRO_LABELS.find((l) => line.startsWith(l));
    if (labelBn) {
      const value = line.slice(labelBn.length).replace(/^:\s*/, "");
      const labelEn = DISPLAY_LABELS[labelBn] || labelBn;
      return (
        <p key={i} className="leading-6">
          <span className="font-semibold">{labelEn}:</span>{" "}
          {value || "—"}
        </p>
      );
    }
    return (
      <p key={i} className="leading-6">
        {line}
      </p>
    );
  });
}
/* -------------------------------------------------------------- */

export default function Faculty() {
  const [activeTab, setActiveTab] = useState("teachers"); // 'teachers' | 'staff'
  const [teachers, setTeachers] = useState([]);
  const [staff, setStaff] = useState([]);

  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [errorTeachers, setErrorTeachers] = useState("");
  const [errorStaff, setErrorStaff] = useState("");

  const [search, setSearch] = useState("");
  const [designation, setDesignation] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [isModalOpen, setIsModalOpen] = useState(null);

  // Fetch once on mount
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const res = await AxiosInstance.get(TEACHERS_API);
        setTeachers(res.data || []);
      } catch (e) {
        console.error(e);
        setErrorTeachers("Failed to load teachers.");
      } finally {
        setLoadingTeachers(false);
      }
    };
    const fetchStaff = async () => {
      try {
        setLoadingStaff(true);
        const res = await AxiosInstance.get(STAFF_API);
        setStaff(res.data || []);
      } catch (e) {
        console.error(e);
        setErrorStaff("Failed to load staff.");
      } finally {
        setLoadingStaff(false);
      }
    };
    fetchTeachers();
    fetchStaff();
  }, []);

  // Reset page when filters/tab change
  useEffect(() => {
    setPage(1);
  }, [activeTab, search, designation]);

  // Pick active dataset
  const list = activeTab === "teachers" ? teachers : staff;
  const loading = activeTab === "teachers" ? loadingTeachers : loadingStaff;
  const error = activeTab === "teachers" ? errorTeachers : errorStaff;
  const isStaffTab = activeTab === "staff";

  // Unique designations for filter (per tab)
  const designations = useMemo(() => {
    return Array.from(new Set((list || []).map((p) => p.designation).filter(Boolean)));
  }, [list]);

  // Search + filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = list || [];
    if (q) {
      rows = rows.filter((p) => {
        const name = (p.full_name || p.name || "").toLowerCase();
        const desig = (p.designation || "").toLowerCase();
        const subj = (p.subject || "").toLowerCase();
        const dept = (p.department || "").toLowerCase();
        const prof = (p.profile || "").toLowerCase();
        return (
          name.includes(q) ||
          desig.includes(q) ||
          subj.includes(q) ||
          dept.includes(q) ||
          prof.includes(q)
        );
      });
    }
    if (designation) {
      rows = rows.filter((p) => (p.designation || "") === designation);
    }
    return rows;
  }, [list, search, designation]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  const subjectLabel = "Subject"; // teachers only

  return (
    <div className="px-4 py-8 bg-[#f6f7fb] min-h-screen text-black">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-[#0a3b68]">
          Teachers & Staff List 2025
        </h1>
        <span className="text-sm text-gray-600">
          Total {activeTab === "teachers" ? teachers.length : staff.length} people
        </span>
      </div>

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur border border-gray-200 rounded-xl shadow-sm p-3 sm:p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs */}
          <div className="flex rounded-full border border-gray-300 overflow-hidden">
            <button
              onClick={() => setActiveTab("teachers")}
              className={`px-3 sm:px-4 h-9 text-sm font-medium transition ${
                activeTab === "teachers"
                  ? "bg-[#0a3b68] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Teachers ({teachers.length})
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`px-3 sm:px-4 h-9 text-sm font-medium transition ${
                activeTab === "staff"
                  ? "bg-[#0a3b68] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Staff ({staff.length})
            </button>
          </div>

          <div className="hidden sm:block h-5 w-px bg-gray-300 mx-1" />

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xl">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name/designation/subject/department…"
              className="w-full h-9 rounded-lg border border-gray-300 bg-white px-3 pe-9 text-sm outline-none focus:ring-2 focus:ring-[#0a3b68]"
              aria-label="Search people"
            />
            <svg
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.9 14.32a8 8 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Designation */}
          <select
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#0a3b68]"
            aria-label="Filter by designation"
          >
            <option value="">All designations</option>
            {designations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Reset */}
          <button
            onClick={() => {
              setSearch("");
              setDesignation("");
            }}
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="max-w-7xl mx-auto text-center text-red-600 text-sm mb-4">
          {error}
        </p>
      )}

      {/* Loading / Empty / Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <p className="text-center text-lg">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-600 bg-white border border-gray-200 rounded-xl py-10">
            No data found.
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
              {current.map((person, i) => (
                <PersonCard
                  key={person.id || `${activeTab}-${i}`}
                  person={person}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                  subjectLabel={subjectLabel}
                  subjectValue={person.subject}
                  isStaff={isStaffTab} // staff gets leaner view
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 h-9 rounded border border-gray-300 bg-white disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`px-3 py-1 h-9 rounded ${
                      page === n
                        ? "bg-[#0a3b68] text-white"
                        : "border border-gray-300 bg-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 h-9 rounded border border-gray-300 bg-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PersonCard({
  person,
  isModalOpen,
  setIsModalOpen,
  subjectLabel,
  subjectValue,
  isStaff, // decide what to show
}) {
  const {
    id,
    full_name,
    designation,
    contact_phone,
    contact_email,
    photo,
    teacher_intro,
  } = person;

  const name = full_name || "—";

  // Pre-compute formatted intro lines
  const introLines = useMemo(() => formatIntroToLines(teacher_intro), [teacher_intro]);

  return (
    <div className="group relative bg-white border border-[#0A3B68] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
      {/* Left: Photo */}
      <div className="flex-shrink-0">
        <img
          src={photo || defaultImage}
          alt={name}
          className="w-40 h-40 object-cover rounded-full border-[#0A3B68] border-4"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = defaultImage;
          }}
        />
      </div>

      {/* Right: Content */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {/* Name + Designation */}
        <div className="mb-1">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {name}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {designation || "—"}
          </p>
        </div>

        {/* Intro button (teachers only) */}
        {!isStaff && (
          <div>
            <button
              onClick={() => setIsModalOpen(isModalOpen === id ? null : id)}
              className="bg-[#0a3b68] text-white px-3 py-1 rounded text-xs hover:opacity-90"
            >
              Teacher Intro
            </button>

            {isModalOpen === id && (
              <div className="absolute z-50 mt-2 w-[min(95vw,28rem)] bg-white border rounded-lg p-4 shadow-xl left-1/2 -translate-x-1/2">
                <div className="flex items-start gap-3">
                  <img
                    src={photo || defaultImage}
                    alt={name}
                    className="w-24 h-28 object-cover rounded-lg border"
                  />
                  <div className="text-sm text-gray-800 break-words text-left space-y-1">
                    {introLines.length > 0
                      ? renderIntro(introLines)
                      : <p>No information provided.</p>}
                  </div>
                </div>
                <div className="mt-2 flex justify-center">
                  <button
                    className="text-red-600 text-xl"
                    onClick={() => setIsModalOpen(null)}
                    aria-label="Close"
                  >
                    <FaWindowClose />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info rows */}
        <div className="text-sm text-gray-800 space-y-1">
          {/* Subject/Duty: hidden for staff */}
          {!isStaff && (
            <p className="flex gap-1">
              <span className="font-semibold">{subjectLabel}:</span>
              <span className="truncate">{subjectValue || "—"}</span>
            </p>
          )}
          <p className="flex gap-1">
            <span className="font-semibold">Phone:</span>
            <span className="truncate">{contact_phone || "—"}</span>
          </p>
          <p className="flex gap-1">
            <span className="font-semibold">Email:</span>
            <span className="truncate">{contact_email || "—"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
