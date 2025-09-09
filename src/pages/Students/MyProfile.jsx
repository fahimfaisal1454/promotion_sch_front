import { useEffect, useState } from "react";
import AxiosInstance from "../../components/AxiosInstance";

export default function MyProfile(){
  const [me, setMe] = useState(null);
  useEffect(() => {
    (async () => {
      try{
        const {data} = await AxiosInstance.get("people/students/me/");
        setMe(data);
      }catch(e){ console.error(e); }
    })();
  }, []);
  if(!me) return <div className="p-4">Loading…</div>;
  return (
    <div className="p-4 space-y-2">
      <h2 className="text-xl font-semibold">My Profile</h2>
      <div className="bg-white p-4 rounded-xl border">
        <div><b>Name:</b> {me.full_name}</div>
        <div><b>Roll:</b> {me.roll_number || "-"}</div>
        <div><b>Class:</b> {me.class_name}</div>
        <div><b>Section:</b> {me.section || "-"}</div>
        <div><b>Phone:</b> {me.contact_phone || "-"}</div>
      </div>
    </div>
  );
}
