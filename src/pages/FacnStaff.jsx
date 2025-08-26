import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AxiosInstance from "../components/AxiosInstance";
import { FiEdit3 } from "react-icons/fi";
import { RiDeleteBin6Fill } from "react-icons/ri";

export default function FacnStaff() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get("faculty/");
      setTeachers(response.data);
    } catch (error) {
      console.error("Error fetching faculty:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("আপনি কি মুছে ফেলতে চান?")) return;

    try {
      await AxiosInstance.delete(`faculty/${id}/`);
      fetchFaculty(); // re-fetch data
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="bg-gray-100 px-3 py-8">
      <h1 className="text-center text-2xl font-bold text-[#0A3B68] mb-2">
        নামেজ সরদার মাধ্যমিক বিদ্য়ালয়, সদর, যশোর
      </h1>
      <h2 className="text-center text-xl mb-2">
        শিক্ষক ও কর্মচারী তালিকা ২০২৪
      </h2>

      {loading ? (
        <p className="text-center text-lg">লোড হচ্ছে...</p>
      ) : (
        <>
          <TeacherTable teachers={teachers} handleDelete={handleDelete} />
        </>
      )}
    </div>
  );
}

function TeacherTable({ teachers, handleDelete }) {
  return (
    <div className="overflow-x-auto shadow bg-white">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-[#0A3B68] text-white">
            <th className="px-2 py-1  border border-slate-400">ক্রমিক</th>
            <th className="px-2 py-1  border border-slate-400">ছবি</th>
            <th className="px-2 py-1  border border-slate-400 text-left">নাম</th>
            <th className="px-2 py-1  border border-slate-400">পদবী</th>
            <th className="px-2 py-1  border border-slate-400">বিষয়</th>
            <th className="px-2 py-1  border border-slate-400">ফোন</th>
            <th className="px-2 py-1  border border-slate-400">হোয়াটসঅ্যাপ</th>
            <th className="px-2 py-1  border border-slate-400">ইমেইল</th>
            <th className="px-2 py-1  border border-slate-400 text-center">ঠিকানা</th>
            <th className="px-2 py-1  border border-slate-400 text-center">অ্যাকশান</th>
          </tr>
        </thead>
        <tbody>
          {teachers.length > 0 ? (
            teachers.map((t, index) => (
              <tr key={t.id || index} className="even:bg-gray-50 text-center">
                <td className="px-2 py-1  border border-slate-400 text-center">{index + 1}</td>
                <td className="px-2 py-1  border border-slate-400 flex items-center justify-center">
                  {t.image ? (
                    <img
                      src={t.image}
                      alt={t.name}
                      className="w-10  object-cover rounded-full"
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-2 py-1  border border-slate-400 text-center">{t.name}</td>
                <td className="px-2 py-1  border border-slate-400 text-center">{t.designation}</td>
                <td className="px-2 py-1  border border-slate-400 text-center">{t.subject}</td>
                <td className="px-2 py-1  border border-slate-400 text-center">{t.phone}</td>
                <td className="px-2 py-1  border border-slate-400 text-center">{t.whatsapp}</td>
                <td className="px-2 py-1  border border-slate-400 text-center">{t.email}</td>
                <td className="px-2 py-1  border border-slate-400 text-center">{t.address}</td>
                <td className="px-2 py-1  border border-slate-400 text-center">
                  <div className="flex items-center justify-center gap-3 text-lg">
                    <Link
                      to={`/dashboard/addfaculty/${t.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiEdit3 />
                    </Link>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <RiDeleteBin6Fill />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="10"
                className="px-3 py-4 text-center text-gray-500 border"
              >
                কোনো তথ্য পাওয়া যায়নি
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
