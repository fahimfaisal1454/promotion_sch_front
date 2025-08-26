import { Outlet } from "react-router-dom";
import TeacherSidebar from "../components/Sidebar/TeacherSidebar";

export default function TeacherPanel() {
  return (
    <div className="flex">
      <TeacherSidebar />
      <div className="flex-grow p-4 bg-gray-50 min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}
