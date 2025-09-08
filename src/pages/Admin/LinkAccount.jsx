import React, { useEffect, useMemo, useState } from "react";

// --- Minimal API client -----------------------------------------
const API = {
  async getUnlinkedTeachers(signal) {
    const res = await fetch("/api/teachers?unlinked=1", {
      signal,
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Failed to load teachers (${res.status})`);
    return res.json();
  },
  async getUnlinkedTeacherUsers(signal) {
    const res = await fetch("/api/users?role=teacher&unlinked=1", {
      signal,
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
    return res.json();
  },
  async linkTeacherUser(teacherId, userId) {
    const res = await fetch(`/api/teachers/${teacherId}/link-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) {
      let msg = "";
      try { msg = await res.text(); } catch {}
      throw new Error(msg || `Link failed (${res.status})`);
    }
    try { return await res.json(); } catch { return {}; }
  },
};

// --- Helpers ------------------------------------------------------
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

// --- Main component -----------------------------------------------
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

  const [message, setMessage] = useState(null); // {type: 'success'|'error', text: string}

  // Load unlinked Teachers
  useEffect(() => {
    const ac = new AbortController();
    setLoadingTeachers(true);
    API.getUnlinkedTeachers(ac.signal)
      .then((data) => setTeachers(Array.isArray(data) ? data : data.results || []))
      .catch((e) => setMessage({ type: "error", text: e.message }))
      .finally(() => setLoadingTeachers(false));
    return () => ac.abort();
  }, []);

  // Load unlinked Teacher Users
  useEffect(() => {
    const ac = new AbortController();
    setLoadingUsers(true);
    API.getUnlinkedTeacherUsers(ac.signal)
      .then((data) => setUsers(Array.isArray(data) ? data : data.results || []))
      .catch((e) => setMessage({ type: "error", text: e.message }))
      .finally(() => setLoadingUsers(false));
    return () => ac.abort();
  }, []);

  const filteredTeachers = useMemo(
    () =>
      teachers.filter((t) => {
        const { name, sub } = displayTeacher(t);
        return fuzzyIncludes(name, teacherQuery) || fuzzyIncludes(sub, teacherQuery);
      }),
    [teachers, teacherQuery]
  );
  const filteredUsers = useMemo(
    () =>
      users.filter((u) => {
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
      await API.linkTeacherUser(selectedTeacher.id, selectedUser.id);
      setMessage({
        type: "success",
        text: `Linked ${displayTeacher(selectedTeacher).name} ↔ ${displayUser(selectedUser).name}`,
      });
      setTeachers((prev) => prev.filter((t) => t.id !== selectedTeacher.id));
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setSelectedTeacherId(null);
      setSelectedUserId(null);
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setLinking(false);
    }
  }

  function refreshTeachers() {
    setLoadingTeachers(true);
    API.getUnlinkedTeachers()
      .then((data) => setTeachers(Array.isArray(data) ? data : data.results || []))
      .catch((e) => setMessage({ type: "error", text: e.message }))
      .finally(() => setLoadingTeachers(false));
  }
  function refreshUsers() {
    setLoadingUsers(true);
    API.getUnlinkedTeacherUsers()
      .then((data) => setUsers(Array.isArray(data) ? data : data.results || []))
      .catch((e) => setMessage({ type: "error", text: e.message }))
      .finally(() => setLoadingUsers(false));
  }

  return (
    <div className="p-4 md:p-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Link Teacher ↔ User</h1>
          <p className="text-sm opacity-70">Pick an unlinked teacher and a teacher user, then click Link.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={refreshTeachers} disabled={loadingTeachers}>
            {loadingTeachers ? "Loading…" : "Reload Teachers"}
          </button>
          <button className="btn btn-outline" onClick={refreshUsers} disabled={loadingUsers}>
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
