import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import AxiosInstance from "../../components/AxiosInstance";

const LOGIN_URL =
  import.meta?.env?.VITE_LOGIN_URL || `${window.location.origin}/login`;

export default function ManageUsers() {
  const location = useLocation();
  const preselectTeacherId = location.state?.teacherId || null;
  const preselectStudentId = location.state?.studentId || null;

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [updatingActive, setUpdatingActive] = useState({}); // { [id]: true }

  const [form, setForm] = useState({
    role: "Teacher", // Teacher | Student
    person_id: "", // teacher.id or student.id
    username: "",
    email: "",
    phone: "",
    password: "",
    is_active: true,
    must_change_password: true,
  });

  // ---------- helpers ----------
  const currentList = useMemo(
    () => (form.role === "Teacher" ? teachers : students),
    [form.role, teachers, students]
  );

  const onChange = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => {
      const fields = [
        u.username,
        u.email,
        u.phone,
        `${u.first_name || ""} ${u.last_name || ""}`,
      ];
      return fields.some((f) =>
        String(f || "").toLowerCase().includes(term)
      );
    });
  }, [users, search]);

  // ---------- loaders ----------
  const loadTeachers = async () => {
    const res = await AxiosInstance.get("teachers/?linked=false");
    setTeachers(res.data || []);
  };

  const loadStudents = async () => {
    const res = await AxiosInstance.get("students/?linked=false");
    setStudents(res.data || []);
  };

  const loadUsers = async (role = form.role) => {
    const res = await AxiosInstance.get(
      `admin/users/?role=${encodeURIComponent(role)}`
    );
    setUsers(res.data || []);
  };

  // initial loads
  useEffect(() => {
    Promise.all([loadTeachers(), loadStudents(), loadUsers("Teacher")]).catch(
      console.error
    );
  }, []);

  // when role changes, refresh user list for that role & clear selection/password
  useEffect(() => {
    setForm((f) => ({
      ...f,
      person_id: "",
      username: "",
      email: "",
      phone: "",
      password: "",
    }));
    loadUsers(form.role).catch(console.error);
  }, [form.role]);

  // preselect (teacher)
  useEffect(() => {
    if (teachers.length && preselectTeacherId && form.role === "Teacher") {
      const t = teachers.find((x) => Number(x.id) === Number(preselectTeacherId));
      if (t) {
        setForm((f) => ({
          ...f,
          person_id: t.id,
          username: (t.full_name || "").toLowerCase().replace(/\s+/g, ""),
          email: t.contact_email || "",
          phone: t.contact_phone || "",
        }));
      }
    }
  }, [preselectTeacherId, teachers, form.role]);

  // preselect (student)
  useEffect(() => {
    if (students.length && preselectStudentId && form.role === "Student") {
      const s = students.find((x) => Number(x.id) === Number(preselectStudentId));
      if (s) {
        setForm((f) => ({
          ...f,
          person_id: s.id,
          username: (s.full_name || "").toLowerCase().replace(/\s+/g, ""),
          email: s.contact_email || "",
          phone: s.contact_phone || "",
        }));
      }
    }
  }, [preselectStudentId, students, form.role]);

  const onPersonChange = (e) => {
    const id = e.target.value;
    const list = currentList;
    const p = list.find((x) => String(x.id) === String(id));
    setForm((prev) => ({
      ...prev,
      person_id: id,
      username: p ? (p.full_name || "").toLowerCase().replace(/\s+/g, "") : "",
      email: p?.contact_email || "",
      phone: p?.contact_phone || "",
    }));
  };

  // ---------- actions ----------
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.person_id) return alert(`Select a ${form.role.toLowerCase()} first.`);
    if (!form.username) return alert("Username is required.");
    try {
      // 1) create the user
      const payload = {
        username: form.username,
        email: form.email,
        phone: form.phone,
        role: form.role,
        is_active: form.is_active,
        must_change_password: form.must_change_password,
      };
      if (form.password) payload.password = form.password;

      const res = await AxiosInstance.post("admin/users/", payload);
      const userId = res?.data?.id;
      const tempPw = res?.data?.temp_password;

      // 2) link the user to the selected teacher OR student
      const linkUrl =
        form.role === "Teacher"
          ? `teachers/${form.person_id}/link-user/`
          : `students/${form.person_id}/link-user/`;
      await AxiosInstance.post(linkUrl, { user_id: userId });

      alert(
        `${form.role} user created & linked!${
          tempPw ? ` Temp password: ${tempPw}` : ""
        }`
      );

      // reload lists (remove the linked person from dropdown)
      await Promise.all([loadUsers(form.role), loadTeachers(), loadStudents()]);
      setForm((f) => ({
        role: f.role,
        person_id: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        is_active: true,
        must_change_password: true,
      }));
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Create/link failed";
      console.error(msg);
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  // Reset password -> server returns temp_password
  const handleResetPassword = async (id) => {
    if (!window.confirm("Re-generate a new password for this user?")) return;
    try {
      const res = await AxiosInstance.patch(`admin/users/${id}/reset-password/`);
      const tempPw = res.data?.temp_password;
      alert(`Password reset successful! New temporary password: ${tempPw}`);
      await loadUsers(form.role);
    } catch (err) {
      console.error("Reset password failed", err);
      alert("Reset password failed. Check console.");
    }
  };

  // Toggle Active checkbox
  const handleToggleActive = async (user) => {
    const next = !user.is_active;
    if (
      user.is_active &&
      !window.confirm(
        "Deactivate this user? They will be unable to log in until re-activated."
      )
    ) {
      return;
    }
    setUpdatingActive((m) => ({ ...m, [user.id]: true }));
    try {
      await AxiosInstance.patch(`admin/users/${user.id}/`, { is_active: next });
      // update locally
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: next } : u))
      );
    } catch (err) {
      console.error("Active toggle failed", err);
      alert("Failed to update active status.");
    } finally {
      setUpdatingActive((m) => {
        const n = { ...m };
        delete n[user.id];
        return n;
      });
    }
  };

  // Optional: copy login link helper
  const handleCopyLogin = async () => {
    try {
      await navigator.clipboard.writeText(LOGIN_URL);
      alert(`Login link copied:\n${LOGIN_URL}`);
    } catch {
      alert(`Login link: ${LOGIN_URL}`);
    }
  };

  // ---------- UI ----------
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-2xl font-semibold">Create Teacher/Student</h2>
        <button
          onClick={handleCopyLogin}
          className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded"
          type="button"
          title="Copy login page URL"
        >
          Copy login link
        </button>
      </div>

      {/* Create user form */}
      <form
        onSubmit={handleCreate}
        className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 bg-white p-4 rounded shadow"
      >
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

        <div className="col-span-1">
          <label className="block text-sm mb-1">{form.role}</label>
          <select
            value={form.person_id}
            onChange={onPersonChange}
            className="w-full border rounded p-2"
            required
          >
            <option value="">
              -- Select {form.role.toLowerCase()} --
            </option>
            {currentList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
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
              onChange={(e) =>
                onChange("must_change_password", e.target.checked)
              }
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

      {/* Users list controls */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">
          {form.role} Users ({filteredUsers.length})
        </h3>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded p-2 w-64"
            placeholder="Search username/email/phone"
          />
          <button
            type="button"
            onClick={() => setSearch("")}
            className="px-3 py-2 rounded border"
            title="Clear search"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => loadUsers(form.role)}
            className="px-3 py-2 rounded border"
            title="Refresh list"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Users list */}
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
            {filteredUsers.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.username}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2">{u.email || "-"}</td>
                <td className="px-4 py-2">{u.phone || "-"}</td>

                {/* Active = checkbox toggle */}
                <td className="px-4 py-2">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!u.is_active}
                      onChange={() => handleToggleActive(u)}
                      disabled={!!updatingActive[u.id]}
                    />
                    <span className="text-sm text-slate-600">
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </label>
                </td>

                <td className="px-4 py-2">{String(u.must_change_password)}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleResetPassword(u.id)}
                    className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                    type="button"
                  >
                    Re-generate PW
                  </button>
                </td>
              </tr>
            ))}
            {!filteredUsers.length && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={7}>
                  {search ? "No users match your search." : "No users"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
