import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AxiosInstance from "../../components/AxiosInstance";

export default function TeacherDashboard() {
  const [summary, setSummary] = useState({ today_classes: 0, attendance_marked_today: 0, pending_marks_entries: 0 });
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const todayISO = new Date().toISOString().slice(0,10);

  useEffect(() => {
    (async () => {
      try {
        const [s, n] = await Promise.all([
          AxiosInstance.get(`/teacher/dashboard/summary`, { params: { date: todayISO }}),
          AxiosInstance.get(`/teacher/notices`)
        ]);
        setSummary(s?.data || {});
        const arr = Array.isArray(n?.data) ? n.data : (n?.data?.results || []);
        setNotices(arr);
      } catch (e) {
        console.error("Teacher dashboard load error:", e);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="p-4">Loading dashboard…</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Today’s Classes" value={summary.today_classes ?? 0} footer={<Link className="underline" to="/teacher/classes">View</Link>} />
        <Card title="Quick Mark Attendance" value={`${summary.attendance_marked_today ?? 0} taken today`}
          highlight footer={<Link to="/teacher/attendance" className="inline-block px-4 py-2 rounded-md bg-[#2C8E3F] text-white hover:bg-[#267a36]">Mark Attendance</Link>} />
        <Card title="Pending Results Entry" value={summary.pending_marks_entries ?? 0} footer={<Link className="underline" to="/teacher/exams">Go to Exams/Marks</Link>} />
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Latest Notices</h3>
          <Link to="/teacher/notices" className="text-sm underline">View all</Link>
        </div>
        {notices.length === 0 ? (
          <div className="text-gray-500 mt-3">No notices yet.</div>
        ) : (
          <ul className="mt-3 space-y-2">
            {notices.slice(0,5).map((n) => (
              <li key={n.id} className="border rounded-md p-3 hover:bg-gray-50">
                <div className="font-medium">{n.title || "Untitled notice"}</div>
                {n.date && <div className="text-xs text-gray-500">{new Date(n.date).toLocaleDateString()}</div>}
                {n.short_description && <div className="text-sm text-gray-700 mt-1 line-clamp-2">{n.short_description}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, highlight=false, footer=null }) {
  return (
    <div className={`rounded-xl shadow p-5 bg-white ${highlight ? "ring-2 ring-[#2C8E3F]" : ""}`}>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-bold mt-2">{value}</div>
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
