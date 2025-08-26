import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
export default function Dashboard() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow p-4">
        <Outlet /> 
      </div>
    </div>
  );
}
