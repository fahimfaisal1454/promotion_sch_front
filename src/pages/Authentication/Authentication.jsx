import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuDelete } from "react-icons/lu";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useUser } from "../../Provider/UseProvider";
import AxiosInstance from "../../components/AxiosInstance";


export default function Authentication() {
  const navigate = useNavigate();
  const { refreshUser } = useUser();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const [user, setUser] = useState({
    username: "",
    full_name: "",
    email: "",
    phone: "",
    profile_picture: null,
    password: "",
    confirm_password: "",
  });

  const [registers, setRegister] = useState(false);
  const [showName1, setShowName1] = useState("");
  const fileInputRef = useRef();

  const handleLoginChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!credentials.username || !credentials.password) {
      alert("Username and password are required!");
      return;
    }
    try {
      const response = await AxiosInstance.post("token/", credentials);
      const token = response.data.access;

      localStorage.setItem("access_token", token);
      refreshUser();

      alert("Login successful!");
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      const status = error.response?.status;
      if (status === 401) alert("Invalid username or password!");
      else alert("Something went wrong!");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const imageFile = e.target.files[0];
      setShowName1(imageFile.name);
      setUser({ ...user, profile_picture: imageFile });
    }
  };

  const handleClearFile = () => {
    setShowName1("");
    setUser({ ...user, profile_picture: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user.password !== user.confirm_password) {
      alert("Passwords do not match!");
      return;
    }

    const formData = new FormData();
    Object.entries(user).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    try {
      const response = await AxiosInstance.post("register/",formData,);
      setUser({
        username: "",
        full_name: "",
        email: "",
        phone: "",
        profile_picture: null,
        password: "",
        confirm_password: "",
      });

      console.log(response.data);
      setShowName1("");
      alert("Registration successful!");
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div className="w-80 md:w-96 my-16 lg:w-[800px] mx-auto bg-slate-100 flex items-center relative overflow-hidden shadow-xl">
      {/* Registration Form */}
      <form
        onSubmit={handleSubmit}
        className={`p-8 w-full ${
          registers ? "lg:translate-x-0" : "lg:-translate-x-full hidden lg:block"
        } duration-500`}
      >
        <h1 className="text-2xl lg:text-3xl pb-4">Register</h1>
        <div className="space-y-2">
          <input
            name="username"
            value={user.username}
            onChange={(e) => setUser({ ...user, username: e.target.value })}
            placeholder="user name"
            required
            className="p-3 h-8 w-full border rounded-md border-black text-sm"
          />
          <input
            name="full_name"
            value={user.full_name}
            onChange={(e) => setUser({ ...user, full_name: e.target.value })}
            placeholder="full Name"
            required
            className="p-3 h-8 w-full border rounded-md border-black text-sm"
          />

          <input
            name="email"
            type="email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            placeholder="example@example.com"
            className="p-3 h-8 w-full border rounded-md border-black text-sm"
          />
          <input
            name="phone"
            value={user.phone}
            onChange={(e) => setUser({ ...user, phone: e.target.value })}
            placeholder="Mobile Number"
            required
            className="p-3 h-8 w-full border rounded-md border-black text-sm"
          />

          <label className="block text-start text-sm text-gray-600">Profile Picture</label>
          <label
            className="flex w-full cursor-pointer"
            onClick={() => fileInputRef.current.click()}
          >
            <p className="truncate px-4 py-1 w-full border text-gray-500 border-black rounded-md shadow-md">
              {showName1 || "CHOOSE FILE"}
            </p>
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          {showName1 && (
            <div className="mt-2 flex items-center justify-between">
              <p>{showName1}</p>
              <button
                type="button"
                onClick={handleClearFile}
                className="text-red-500"
              >
                <LuDelete />
              </button>
            </div>
          )}

          {[
            { field: "password", show: showPassword, toggle: setShowPassword },
            { field: "confirm_password", show: showConfirmPassword, toggle: setShowConfirmPassword },
          ].map(({ field, show, toggle }) => (
            <div key={field} className="relative mb-3">
              <input
                name={field}
                type={show ? "text" : "password"}
                value={user[field]}
                onChange={(e) => setUser({ ...user, [field]: e.target.value })}
                placeholder={field === "password" ? "Password" : "Confirm Password"}
                required
                className="p-3 h-8 w-full border rounded-md border-black text-sm pr-10"
              />
              <span
                onClick={() => toggle((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
              >
                {show ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          ))}
        </div>

        <input
          type="submit"
          value="Register"
          className="btn py-2 px-5 mt-6 shadow-lg border border-black rounded-md block"
        />
        <p className="mt-4 text-center">
          Already have an account? <span onClick={() => setRegister(false)} className="underline cursor-pointer font-semibold">Login</span>
        </p>
      </form>

      <div
        className={`hidden lg:block absolute w-1/2 h-full top-0 z-50 duration-500 overflow-hidden bg-black/20 ${
          registers ? "translate-x-full rounded-bl-4xl" : "rounded-br-4xl"
        }`}
      >
        <img
          src="https://images.unsplash.com/photo-1546521343-20c2d7caaec7?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Uthshab Image"
          className="object-cover w-full "
        />
      </div>

      <form
        onSubmit={handleLogin}
        className={`p-8 w-full mr-0 ml-auto duration-500 ${registers ? "lg:translate-x-full hidden lg:block" : ""}`}
      >
        <h1 className="text-2xl lg:text-4xl pb-4">Login</h1>
        <input
          name="username"
          value={credentials.username}
          onChange={handleLoginChange}
          placeholder="Username"
          required
          className="p-3 block w-full border rounded-md border-black mb-3"
        />
        <div className="relative mb-4">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            value={credentials.password}
            onChange={handleLoginChange}
            placeholder="Password"
            required
            className="p-3 block w-full border rounded-md border-black pr-10"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer text-gray-500"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <p className="mb-3 text-center">
          Don’t have an account? <span onClick={() => setRegister(true)} className="underline cursor-pointer font-semibold">Register</span>
        </p>

        <button
          type="submit"
          className="btn py-2 px-5 mt-2 shadow-lg border border-black rounded-md block w-full"
        >
          Login
        </button>
      </form>
    </div>
  );
}