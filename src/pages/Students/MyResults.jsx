import { useEffect, useState } from "react";
import AxiosInstance from "../../components/AxiosInstance";

export default function MyResults(){
  const [rows, setRows] = useState([]);
  useEffect(() => {
    (async () => {
      try{
        const {data} = await AxiosInstance.get("results/", { params: { student: "me" } });
        setRows(Array.isArray(data) ? data : []);
      }catch(e){ console.error(e); }
    })();
  }, []);
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">My Results</h2>
      <div className="bg-white border rounded-xl">
        <div className="grid grid-cols-5 gap-3 p-3 text-sm font-medium bg-slate-50 border-b">
          <div>Exam</div><div>Subject</div><div>Marks</div><div>Grade</div><div>Remarks</div>
        </div>
        {rows.length ? rows.map((r,i)=>(
          <div key={i} className="grid grid-cols-5 gap-3 p-3 text-sm border-b last:border-b-0">
            <div>{r.exam_name || "-"}</div>
            <div>{r.subject_label || r.subject}</div>
            <div>{r.marks || "-"}</div>
            <div>{r.grade || "-"}</div>
            <div>{r.remarks || "-"}</div>
          </div>
        )) : <div className="p-4 text-sm text-slate-500">No results yet.</div>}
      </div>
    </div>
  );
}
