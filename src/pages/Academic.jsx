import React from "react";
import Banner from '../images/banner.png';
import Banner2 from '../images/banner2.png';

export default function Academic() {
  const programs = [
    "✅ এইচএসসি বিজ্ঞান",
    "✅ এইচএসসি",
    "✅ এইচএসসি ব্যবসায় শিক্ষা",
  ];

  const departments = [
    "✅ বিজ্ঞান বিভাগ",
    "✅ মানবিক বিভাগ",
    "✅ ব্যবসায় শিক্ষা বিভাগ",
  ];

  return (
    <div className="mx-auto px-4  min-h-screen py-4">
     

      {/* Centered Heading */}
      <div className="flex justify-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0a3b68] border-b-4 border-[#0a3b68] inline-block px-4 pb-1">
          🎓 একাডেমিক তথ্য
        </h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Programs Box */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition duration-300">
          <h2 className="text-2xl font-semibold text-[#0a3b68] mb-4 text-center border-b border-[#0a3b68] pb-2">
            📚 প্রদত্ত প্রোগ্রামসমূহ
          </h2>
          <ul className="space-y-3 text-gray-800 text-lg">
            {programs.map((program, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-[#0a3b68] mr-2">✔️</span>
                <span>{program.replace("✅ ", "")}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Departments Box */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition duration-300">
          <h2 className="text-2xl font-semibold text-[#0a3b68] mb-4 text-center border-b border-[#0a3b68] pb-2">
            🏛️ বিভাগসমূহ
          </h2>
          <ul className="space-y-3 text-gray-800 text-lg">
            {departments.map((dept, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-[#0a3b68] mr-2">✔️</span>
                <span>{dept.replace("✅ ", "")}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <img src={Banner2} alt="Banner" className="w-full mb-6 py-10 rounded-lg shadow" />
    </div>
  );
}
