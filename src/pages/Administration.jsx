import React, { useEffect, useState } from "react";
import AxiosInstance from "../components/AxiosInstance";
import defaultImage from "../images/person.PNG";
import bgImage from "../images/bgs.jpg";

export default function Administration() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setErr("");
      const response = await AxiosInstance.get("committee-members/");
      setMembers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching committee members:", error);
      setErr("Failed to load administration information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <section id="administration" className="relative w-full">
      {/* Background with overlay */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 -z-10 bg-white/80 backdrop-blur-sm" />

      {/* Header */}
      <div className="px-6 md:px-10 pt-10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a3b68]/10 text-[#0a3b68] text-xs font-semibold">
            Dedicated Leadership
          </div>
          <h2 className="mt-3 text-2xl md:text-3xl font-extrabold text-[#0a3b68] tracking-tight">
            College Administration
          </h2>
          <div className="mx-auto mt-3 h-1 w-24 rounded-full bg-[#0a3b68]/30" />
        </div>
      </div>

      <div className="px-6 md:px-10 pb-12 pt-6">
        <div className="max-w-7xl mx-auto">
          {/* Loading / Error / Empty */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-4 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 bg-gray-200 rounded" />
                      <div className="h-3 w-1/3 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : err ? (
            <p className="text-center text-red-600 bg-white/80 border border-red-100 rounded-xl py-6">
              {err}
            </p>
          ) : members.length === 0 ? (
            <div className="text-center text-gray-700 bg-white/80 border border-gray-200 rounded-xl py-10">
              No data found.
            </div>
          ) : (
            <>
              {/* Member Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {members.map((member, idx) => (
                  <AdminCard key={member.id || idx} member={member} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function AdminCard({ member }) {
  const name = member?.full_name || "—";
  const role = member?.role || "—";
  const photo = member?.photo || defaultImage;

  return (
    <div className="group relative rounded-2xl border border-gray-200 bg-white/90 backdrop-blur shadow-sm hover:shadow-lg hover:border-[#0a3b68]/40 transition p-4">
      <div className="flex items-center md:items-start gap-4 md:gap-5">
        {/* Left: Photo */}
        <img
          src={photo}
          alt={name}
          className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover ring-2 ring-[#0a3b68]/15 group-hover:ring-[#0a3b68]/35 transition"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = defaultImage;
          }}
        />

        {/* Right: Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">
            {name}
          </h3>

          <div className="mt-1">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#0a3b68]/10 text-[#0a3b68] text-xs font-medium">
              {role}
            </span>
          </div>

          {/* Decorative divider */}
          <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      </div>
    </div>
  );
}
