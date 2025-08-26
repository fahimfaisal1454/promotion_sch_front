import React, { useState, useEffect } from "react";

export default function FlipClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Format date
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayName = dayNames[time.getDay()];

  const dateString = time.toLocaleDateString('en-GB').split('/').join('/').slice(0,8);

  // Time partss
  let hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }

  const hourStr = hours.toString().padStart(2, '0');

  return (
    <div className="bg-[#000] rounded-lg p-4 w-fit shadow-lg">
      <div className="flex flex-col items-center">

        {/* Date and Day */}
        <div className="flex justify-between w-64 px-4 mb-2 text-xs text-gray-400">
          <span>{dateString}</span>
          <span>{dayName}</span>
        </div>

        {/* Main Clock */}
        <div className="flex">
          {/* Hours */}
          <div className="relative bg-[#111] rounded-lg m-1 w-24 h-28 flex flex-col items-center justify-center shadow-inner">
            <div className="text-5xl font-bold text-gray-300">{hourStr}</div>
            <div className="absolute text-xs text-gray-400 bottom-2 left-2">{ampm}</div>
          </div>

          {/* Minutes */}
          <div className="relative bg-[#111] rounded-lg m-1 w-24 h-28 flex flex-col items-center justify-center shadow-inner">
            <div className="text-5xl font-bold text-gray-300">{minutes}</div>
            <div className="absolute text-xs text-gray-400 bottom-2 right-2">{seconds}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
