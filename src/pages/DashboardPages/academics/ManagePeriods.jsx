// src/pages/DashboardPages/academics/ManagePeriods.jsx
import { useEffect, useState } from "react";
import AxiosInstance from "../../../components/AxiosInstance";

const emptyForm = { name: "", order: "", start_time: "", end_time: "" };

export default function ManagePeriods() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await AxiosInstance.get("periods/"); // GET /api/periods/
      setRows(res.data || []);
    } catch (e) {
      console.error(e);
      setErr("Failed to load periods.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (!String(form.order).trim() || isNaN(Number(form.order))) return "Order must be a number";
    if (!form.start_time || !form.end_time) return "Start and end time are required";
    if (form.start_time >= form.end_time) return "Start time must be before end time";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }
    setErr("");
    try {
      if (editingId) {
        await AxiosInstance.patch(`periods/${editingId}/`, {
          name: form.name.trim(),
          order: Number(form.order),
          start_time: form.start_time,
          end_time: form.end_time,
        });
      } else {
        await AxiosInstance.post("periods/", {
          name: form.name.trim(),
          order: Number(form.order),
          start_time: form.start_time,
          end_time: form.end_time,
        });
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (e) {
      console.error(e);
      setErr("Save failed. Make sure order is unique and time range is valid.");
    }
  };

  const onEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      order: row.order,
      start_time: row.start_time,
      end_time: row.end_time,
    });
  };

  const onCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErr("");
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this period?")) return;
    try {
      await AxiosInstance.delete(`periods/${id}/`);
      load();
    } catch (e) {
      console.error(e);
      setErr("Delete failed.");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Manage Periods</h1>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-white p-3 rounded border">
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="Name (e.g., 1st)"
          className="input input-bordered"
          required
        />
        <input
          name="order"
          type="number"
          value={form.order}
          onChange={onChange}
          placeholder="Order (e.g., 1)"
          className="input input-bordered"
          required
        />
        <input
          name="start_time"
          type="time"
          value={form.start_time}
          onChange={onChange}
          className="input input-bordered"
          required
        />
        <input
          name="end_time"
          type="time"
          value={form.end_time}
          onChange={onChange}
          className="input input-bordered"
          required
        />
        <div className="flex gap-2">
          <button className="btn btn-success" type="submit">
            {editingId ? "Update" : "Add"}
          </button>
          {editingId && (
            <button className="btn" type="button" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {err && <div className="alert alert-error text-sm">{err}</div>}

      <div className="bg-white rounded border overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Name</th>
              <th>Start</th>
              <th>End</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5}>No periods yet.</td></tr>
            ) : (
              rows.map(r => (
                <tr key={r.id}>
                  <td>{r.order}</td>
                  <td>{r.name}</td>
                  <td>{r.start_time?.slice(0,5)}</td>
                  <td>{r.end_time?.slice(0,5)}</td>
                  <td className="text-right">
                    <button className="btn btn-xs mr-2" onClick={() => onEdit(r)}>Edit</button>
                    <button className="btn btn-xs btn-error" onClick={() => onDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
