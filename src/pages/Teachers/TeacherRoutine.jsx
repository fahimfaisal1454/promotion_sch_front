// src/pages/TeacherPanel/TeacherRoutine.jsx
import { useEffect, useState } from "react";
import AxiosInstance from "../../components/AxiosInstance";
import { Toaster, toast } from "react-hot-toast";

const DAYS = [
  { value: "Mon", label: "Monday" },
  { value: "Tue", label: "Tuesday" },
  { value: "Wed", label: "Wednesday" },
  { value: "Thu", label: "Thursday" },
  { value: "Fri", label: "Friday" },
  { value: "Sat", label: "Saturday" },
  { value: "Sun", label: "Sunday" },
];

// Try to derive the teacher id from various places/endpoints.
// This mirrors the "try multiple endpoints until one works" pattern you use elsewhere. :contentReference[oaicite:1]{index=1}
async function resolveTeacherId() {
  // 1) from localStorage (preferred if you save it at login)
  const stored = localStorage.getItem("teacher_id");
  if (stored) return String(stored);

  // 2) from a “me”/“user” style endpoint
  const candidates = ["people/me/", "teacher/me/", "users/me/", "user/"];
  for (const url of candidates) {
    try {
      const res = await AxiosInstance.get(url);
      const data = res?.data || {};
      // common shapes to check
      const id =
        data?.teacher_id ??
        data?.teacher?.id ??
        data?.id; // if endpoint is already teacher-scoped
      if (id) {
        localStorage.setItem("teacher_id", String(id));
        return String(id);
      }
    } catch {
      // ignore and try next
    }
  }
  return ""; // unknown
}

export default function TeacherRoutine() {
  const [routine, setRoutine] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let teacherId = localStorage.getItem("teacher_id") || "";
        if (!teacherId) {
          teacherId = await resolveTeacherId();
        }

        let res;
        if (teacherId) {
          // Primary: ask backend to filter by teacher_id
          res = await AxiosInstance.get("timetable/week", {
            params: { teacher_id: teacherId },
          });
        } else {
          // Fallback: if backend supports teacher=me, use it
          res = await AxiosInstance.get("timetable/week", {
            params: { teacher: "me" },
          });
        }

        const data = res?.data || {};

        // Last-resort client filter: if API returned extras, keep only this teacher's rows
        if (teacherId) {
          const filtered = {};
          for (const d of DAYS) {
            const rows = Array.isArray(data?.[d.value]) ? data[d.value] : [];
            filtered[d.value] = rows.filter(
              (r) =>
                // handle different shapes defensively
                String(r?.teacher_id ?? r?.teacher ?? "") === String(teacherId)
            );
          }
          setRoutine(filtered);
        } else {
          setRoutine(data);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load routine");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-semibold">My Weekly Routine</h1>

      {loading && <p>Loading…</p>}

      {!loading &&
        DAYS.map((day) => {
          const rows = routine?.[day.value] || [];
          return (
            <div key={day.value} className="bg-white border rounded p-3">
              <h2 className="text-lg font-semibold mb-2">{day.label}</h2>

              {rows.length === 0 ? (
                <p className="text-sm text-gray-500">No classes</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Class / Section</th>
                        <th>Subject</th>
                        <th>Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => (
                        <tr key={idx}>
                          <td>
                            {r.start_time?.slice(0, 5)}–
                            {r.end_time?.slice(0, 5)}
                          </td>
                          <td>
                            {r.class_name_label} {r.section_label}
                          </td>
                          <td>{r.subject_label}</td>
                          <td>{r.classroom_label || r.room || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
