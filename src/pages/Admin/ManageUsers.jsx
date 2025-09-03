import { useEffect, useState } from "react";
import AxiosInstance from "../../components/AxiosInstance";

export default function ManageUsers() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    username: "", email: "", role: "Teacher", phone: "",
    is_active: true, must_change_password: true, password: "" // optional
  });
  const [q, setQ] = useState(""); const [roleFilter, setRoleFilter] = useState("");
  const [justCreatedPw, setJustCreatedPw] = useState(null);

  const load = async () => {
    const sp = new URLSearchParams();
    if (q) sp.append("q", q);
    if (roleFilter) sp.append("role", roleFilter);
    const { data } = await AxiosInstance.get(`admin/users/?${sp.toString()}`);
    setRows(data?.results || data || []);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [q, roleFilter]);

  const createUser = async (e) => {
    e.preventDefault();
    setJustCreatedPw(null);
    const payload = { ...form };
    if (!payload.password) delete payload.password; // auto-generate server-side
    const { data } = await AxiosInstance.post("admin/users/", payload);
    setJustCreatedPw(data?.temp_password || null);
    setForm({ username:"", email:"", role:"Teacher", phone:"", is_active:true, must_change_password:true, password:"" });
    await load();
  };

  const resetPassword = async (id) => {
    const { data } = await AxiosInstance.patch(`admin/users/${id}/reset-password/`, {});
    alert(`Temp password: ${data?.temp_password}`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Create Teacher/Student</h2>

      <form onSubmit={createUser} className="bg-white border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Username"
                 value={form.username} onChange={e=>setForm(p=>({...p, username:e.target.value}))} required />
          <input className="border rounded px-3 py-2" placeholder="Email"
                 value={form.email} onChange={e=>setForm(p=>({...p, email:e.target.value}))} />
          <select className="border rounded px-3 py-2" value={form.role} onChange={e=>setForm(p=>({...p, role:e.target.value}))}>
            <option>Teacher</option><option>Student</option><option>Admin</option><option>General</option>
          </select>
          <input className="border rounded px-3 py-2" placeholder="Phone"
                 value={form.phone} onChange={e=>setForm(p=>({...p, phone:e.target.value}))} />
          <input className="border rounded px-3 py-2" placeholder="Temp password (optional)"
                 value={form.password} onChange={e=>setForm(p=>({...p, password:e.target.value}))} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active}
                   onChange={e=>setForm(p=>({...p, is_active:e.target.checked}))} /> Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.must_change_password}
                   onChange={e=>setForm(p=>({...p, must_change_password:e.target.checked}))} />
            Must change password
          </label>
        </div>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-md">Create</button>
        {justCreatedPw && (
          <p className="text-sm text-emerald-700 mt-2">
            Temp password: <b>{justCreatedPw}</b> (share with user)
          </p>
        )}
      </form>

      <div className="flex gap-3">
        <input className="border rounded px-3 py-2" placeholder="Search username" value={q} onChange={e=>setQ(e.target.value)} />
        <select className="border rounded px-3 py-2" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
          <option value="">All roles</option><option>Teacher</option><option>Student</option><option>Admin</option><option>General</option>
        </select>
      </div>

      <div className="bg-white border rounded-xl">
        <div className="grid grid-cols-7 gap-3 p-3 text-sm font-medium bg-slate-50 border-b">
          <div>Username</div><div>Email</div><div>Role</div><div>Phone</div><div>Active</div><div>Must change PW</div><div>Actions</div>
        </div>
        {rows?.length ? rows.map(u=>(
          <div key={u.id} className="grid grid-cols-7 gap-3 p-3 text-sm border-b last:border-b-0">
            <div>{u.username}</div><div>{u.email || "-"}</div><div>{u.role}</div>
            <div>{u.phone || "-"}</div><div>{String(u.is_active)}</div><div>{String(u.must_change_password)}</div>
            <div className="space-x-2">
              <button className="px-2 py-1 border rounded" onClick={()=>resetPassword(u.id)}>Reset PW</button>
            </div>
          </div>
        )) : <div className="p-4 text-sm text-slate-500">No users found.</div>}
      </div>
    </div>
  );
}
