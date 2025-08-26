import React, { useState, useEffect } from "react";
import AxiosInstance from "../../../components/AxiosInstance";
import { Toaster, toast } from "react-hot-toast";

const ContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await AxiosInstance.get("contacts/");
      const sortedContacts = response.data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setContacts(sortedContacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Contacts data load failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("আপনি কি নিশ্চিতভাবে এই বার্তাটি মুছে ফেলতে চান?");
    if (!confirmDelete) return;

    try {
      await AxiosInstance.delete(`contacts/${id}/`);
      setContacts((prev) => prev.filter((contact) => contact.id !== id));
      toast.success("বার্তাটি মুছে ফেলা হয়েছে");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("বার্তা মুছতে সমস্যা হয়েছে");
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContacts = contacts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(contacts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const showFullMessage = (message) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Toaster position="top-center" />

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Contact Messages
      </h2>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No contact messages found
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-violet-500">
                <tr>
                  <th className="px-6 py-3 text-left text-md font-semibold text-white uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-md font-semibold text-white uppercase tracking-wider">তারিখ</th>
                  <th className="px-6 py-3 text-left text-md font-semibold text-white uppercase tracking-wider">নাম</th>
                  <th className="px-6 py-3 text-left text-md font-semibold text-white uppercase tracking-wider">ইমেইল</th>
                  <th className="px-6 py-3 text-left text-md font-semibold text-white uppercase tracking-wider">ফোন</th>
                  <th className="px-6 py-3 text-left text-md font-semibold text-white uppercase tracking-wider">ঠিকানা</th>
                  <th className="px-6 py-3 text-left text-md font-semibold text-white uppercase tracking-wider">বার্তা</th>
                  <th className="px-6 py-3 text-left text-md font-semibold text-white uppercase tracking-wider">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentContacts.map((contact, index) => (
                  <tr key={contact.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(contact.date || contact.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contact.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.email || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.phone || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.address || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="line-clamp-1">{contact.message}</div>
                      {contact.message.length > 50 && (
                        <button
                          onClick={() => showFullMessage(contact.message)}
                          className="text-violet-600 hover:text-violet-800 text-xs mt-1"
                        >
                          বিস্তারিত
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        🗑️ মুছুন
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {contacts.length > itemsPerPage && (
            <div className="flex justify-center mt-4">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`px-3 py-1 border-t border-b border-gray-300 bg-white text-sm font-medium ${
                      currentPage === number
                        ? "text-violet-600 bg-violet-50"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {number}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          )}

          {/* Full Message Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-800">Full Message</h3>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-4 text-gray-700 whitespace-pre-wrap">{selectedMessage}</div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-violet-500 text-white rounded-md hover:bg-violet-700"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContactList;
