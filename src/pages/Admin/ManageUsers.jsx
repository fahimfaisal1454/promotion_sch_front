import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import AxiosInstance from "../../components/AxiosInstance";

export default function ManageUsers() {
  const location = useLocation();
  const preselectTeacherId = location.state?.teacherId || null;

  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]);

  const [form, setForm] = useState({
    teacher_id: "",
    username: "",
    email: "",
    phone: "",
    role: "Teacher",
    password: "",
    is_active: true,
    must_change_password: true,
  });

  // helpers
  const selectedTeacher = useMemo(
    () => teachers.find(t => String(t.id) === String(form.teacher_id)),
    [teachers, form.teacher_id]
  );

  const loadTeachers = async () => {
    const res = await AxiosInstance.get("teachers/?linked=false");
    setTeachers(res.data || []);
  };

  const loadUsers = async () => {
    const res = await AxiosInstance.get("admin/users/?role=Teacher");
    setUsers(res.data || []);
  };

  useEffect(() => {
    loadTeachers().catch(console.error);
    loadUsers().catch(console.error);
  }, []);

  useEffect(() => {
    if (preselectTeacherId && teachers.length) {
      const t = teachers.find(x => Number(x.id) === Number(preselectTeacherId));
      if (t) {
        setForm(f => ({
          ...f,
          teacher_id: t.id,
          username: (t.full_name || "").toLowerCase().replace(/\s+/g, ""),
          email: t.contact_email || "",
          phone: t.contact_phone || "",
        }));
      }
    }
  }, [preselectTeacherId, teachers]);

  const onChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const onTeacherChange = (e) => {
    const id = e.target.value;
    const t = teachers.find(x => String(x.id) === String(id));
    setForm(prev => ({
      ...prev,
      teacher_id: id,
      username: t ? (t.full_name || "").toLowerCase().replace(/\s+/g, "") : "",
      email: t?.contact_email || "",
      phone: t?.contact_phone || "",
      role: "Teacher",
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.teacher_id) return alert("Select a teacher first.");
    if (!form.username) return alert("Username is required.");
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const res = await AxiosInstance.post("admin/users/", payload);
      const tempPw = res.data?.temp_password;
      alert(`Teacher user created!${tempPw ? ` Temp password: ${tempPw}` : ""}`);
      await Promise.all([loadUsers(), loadTeachers()]);
      setForm(f => ({
        teacher_id: "",
        username: "",
        email: "",
        phone: "",
        role: "Teacher",
        password: "",
        is_active: true,
        must_change_password: true,
      }));
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Create failed";
      console.error(msg);
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  // 🔑 NEW: reset password
  const handleResetPassword = async (id) => {
    if (!window.confirm("Re-generate a new password for this user?")) return;
    try {
      const res = await AxiosInstance.patch(`admin/users/${id}/reset-password/`);
      const tempPw = res.data?.temp_password;
      alert(`Password reset successful! New temporary password: ${tempPw}`);
      await loadUsers();
    } catch (err) {
      console.error("Reset password failed", err);
      alert("Reset password failed. Check console.");
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-semibold">Create Teacher/Student</h2>

      {/* Create user form */}
      <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 bg-white p-4 rounded shadow">
        <div className="col-span-1">
          <label className="block text-sm mb-1">Teacher</label>
          <select
            value={form.teacher_id}
            onChange={onTeacherChange}
            className="w-full border rounded p-2"
            required
          >
            <option value="">-- Select teacher --</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>
                {t.full_name} {t.designation ? `– ${t.designation}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            value={form.username}
            onChange={(e) => onChange("username", e.target.value)}
            className="w-full border rounded p-2"
            placeholder="username"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Role</label>
          <select
            value={form.role}
            onChange={(e) => onChange("role", e.target.value)}
            className="w-full border rounded p-2"
          >
            <option>Teacher</option>
            <option>Student</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            className="w-full border rounded p-2"
            placeholder="example@email.com"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className="w-full border rounded p-2"
            placeholder="01XXXXXXXXX"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password (optional)</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => onChange("password", e.target.value)}
            className="w-full border rounded p-2"
            placeholder="leave blank to auto-generate"
          />
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.must_change_password}
              onChange={(e) => onChange("must_change_password", e.target.checked)}
            />
            <span>Must change password</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => onChange("is_active", e.target.checked)}
            />
            <span>Active</span>
          </label>
        </div>
        <div className="col-span-full">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded"
          >
            Create
          </button>
        </div>
      </form>

      {/* Users list with reset button */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-100">
              <th className="px-4 py-2">Username</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2">Must change PW</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.username}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2">{u.email || "-"}</td>
                <td className="px-4 py-2">{u.phone || "-"}</td>
                <td className="px-4 py-2">{String(u.is_active)}</td>
                <td className="px-4 py-2">{String(u.must_change_password)}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleResetPassword(u.id)}
                    className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Re-generate PW
                  </button>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr><td className="px-4 py-6 text-slate-500" colSpan={7}>No users</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
