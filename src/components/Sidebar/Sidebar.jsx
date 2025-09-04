import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { IoIosLogOut } from "react-icons/io";
import { AiFillHome } from "react-icons/ai";
import { MdSettings, MdExpandMore, MdExpandLess } from "react-icons/md";
import { PiBuildingsDuotone } from "react-icons/pi";
import { FiPhone } from "react-icons/fi";
import { FaImages, FaUserTie, FaUserGraduate } from "react-icons/fa6";
import { FaChalkboardTeacher } from "react-icons/fa";
import { RiTeamFill } from "react-icons/ri";
import { BsClipboardData } from "react-icons/bs";
import { FaRegCalendarAlt, FaUniversity } from "react-icons/fa";
import { useUser } from "../../Provider/UseProvider";
import AxiosInstance from "../AxiosInstance";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [siteMenuOpen, setSiteMenuOpen] = useState(false);
  const [defaultMenuOpen, setDefaultMenuOpen] = useState(false);
  const [institutionInfo, setInstitutionInfo] = useState(null);

  const toggleSidebar = () => setCollapsed(!collapsed);
  const { signOut } = useUser();

  const handleLogout = () => {
    signOut();
    window.location.href = "/login";
  };

  const fetchInstitutionInfo = async () => {
    try {
      const res = await AxiosInstance.get("institutions/");
      if (res.data.length > 0) setInstitutionInfo(res.data[0]);
    } catch (error) {
      console.error("Error fetching institution info:", error);
    }
  };

  useEffect(() => {
    fetchInstitutionInfo();
  }, []);

  // ✅ Default: white text; Active: black text; Hover: yellow bg, text stays white
  const navLinkStyle = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200
     ${isActive ? "bg-[#d8f999] text-black" : "hover:bg-[#e2b42b] text-white hover:text-white"}
     ${collapsed ? "justify-center text-base px-1" : ""}`;

  return (
    <aside
      className={`h-screen bg-[#2C8E3F] text-white flex flex-col ${
        collapsed ? "w-16" : "w-64"
      } transition-all duration-300`}
    >
      {/* Top */}
      <div className="relative">
        <div className="flex items-center px-4 py-4">
          <Link to="/">
            <img
              src={institutionInfo?.logo || "/default-logo.png"}
              className={`object-cover rounded-full transition-all duration-300 ${
                collapsed ? "w-10 h-10" : "w-12 h-12"
              }`}
              alt="Logo"
            />
          </Link>
        </div>
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white text-purple-600 rounded-full shadow-md border border-purple-200 hover:bg-purple-100 w-6 h-6 flex items-center justify-center"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      {/* Middle */}
      <div className="flex-grow px-2 overflow-auto space-y-1">
        {/* Site Config */}
        <div>
          <button
            onClick={() => setSiteMenuOpen(!siteMenuOpen)}
            className="flex gap-3 w-full px-3 py-2 text-white rounded-md hover:bg-[#e2b42b] hover:text-white"
            title="সাইট কনফিগারেশন"
          >
            <MdSettings className="text-xl" />
            {!collapsed && <span>সাইট কনফিগারেশন</span>}
            {!collapsed && (
              <span className="ml-auto">
                {siteMenuOpen ? <MdExpandLess /> : <MdExpandMore />}
              </span>
            )}
          </button>

          <div
            className={`transition-all duration-300 overflow-hidden ${
              siteMenuOpen ? "max-h-[500px]" : "max-h-0"
            } ${collapsed ? "pl-0" : "pl-4"}`}
          >
            <NavLink to="/dashboard/college-info" className={navLinkStyle}>
              <PiBuildingsDuotone className="text-lg" />
              {!collapsed && "প্রতিষ্ঠানের তথ্য"}
            </NavLink>
            <NavLink to="/dashboard/contact-info" className={navLinkStyle}>
              <FiPhone className="text-lg" />
              {!collapsed && "যোগাযোগ"}
            </NavLink>
            <NavLink to="/dashboard/principal-info" className={navLinkStyle}>
              <FaUserTie className="text-lg" />
              {!collapsed && "প্রধান শিক্ষক/সহকারি প্রধান শিক্ষক"}
            </NavLink>
            <NavLink to="/dashboard/committee-member" className={navLinkStyle}>
              <FaUserTie className="text-lg" />
              {!collapsed && "কমিটি সদস্য"}
            </NavLink>
            <NavLink to="/dashboard/gallery-upload" className={navLinkStyle}>
              <FaImages className="text-lg" />
              {!collapsed && "গ্যালারি ছবি"}
            </NavLink>
            <NavLink to="/dashboard/add-acknowledgement" className={navLinkStyle}>
              <FaImages className="text-lg" />
              {!collapsed && "স্বীকৃতি পত্র যোগ করুন"}
            </NavLink>
            <NavLink to="/dashboard/add-class" className={navLinkStyle}>
              <FaImages className="text-lg" />
              {!collapsed && "শ্রেণি যোগ করুন"}
            </NavLink>
            <NavLink to="/dashboard/add-subject" className={navLinkStyle}>
              <FaImages className="text-lg" />
              {!collapsed && "বিষয় যোগ করুন"}
            </NavLink>
          </div>
        </div>

        {/* Notice */}
        <NavLink to="/dashboard/notices" className={navLinkStyle}>
          <BsClipboardData className="text-lg" />
          {!collapsed && "নোটিশ"}
        </NavLink>

        {/* Default */}
        <div>
          <button
            onClick={() => setDefaultMenuOpen(!defaultMenuOpen)}
            className="flex gap-3 w-full px-3 py-2 text-white rounded-md hover:bg-[#e2b42b] hover:text-white"
            title="ডিফল্ট"
          >
            <MdSettings className="text-xl" />
            {!collapsed && <span>ডিফল্ট</span>}
            {!collapsed && (
              <span className="ml-auto">
                {defaultMenuOpen ? <MdExpandLess /> : <MdExpandMore />}
              </span>
            )}
          </button>

          <div
            className={`transition-all duration-300 overflow-hidden ${
              defaultMenuOpen ? "max-h-[500px]" : "max-h-0"
            } ${collapsed ? "pl-0" : "pl-4"}`}
          >
            <NavLink to="/dashboard/student-info-form" className={navLinkStyle}>
              <FaUserGraduate className="text-lg" />
              {!collapsed && "শিক্ষার্থীর তথ্য "}
            </NavLink>
            <NavLink to="/dashboard/teacher-info-form" className={navLinkStyle}>
              <FaChalkboardTeacher className="text-lg" />
              {!collapsed && "শিক্ষকের তথ্য"}
            </NavLink>
            <NavLink to="/dashboard/staff-info-form" className={navLinkStyle}>
              <RiTeamFill className="text-lg" />
              {!collapsed && "কর্মচারীর তথ্য"}
            </NavLink>
            <NavLink to="/dashboard/users" className={navLinkStyle}>
  <RiTeamFill className="text-lg" />
  {!collapsed && "ব্যবহারকারী (Users)"}
</NavLink>

            <NavLink to="/dashboard/teacher-approvals" className={navLinkStyle}>
  <FaChalkboardTeacher className="text-lg" />
  {!collapsed && "শিক্ষক অনুমোদন"}
</NavLink>
          </div>
        </div>

        {/* Academic */}
        <div>
          <button
            onClick={() => setDefaultMenuOpen(!defaultMenuOpen)}
            className="flex gap-3 w-full px-3 py-2 text-white rounded-md hover:bg-[#e2b42b] hover:text-white"
            title="একাডেমিক"
          >
            <FaUniversity className="text-xl" />
            {!collapsed && <span>একাডেমিক</span>}
            {!collapsed && (
              <span className="ml-auto">
                {defaultMenuOpen ? <MdExpandLess /> : <MdExpandMore />}
              </span>
            )}
          </button>

          <div
            className={`transition-all duration-300 overflow-hidden ${
              defaultMenuOpen ? "max-h-[500px]" : "max-h-0"
            } ${collapsed ? "pl-0" : "pl-4"}`}
          >
            <NavLink to="/dashboard/class-routine" className={navLinkStyle}>
              <FaRegCalendarAlt className="text-lg" />
              {!collapsed && "ক্লাস রুটিন "}
            </NavLink>
            <NavLink to="/dashboard/add-result" className={navLinkStyle}>
              <FaRegCalendarAlt className="text-lg" />
              {!collapsed && "ফলাফল যোগ করুন"}
            </NavLink>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-2 py-4 border-t border-purple-700">
        <NavLink to="/" className={navLinkStyle}>
          <AiFillHome className="text-lg" />
          {!collapsed && "হোম"}
        </NavLink>

        <button
          className={`flex items-center gap-2 px-3 py-2 w-full rounded-md text-white hover:bg-[#e2b42b] hover:text-white transition-all duration-200 ${
            collapsed ? "justify-center" : ""
          }`}
          title="লগআউট"
          onClick={handleLogout}
        >
          <IoIosLogOut className="text-lg" />
          {!collapsed && <span>লগআউট</span>}
        </button>
      </div>
    </aside>
  );
}
