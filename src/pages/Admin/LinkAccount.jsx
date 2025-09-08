import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

/* ===================== Axios client (no provider import) ===================== */
const API_BASE = (import.meta?.env?.VITE_API_BASE || "http://127.0.0.1:8000/api/")
  .replace(/\/+$/, "/"); // ensure single trailing slash

function getCookie(name) {
  if (typeof document === "undefined") return "";
  for (const c of (document.cookie || "").split("; ")) {
    const [k, v] = c.split("=");
    if (k === name) return decodeURIComponent(v);
  }
  return "";
}

const AxiosInstance = axios.create({
  baseURL: API_BASE,        // -> http://127.0.0.1:8000/api/
  withCredentials: true,    // send session cookie if using SessionAuth
  headers: { Accept: "application/json" },
});

// Attach token (if you use JWT) + CSRF (if you use SessionAuth)
AxiosInstance.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("access") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("access");

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
  }
  if (!config.headers["X-CSRFToken"]) {
    const csrftoken = getCookie("csrftoken");
    if (csrftoken) config.headers["X-CSRFToken"] = csrftoken;
  }
  return config;
});

/* ====================== Endpoints (edit if your paths differ) ====================== */
const TEACHERS_LIST_URL = "people/teachers/";                 // GET list
const USERS_LIST_PRIMARY = "authentication/users/";           // GET list (admin)
const USERS_LIST_FALLBACK = "users/";                         // fallback path
const LINK_URL = (teacherId) => `people/teachers/${teacherId}/link-user/`; // POST {user_id}

/* ============================== UI helpers ============================== */
function fuzzyIncludes(hay, needle) {
  if (!needle) return true;
  return (hay || "").toLowerCase().includes(needle.toLowerCase());
}
function displayTeacher(t) {
  const name = t.full_name || t.name || t.display_name || t.username || "(no name)";
  const sub = t.email || t.employee_id || t.code || "";
  return { name, sub };
}
function displayUser(u) {
  const name = u.username || u.name || u.display_name || u.email || `User #${u.id}`;
  const sub = u.email || u.role || "";
  return { name, sub };
}
function ItemRow({ active, title, subtitle, onClick }) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2 rounded-lg border transition hover:bg-base-200 ${
          active ? "border-primary bg-primary/10" : "border-base-300"
        }`}
      >
        <div className="font-medium truncate">{title}</div>
        {subtitle ? <div className="text-xs opacity-70 truncate">{subtitle}</div> : null}
      </button>
    </li>
  );
}

/* ============================== Main component ============================== */
export default function LinkAccount() {
  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]);

  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [linking, setLinking] = useState(false);

  const [teacherQuery, setTeacherQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");

  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [message, setMessage] = useState(null); // {type:'success'|'error', text:string}

  // Load UNLINKED teachers (fetch all, then filter client-side)
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingTeachers(true);
      try {
        const res = await AxiosInstance.get(TEACHERS_LIST_URL, { params: { page_size: 1000 } });
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        const unlinked = list.filter(
          (t) => t.user === null || t.user_id === null || (t.user === undefined && t.user_id === undefined)
        );
        if (!cancel) setTeachers(unlinked);
      } catch (e) {
        if (!cancel) setMessage({ type: "error", text: e?.response?.data?.detail || e.message });
      } finally {
        if (!cancel) setLoadingTeachers(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // Load UNLINKED teacher users (try primary path, then fallback)
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingUsers(true);
      try {
        let res;
        try {
          res = await AxiosInstance.get(USERS_LIST_PRIMARY, { params: { page_size: 1000 } });
        } catch (e) {
          // fallback if the primary path doesn't exist
          res = await AxiosInstance.get(USERS_LIST_FALLBACK, { params: { page_size: 1000 } });
        }
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        const teacherUsers = list.filter((u) => {
          const roleOk =
            (u.role && String(u.role).toLowerCase() === "teacher") ||
            (u.roles && u.roles.includes("Teacher")) ||
            (u.is_teacher === true);
          const notLinked =
            u.teacher === null || u.teacher_id === null || u.teacher_profile === null ||
            (u.teacher_id === undefined && u.teacher === undefined && u.teacher_profile === undefined);
          return roleOk && notLinked;
        });
        if (!cancel) setUsers(teacherUsers);
      } catch (e) {
        if (!cancel) setMessage({ type: "error", text: e?.response?.data?.detail || e.message });
      } finally {
        if (!cancel) setLoadingUsers(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const filteredTeachers = useMemo(
    () => teachers.filter((t) => {
      const { name, sub } = displayTeacher(t);
      return fuzzyIncludes(name, teacherQuery) || fuzzyIncludes(sub, teacherQuery);
    }),
    [teachers, teacherQuery]
  );

  const filteredUsers = useMemo(
    () => users.filter((u) => {
      const { name, sub } = displayUser(u);
      return fuzzyIncludes(name, userQuery) || fuzzyIncludes(sub, userQuery);
    }),
    [users, userQuery]
  );

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId) || null;
  const selectedUser = users.find((u) => u.id === selectedUserId) || null;
  const canLink = !!(selectedTeacher && selectedUser);

  async function handleLink() {
    if (!canLink) return;
    try {
      setLinking(true);
      setMessage(null);
      await AxiosInstance.post(LINK_URL(selectedTeacher.id), { user_id: selectedUser.id });
      setMessage({
        type: "success",
        text: `Linked ${displayTeacher(selectedTeacher).name} ↔ ${displayUser(selectedUser).name}`,
      });
      setTeachers((prev) => prev.filter((t) => t.id !== selectedTeacher.id));
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setSelectedTeacherId(null);
      setSelectedUserId(null);
    } catch (e) {
      setMessage({ type: "error", text: e?.response?.data?.detail || e.message });
    } finally {
      setLinking(false);
    }
  }

  function reloadTeachers() {
    setLoadingTeachers(true);
    AxiosInstance.get(TEACHERS_LIST_URL, { params: { page_size: 1000 } })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        const unlinked = list.filter(
          (t) => t.user === null || t.user_id === null || (t.user === undefined && t.user_id === undefined)
        );
        setTeachers(unlinked);
      })
      .catch((e) => setMessage({ type: "error", text: e?.response?.data?.detail || e.message }))
      .finally(() => setLoadingTeachers(false));
  }

  function reloadUsers() {
    setLoadingUsers(true);
    (async () => {
      try {
        let res;
        try {
          res = await AxiosInstance.get(USERS_LIST_PRIMARY, { params: { page_size: 1000 } });
        } catch (e) {
          res = await AxiosInstance.get(USERS_LIST_FALLBACK, { params: { page_size: 1000 } });
        }
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        const teacherUsers = list.filter((u) => {
          const roleOk =
            (u.role && String(u.role).toLowerCase() === "teacher") ||
            (u.roles && u.roles.includes("Teacher")) ||
            (u.is_teacher === true);
          const notLinked =
            u.teacher === null || u.teacher_id === null || u.teacher_profile === null ||
            (u.teacher_id === undefined && u.teacher === undefined && u.teacher_profile === undefined);
          return roleOk && notLinked;
        });
        setUsers(teacherUsers);
      } catch (e) {
        setMessage({ type: "error", text: e?.response?.data?.detail || e.message });
      } finally {
        setLoadingUsers(false);
      }
    })();
  }

  return (
    <div className="p-4 md:p-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Link Teacher ↔ User</h1>
          <p className="text-sm opacity-70">Pick an unlinked teacher and a teacher user, then click Link.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={reloadTeachers} disabled={loadingTeachers}>
            {loadingTeachers ? "Loading…" : "Reload Teachers"}
          </button>
          <button className="btn btn-outline" onClick={reloadUsers} disabled={loadingUsers}>
            {loadingUsers ? "Loading…" : "Reload Users"}
          </button>
          <button className="btn btn-primary" onClick={handleLink} disabled={!canLink || linking}>
            {linking ? "Linking…" : "Link"}
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
          <span>{message.text}</span>
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
              placeholder="Search by name/email/code"
              value={teacherQuery}
              onChange={(e) => setTeacherQuery(e.target.value)}
            />
            <div className="divider my-2" />
            {loadingTeachers ? (
              <div className="text-sm opacity-70">Loading…</div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-sm opacity-70">No unlinked teachers found.</div>
            ) : (
              <ul className="menu bg-base-100 rounded-box max-h-[420px] overflow-auto">
                {filteredTeachers.map((t) => {
                  const { name, sub } = displayTeacher(t);
                  const active = selectedTeacherId === t.id;
                  return (
                    <ItemRow
                      key={t.id}
                      active={active}
                      title={name}
                      subtitle={sub}
                      onClick={() => setSelectedTeacherId(active ? null : t.id)}
                    />
                  );
                })}
              </ul>
            )}
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
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
            />
            <div className="divider my-2" />
            {loadingUsers ? (
              <div className="text-sm opacity-70">Loading…</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-sm opacity-70">No unlinked teacher users found.</div>
            ) : (
              <ul className="menu bg-base-100 rounded-box max-h-[420px] overflow-auto">
                {filteredUsers.map((u) => {
                  const { name, sub } = displayUser(u);
                  const active = selectedUserId === u.id;
                  return (
                    <ItemRow
                      key={u.id}
                      active={active}
                      title={name}
                      subtitle={sub}
                      onClick={() => setSelectedUserId(active ? null : u.id)}
                    />
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky action */}
      <div className="md:hidden fixed inset-x-0 bottom-4 flex justify-center">
        <button className="btn btn-primary shadow-lg" onClick={handleLink} disabled={!canLink || linking}>
          {linking ? "Linking…" : "Link selected"}
        </button>
      </div>
    </div>
  );
}
