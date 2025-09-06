// src/pages/Authentication/Authentication.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import AxiosInstance from "../../components/AxiosInstance";
import { useUser } from "../../Provider/UseProvider";

const ROLE_REDIRECTS = {
  Admin: "/dashboard",
  Teacher: "/teacher/dashboard",
  Student: "/student/dashboard",
};

export default function Authentication() {
  const navigate = useNavigate();
  const { refreshUser } = useUser();

  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");

  // 👉 Lock page scroll while on login route
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleChange = (e) => {
    setCredentials((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorText("");
    if (!credentials.username || !credentials.password) {
      setErrorText("Username and password are required.");
      return;
    }
    setSubmitting(true);
    try {
      const tokenRes = await AxiosInstance.post("token/", credentials);
      const token = tokenRes?.data?.access || tokenRes?.data?.access_token;
      if (!token) throw new Error("No access token returned");
      localStorage.setItem("access_token", token);

      const me = await AxiosInstance.get("user/");
      const role = me?.data?.role;
      refreshUser?.();

      navigate(ROLE_REDIRECTS[role] || "/", { replace: true });
    } catch (err) {
      localStorage.removeItem("access_token");
      setErrorText(err?.response?.status === 401 ? "Invalid username or password." : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(80vh-80px)] flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 px-3">
  <div className="w-full max-w-sm bg-white border rounded-xl shadow-xl p-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Sign in</h1>
          <p className="text-xs text-gray-500">Use your assigned username & password</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="e.g., admin01 or t_rumana"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={credentials.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-400"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {errorText && (
            <div className="text-red-600 text-xs text-center">{errorText}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-2 rounded-lg text-white text-sm font-medium transition-colors ${
              submitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-4 text-[11px] text-gray-500 text-center">
          You’ll be redirected to the correct portal (Admin / Teacher / Student) automatically.
        </div>
      </div>
    </div>
  );
}
