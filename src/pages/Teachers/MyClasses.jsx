import { useEffect, useMemo, useState } from "react";
import AxiosInstance from "../../components/AxiosInstance";

export default function MyClasses() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [day, setDay] = useState("All");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await AxiosInstance.get("assign-teachers/my-class/"); // ✅ /my-class/
        if (!cancelled) setRows(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (!cancelled) {
          const msg = e?.response?.status === 401
            ? "Please sign in again."
            : "Could not load classes. Please try again.";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const uniqueDays = useMemo(() => {
    const got = Array.from(
      new Set((rows || []).map(r => r.day_of_week_display || r.day_of_week))
    ).filter(Boolean);
    return ["All", ...got];
  }, [rows]);

  const filtered = useMemo(() => {
    return (rows || []).filter(r =>
      day === "All" ? true : (r.day_of_week_display || r.day_of_week) === day
    );
  }, [rows, day]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Classes</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm">Day:</label>
          <select
            className="border rounded p-2"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          >
            {uniqueDays.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="bg-white rounded shadow p-4">Loading…</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded shadow p-4">
          No classes found. If this is a new account, ask an admin to link your user to a Teacher
          profile and assign classes.
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Day</th>
                <th className="text-left px-4 py-2">Period</th>
                <th className="text-left px-4 py-2">Class</th>
                <th className="text-left px-4 py-2">Section</th>
                <th className="text-left px-4 py-2">Subject</th>
                <th className="text-left px-4 py-2">Room</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">{r.day_of_week_display || r.day_of_week}</td>
                  <td className="px-4 py-2">{r.period}</td>
                  <td className="px-4 py-2">{r.class_name_label || r.class_name}</td>
                  <td className="px-4 py-2">{r.section_label || r.section}</td>
                  <td className="px-4 py-2">{r.subject_label || r.subject}</td>
                  <td className="px-4 py-2">{r.room || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
