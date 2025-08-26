import { useState, useEffect } from "react";

import toast from "react-hot-toast";
import AxiosInstance from "../components/AxiosInstance";

const useInstitutionInfo = () => {
  const [info, setInfo] = useState([]);
  const [loading, setLoading] = useState(true); // Optional: for loading state

  const getInstitutionInfo = async () => {
    try {
      const res = await AxiosInstance.get("institutions/");
      return res.data.reverse(); // reverse() optional
    } catch (err) {
      toast.error("তথ্য লোড করতে ব্যর্থ ❌", err);
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      const data = await getInstitutionInfo();
      setInfo(data);
      setLoading(false); // Stop loading after data fetch
    })();
  }, []);

  return { info, loading }; // return both if needed
};
export default useInstitutionInfo;