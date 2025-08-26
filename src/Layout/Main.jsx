import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Components/Header/Header';
import Notices from '../Components/Notices/Notices';
import Footer from '../Components/Footer/Footer';

const Main = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Notice Scrolling Bar */}
         <div className="fixed top-0 left-0 right-0 z-[60] bg-cyan-400 backdrop-blur-sm text-cyan-500 py-1 ">
        <Notices />
      </div>

      {/* Header Below Notice Bar */}
      <div className="fixed top-8 left-0 right-0 z-50">
        <Header />
      </div>

      {/* Main Content */}
      <div className="flex-grow"> 
        <Outlet />
      </div>

      <Footer></Footer>
    </div>
  );
};

export default Main;
