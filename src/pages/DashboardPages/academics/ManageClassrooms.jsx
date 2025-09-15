// src/pages/DashboardPages/academics/ManageClassrooms.jsx
import { useEffect, useState } from "react";
import AxiosInstance from "../../../components/AxiosInstance";

const empty = { name: "", capacity: "" };

export default function ManageClassrooms() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await AxiosInstance.get("rooms/"); // /api/rooms/
      setRows(res.data || []);
    } catch (e) {
      console.error(e);
      setErr("Failed to load classrooms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (form.capacity && Number(form.capacity) < 0) return "Capacity must be ≥ 0";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }
    setErr("");
    const payload = {
      name: form.name.trim(),
      capacity: form.capacity ? Number(form.capacity) : null,
    };
    try {
      if (editingId) {
        await AxiosInstance.patch(`rooms/${editingId}/`, payload);
      } else {
        await AxiosInstance.post("rooms/", payload);
      }
      setForm(empty);
      setEditingId(null);
      load();
    } catch (e) {
      console.error(e);
      setErr("Save failed. (Is the name unique?)");
    }
  };

  const onEdit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name ?? "", capacity: row.capacity ?? "" });
  };

  const onCancel = () => { setEditingId(null); setForm(empty); setErr(""); };

  const onDelete = async (id) => {
    if (!confirm("Delete this classroom?")) return;
    try {
      await AxiosInstance.delete(`rooms/${id}/`);
      load();
    } catch (e) {
      console.error(e);
      setErr("Delete failed.");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Manage Classrooms</h1>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-white p-3 rounded border">
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="Room name (e.g., 101, Lab A)"
          className="input input-bordered"
          required
        />
        <input
          name="capacity"
          type="number"
          value={form.capacity}
          onChange={onChange}
          placeholder="Capacity (optional)"
          className="input input-bordered"
        />
        <div className="flex gap-2">
          <button className="btn btn-success" type="submit">
            {editingId ? "Update" : "Add"}
          </button>
          {editingId && <button className="btn" type="button" onClick={onCancel}>Cancel</button>}
        </div>
      </form>

      {err && <div className="alert alert-error text-sm">{err}</div>}

      <div className="bg-white rounded border overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Capacity</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3}>No classrooms yet.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.capacity ?? "—"}</td>
                <td className="text-right">
                  <button className="btn btn-xs mr-2" onClick={() => onEdit(r)}>Edit</button>
                  <button className="btn btn-xs btn-error" onClick={() => onDelete(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
