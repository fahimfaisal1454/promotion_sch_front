// src/pages/Admin/LinkAccount.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

/* ===================== Axios (self-contained) ===================== */
const API_BASE = (import.meta?.env?.VITE_API_BASE || "http://127.0.0.1:8000/api/")
  .replace(/\/+$/, "/");

function getCookie(name) {
  if (typeof document === "undefined") return "";
  for (const c of (document.cookie || "").split("; ")) {
    const [k, v] = c.split("=");
    if (k === name) return decodeURIComponent(v);
  }
  return "";
}

const http = axios.create({
  baseURL: API_BASE,      // -> http://127.0.0.1:8000/api/
  withCredentials: true,  // send Django session cookie if you use SessionAuth
  headers: { Accept: "application/json" },
});

http.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("access") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("access");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }
  const csrftoken = getCookie("csrftoken");
  if (csrftoken && !config.headers["X-CSRFToken"]) config.headers["X-CSRFToken"] = csrftoken;
  return config;
});

/* ========================== Endpoints ========================== */
const UNLINKED_TEACHERS = "teachers/unlinked/";              // primary
const TEACHERS = "teachers/";                                // fallback with ?linked=false
const ADMIN_USERS = "admin/users/";                          // admin user list
const LINK_URL = (id) => `teachers/${id}/link-user/`;        // POST { user_id }

/* =========================== Helpers =========================== */
const takeList = (data) => (Array.isArray(data) ? data : data?.results || []);
const fuzzy = (hay, q) => (q ? String(hay || "").toLowerCase().includes(q.toLowerCase()) : true);

function ItemRow({ active, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border rounded-md mb-2 transition ${
        active ? "bg-blue-50 border-blue-300" : "hover:bg-base-200 border-base-300"
      }`}
    >
      <div className="font-medium truncate">{title || "(no name)"}</div>
      {subtitle ? <div className="text-xs opacity-70 truncate">{subtitle}</div> : null}
    </button>
  );
}

/* ======================== Main Component ======================== */
export default function LinkAccount() {
  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]);

  const [tQuery, setTQuery] = useState("");
  const [uQuery, setUQuery] = useState("");

  const [selTeacherId, setSelTeacherId] = useState(null);
  const [selUserId, setSelUserId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // {type:'success'|'error', text:string}

  // ---- Load unlinked teachers
  const reloadTeachers = async () => {
    setMsg(null);
    try {
      // Try dedicated endpoint first
      let res = await http.get(UNLINKED_TEACHERS, { params: { page_size: 1000 } });
      setTeachers(takeList(res.data));
    } catch (e) {
      // Fallback to filter: ?linked=false
      try {
        const res = await http.get(TEACHERS, { params: { linked: false, page_size: 1000 } });
        setTeachers(takeList(res.data));
      } catch (err) {
        setTeachers([]);
        setMsg({ type: "error", text: err?.response?.data?.detail || err.message });
      }
    }
  };

  // ---- Load teacher users via admin endpoint
  const reloadUsers = async () => {
    setMsg(null);
    try {
      const res = await http.get(ADMIN_USERS, { params: { role: "Teacher", page_size: 1000 } });
      setUsers(takeList(res.data));
    } catch (e) {
      setUsers([]);
      setMsg({ type: "error", text: e?.response?.data?.detail || e.message });
    }
  };

  // ---- Link selected teacher ↔ user
  const handleLink = async () => {
    if (!selTeacherId || !selUserId) return;
    setLoading(true);
    setMsg(null);
    try {
      await http.post(LINK_URL(selTeacherId), { user_id: selUserId });
      setMsg({ type: "success", text: "Linked successfully." });
      setSelTeacherId(null);
      setSelUserId(null);
      await Promise.all([reloadTeachers(), reloadUsers()]);
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.detail || e.message });
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    reloadTeachers();
    reloadUsers();
  }, []);

  const filteredTeachers = useMemo(() => {
    const q = tQuery.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) =>
      [t.full_name, t.contact_email, t.contact_phone, t.name]
        .filter(Boolean)
        .some((v) => fuzzy(v, q))
    );
  }, [teachers, tQuery]);

  const filteredUsers = useMemo(() => {
    const q = uQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.username, u.email].filter(Boolean).some((v) => fuzzy(v, q)));
  }, [users, uQuery]);

  const canLink = !!(selTeacherId && selUserId);

  return (
    <div className="p-4 md:p-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Link Teacher ↔ User</h1>
          <p className="text-sm opacity-70">Pick an unlinked teacher and a teacher user, then click Link.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm" onClick={reloadTeachers}>Reload Teachers</button>
          <button className="btn btn-outline btn-sm" onClick={reloadUsers}>Reload Users</button>
          <button className="btn btn-primary btn-sm" onClick={handleLink} disabled={!canLink || loading}>
            {loading ? "Linking…" : "Link"}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`alert ${msg.type === "error" ? "alert-error" : "alert-success"}`}>
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Teachers */}
        <div className="card bg-base-100 border">
          <div className="card-body gap-3">
            <div className="flex items-center gap-2">
              <h2 className="card-title">Unlinked Teachers</h2>
              <div className="badge badge-ghost">{teachers.length}</div>
            </div>
            <input
              className="input input-bordered w-full"
              placeholder="Search by name/email/phone"
              value={tQuery}
              onChange={(e) => setTQuery(e.target.value)}
            />
            <div className="divider my-2" />
            <div className="max-h-96 overflow-auto pr-1">
              {filteredTeachers.length === 0 ? (
                <div className="text-sm opacity-70">No unlinked teachers found.</div>
              ) : (
                filteredTeachers.map((t) => (
                  <ItemRow
                    key={t.id}
                    active={selTeacherId === t.id}
                    title={t.full_name || t.name}
                    subtitle={t.contact_email}
                    onClick={() => setSelTeacherId((p) => (p === t.id ? null : t.id))}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Users */}
        <div className="card bg-base-100 border">
          <div className="card-body gap-3">
            <div className="flex items-center gap-2">
              <h2 className="card-title">Unlinked Teacher Users</h2>
              <div className="badge badge-ghost">{users.length}</div>
            </div>
            <input
              className="input input-bordered w-full"
              placeholder="Search by username/email"
              value={uQuery}
              onChange={(e) => setUQuery(e.target.value)}
            />
            <div className="divider my-2" />
            <div className="max-h-96 overflow-auto pr-1">
              {filteredUsers.length === 0 ? (
                <div className="text-sm opacity-70">No users found.</div>
              ) : (
                filteredUsers.map((u) => (
                  <ItemRow
                    key={u.id}
                    active={selUserId === u.id}
                    title={u.username}
                    subtitle={u.email}
                    onClick={() => setSelUserId((p) => (p === u.id ? null : u.id))}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky action */}
      <div className="md:hidden fixed inset-x-0 bottom-4 flex justify-center">
        <button className="btn btn-primary shadow-lg" onClick={handleLink} disabled={!canLink || loading}>
          {loading ? "Linking…" : "Link selected"}
        </button>
      </div>
    </div>
  );
}
