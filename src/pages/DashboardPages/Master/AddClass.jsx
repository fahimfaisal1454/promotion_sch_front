import React, { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import AxiosInstance from "../../../components/AxiosInstance"
export default function ClassManager() {
  const [className, setClassName] = useState("");
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const [search, setSearch] = useState("");

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await AxiosInstance.get("classes/");
      setClasses(res.data);
    } catch (err) {
      console.error(err);
      toast.error("❌ তালিকা লোড করতে ব্যর্থ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: className.trim() };
      if (!payload.name) {
        toast.error("⚠️ শ্রেণির নাম দিন");
        return;
      }
      const res = await AxiosInstance.post("classes/", payload);
      setClasses((prev) => [res.data, ...prev]);
      setClassName("");
      toast.success("✅ শ্রেণি সফলভাবে যোগ করা হয়েছে!");
    } catch (error) {
      console.error(error);
      toast.error("❌ শ্রেণি যোগ করতে ব্যর্থ হয়েছে");
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (id) => {
    try {
      const name = editingName.trim();
      if (!name) {
        toast.error("⚠️ শ্রেণির নাম খালি রাখা যাবে না");
        return;
      }
      const res = await AxiosInstance.patch(`classes/${id}/`, { name });
      setClasses((prev) =>
        prev.map((c) => (c.id === id ? res.data : c))
      );
      toast.success("✅ আপডেট সম্পন্ন");
      cancelEdit();
    } catch (err) {
      console.error(err);
      toast.error("❌ আপডেট করতে ব্যর্থ");
    }
  };

  const deleteClass = async (id) => {
    const ok = confirm("আপনি কি নিশ্চিত? এই শ্রেণিটি মুছে যাবে।");
    if (!ok) return;
    try {
      await AxiosInstance.delete(`classes/${id}/`);
      setClasses((prev) => prev.filter((c) => c.id !== id));
      toast.success("🗑️ শ্রেণি মুছে ফেলা হয়েছে");
    } catch (err) {
      console.error(err);
      toast.error("❌ মুছতে ব্যর্থ");
    }
  };

  const filtered = classes.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white text-black shadow-lg rounded-lg border">
      <Toaster position="top-center" />
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
        শ্রেণি ম্যানেজমেন্ট
      </h2>

      {/* Add form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6"
      >
        <div className="md:col-span-2">
          <label className="block mb-1 text-gray-700 font-medium">
            শ্রেণির নাম
          </label>
          <input
            type="text"
            placeholder="যেমনঃ One, Two, Three"
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-black"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-semibold transition duration-200"
          >
            সংরক্ষণ করুন
          </button>
        </div>
      </form>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="খুঁজুন..."
          className="w-full md:w-64 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-black"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm bg-white text-black">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left w-16">#</th>
              <th className="border px-3 py-2 text-left">শ্রেণির নাম</th>
              <th className="border px-3 py-2 text-center w-44">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="border px-3 py-3 text-center" colSpan={3}>
                  লোড হচ্ছে...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="border px-3 py-3 text-center" colSpan={3}>
                  কোন তথ্য পাওয়া যায়নি
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{idx + 1}</td>
                  <td className="border px-3 py-2">
                    {editingId === item.id ? (
                      <input
                        className="w-full border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-black"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{item.name}</span>
                    )}
                  </td>
                  <td className="border px-3 py-2">
                    {editingId === item.id ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 text-black"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => startEdit(item)}
                          className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteClass(item.id)}
                          className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
                        >
                          Delete
                        </button>
                      </div>
                    )}
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