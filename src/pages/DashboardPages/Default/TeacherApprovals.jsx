import { useEffect, useState } from "react";
import AxiosInstance from "../../../components/AxiosInstance";

export default function TeacherApprovals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await AxiosInstance.get("approve_staff/");
      setRows(res.data || []);
    } catch (e) {
      console.error("Load pending teachers failed", e);
    } finally {
      setLoading(false);
    }
  };

  console.log("All Request", rows);

  const handleSubmit = async (id, isApproved) => {
    try {
      await AxiosInstance.patch(`approve_staff/${id}/`, {
        is_approved: isApproved,
      });
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error("Approve failed", e);
      alert("Approval failed. Check console.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">শিক্ষক অনুমোদন তালিকা</h2>

      {rows.length === 0 ? (
        <div className="text-gray-600">No pending requests.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Profile</th>
                <th className="px-4 py-2">Username</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((u) => !u.is_approved) // 👈 only show users not yet approved
                .map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-2">{u.id}</td>
                    <td className="px-4 py-2">
                      {u.profile_picture ? (
                        <img
                          src={u.profile_picture}
                          alt={u.username}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">{u.username}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.role}</td>
                    <td className="px-4 py-2">{u.phone || "-"}</td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        onClick={() => handleSubmit(u.id, true)}
                        className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleSubmit(u.id, false)}
                        className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
