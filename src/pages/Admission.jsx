import React from "react";

export default function Admission() {
  return (
    <div className="bg-gray-50 px-4 py-8 md:px-12 lg:px-24">
      <h1 className="text-3xl md:text-3xl font-bold text-left text-[#0A3B68] mb-6">
        ভর্তি তথ্য - নামেজ সরদার মাধ্যমিক বিদ্য়ালয়, সদর, যশোর
      </h1>
      
      <p className="max-w-2xl text-gray-700 mb-10 text-left">
        নামেজ সরদার মাধ্যমিক বিদ্য়ালয়ে ভর্তি কার্যক্রমে আপনাকে স্বাগতম। আমাদের কলেজে উচ্চমানের শিক্ষা, 
        দক্ষ শিক্ষক এবং মনোরম পরিবেশে শিক্ষার সুযোগ রয়েছে।
      </p>

      <section className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-[#0A3B68] mb-4 text-left">ভর্তির যোগ্যতা</h2>
        <ul className="list-disc list-inside text-gray-800 space-y-2 text-left">
          <li>এসএসসি/সমমান পরীক্ষায় উত্তীর্ণ শিক্ষার্থী।</li>
          <li>ন্যূনতম জিপিএ ২.৫ বা কলেজ কর্তৃক নির্ধারিত মান।</li>
          <li>প্রযোজ্য ক্ষেত্রে বোর্ডের নির্দেশনা অনুযায়ী শর্ত।</li>
        </ul>
      </section>

      <section className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-[#0A3B68] mb-4 text-left">ভর্তি প্রক্রিয়া</h2>
        <ol className="list-decimal list-inside text-gray-800 space-y-2 text-left">
          <li>কলেজ অফিস থেকে ভর্তি ফরম সংগ্রহ করুন।</li>
          <li>ফরম পূরণ করে প্রয়োজনীয় কাগজপত্র সংযুক্ত করুন।</li>
          <li>ফরম কলেজ অফিসে জমা দিন।</li>
          <li>নির্ধারিত ভর্তি ফি পরিশোধ করুন।</li>
          <li>ভর্তি সম্পন্ন হওয়ার পর রোল নম্বর সংগ্রহ করুন।</li>
        </ol>
      </section>

      <section className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-[#0A3B68] mb-4 text-left">প্রয়োজনীয় কাগজপত্র</h2>
        <ul className="list-disc list-inside text-gray-800 space-y-2 text-left">
          <li>এসএসসি/সমমান পরীক্ষার মূল সনদ ও মার্কশীটের ফটোকপি।</li>
          <li>জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন সনদের ফটোকপি।</li>
          <li>২ কপি পাসপোর্ট সাইজ ছবি।</li>
          <li>ফি প্রদানের রশিদ।</li>
        </ul>
      </section>

      <section className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-[#0A3B68] mb-4 text-left">যোগাযোগ</h2>
        <p className="text-gray-800 mb-2 text-left">
          ঠিকানা: নামেজ সরদার মাধ্যমিক বিদ্য়ালয়, সদর, যশোর
        </p>
        <p className="text-gray-800 mb-2 text-left">
          মোবাইল: ০১৭১৩৭০০১৮৭
        </p>
        <p className="text-gray-800 text-left">
          ইমেইল: natunhatpubliccollege@yahoo.com
        </p>
      </section>
    </div>
  );
}
