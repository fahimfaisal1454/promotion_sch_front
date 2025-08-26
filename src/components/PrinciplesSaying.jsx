import React, { useEffect, useState } from 'react';
import AxiosInstance from './AxiosInstance';
import defaultImage from '../images/person.PNG';
import bgImage from '../images/bgs.jpg'

export default function PrinciplesSaying() {
  const [principal, setPrincipal] = useState(null);

  const fetchPrincipal = async () => {
    try {
      const response = await AxiosInstance.get('principal-vice-principal/');
      if (response.data && response.data.length > 0) {
        setPrincipal(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching principal data:", error);
    }
  };

  useEffect(() => {
    fetchPrincipal();
  }, []);

  return (
    
    <section className="w-full  py-4 px-2 md:px-10">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white bg-black py-3">প্রধান শিক্ষকের বার্তা</h2>
        
      </div>
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6 items-center bg-white rounded-xl shadow-md p-4 md:p-8">
        {/* Principal Image */}
        <div className="flex justify-center">
          <div className="overflow-hidden rounded-lg shadow-md hover:shadow-lg transition duration-300">
            <img
              src={principal?.photo || defaultImage}
              alt="Principal"
              className="w-52 h-52 object-cover rounded-lg"
            />
          </div>
        </div>

        {/* Principal Message */}
        <div className="text-gray-800 space-y-3">
          
          <blockquote className="text-base italic text-gray-700 border-l-4 pl-3 border-blue-400">
            “{principal?.message || 'প্রধান শিক্ষকের বার্তা লোড হচ্ছে...'}”
          </blockquote>
          <p className="font-medium text-[#0A3B68] text-right mt-4">
            - {principal?.full_name || 'প্রধান শিক্ষকের নাম লোড হচ্ছে...'}
          </p>
        </div>
      </div>
    </section>
    
  );
}
