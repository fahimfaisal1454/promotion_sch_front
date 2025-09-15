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

export default function TeacherRoutine() {
  const [routine, setRoutine] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await AxiosInstance.get("timetable/week"); // ✅ no params
        setRoutine(res.data || {});
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
                          <td>{r.start_time?.slice(0, 5)}–{r.end_time?.slice(0, 5)}</td>
                          <td>{r.class_name_label} {r.section_label}</td>
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
