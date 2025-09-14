import { useEffect, useState } from "react";
import AxiosInstance from "../../components/AxiosInstance";

export default function MyStudents() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await AxiosInstance.get("students/?mine=1");
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load students", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">My Students</h2>
      <div className="bg-white border rounded-xl">
        <div className="grid grid-cols-5 gap-3 p-3 text-sm font-medium bg-slate-50 border-b">
          <div>Name</div><div>Roll</div><div>Class</div><div>Section</div><div>Phone</div>
        </div>
        {rows.length ? rows.map(s => (
          <div key={s.id} className="grid grid-cols-5 gap-3 p-3 text-sm border-b last:border-b-0">
            <div>{s.full_name}</div>
            <div>{s.roll_number || "-"}</div>
            <div>{s.class_name}</div>
            <div>{s.section || "-"}</div>
            <div>{s.contact_phone || "-"}</div>
          </div>
        )) : <div className="p-4 text-sm text-slate-500">No students found.</div>}
      </div>
    </div>
  );
}
