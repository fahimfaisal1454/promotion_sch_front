import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";

import Root from "./components/Root.jsx";
import ErrorPage from "./components/ErrorPage.jsx";
import Contact from "./pages/Contacts.jsx";
import Home from "./pages/Home/Home.jsx";
import Academic from "./pages/Academic.jsx";
import FacnStaff from "./pages/FacnStaff.jsx";
import Notice from "../src/pages/Notice/Notice.jsx"
import { UserProvider } from "./Provider/UseProvider.jsx";
import Authentication from "./pages/Authentication/Authentication.jsx";
import ProtectedRoute from "./Provider/ProtectedRoute.jsx";
import AdminList from "./pages/AdminList/AdminList.jsx";
import PrincipleList from "./pages/PrincipleList/PrincipleList.jsx";
import Faculty from "./pages/Faculty/Faculty.jsx";
import Gallery from "../src/pages/Gallery.jsx";
import Admission from "../src/pages/Admission.jsx";
import AboutCollege from "./pages/AboutCollege.jsx";
import Routine from "./pages/Academic/Routine.jsx";
import Acknowledgment from "./pages/Acknowledgment/Acknowledgment.jsx";
import Result from "./pages/Academic/Result.jsx";



import Dashboard from "../src/Layout/Dashboard.jsx";
import AddNotice from "./pages/DashboardPages/Notice/Notice.jsx";
import GalleryUpload from "./pages/DashboardPages/Master/GalleryUpload.jsx";
import AddClass from "./pages/DashboardPages/Master/AddClass.jsx";
import CollegeInfo from "../src/pages/DashboardPages/Master/CollegeInfo.jsx";
import PrincipalForms from "./pages/DashboardPages/Master/PrincipalForms.jsx";
import AddSubject from "./pages/DashboardPages/Master/AddSubject.jsx";
import StaffInfo from "./pages/DashboardPages/Default/StaffInfo.jsx";
import TeacherInfo from "./pages/DashboardPages/Default/TeacherInfo.jsx";
import StudentInfo from "./pages/DashboardPages/Default/StudentInfo.jsx";
import ClassRoutine from "./pages/DashboardPages/academics/ClassRoutine.jsx";
import CommitteeMember from "./pages/DashboardPages/Master/CommitteeMember.jsx";
import ContactList from "./pages/DashboardPages/Master/ContactList.jsx";
import AdminAcknowledgment from "./pages/DashboardPages/Master/AdminAcknowledgment.jsx";
import ResultManager from "./pages/DashboardPages/academics/ResultManager.jsx";


// Define the router
const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />,
      },

      {
        path: "contact",
        element: <Contact />,
      },
      {
        path: "/login",
        element: <Authentication></Authentication>,
      },

      {
        path: "/notice",
        element: <Notice></Notice>,
      },
      {
        path: "/academic",
        element: <Academic />,
      },
      {
        path: "/facnstaff",
        element: <Faculty></Faculty>,
      },

      {
        path: "/gallery",
        element: <Gallery />,
      },
      {
        path: "/admission",
        element: <Admission />,
      },
      {
        path: "/about",
        element: <AboutCollege />,
      },
      {
        path: "/routine",
        element: <Routine />,
      },
      {
        path: "/result",
        element: <Result />,
      },
      {
        path: "/acknowledgment",
        element: <Acknowledgment />,
      },
    ],
  },

  {
    path: "/dashboard",
    element:<ProtectedRoute><Dashboard></Dashboard></ProtectedRoute>,
    children: [
      {
        path: "college-info",
        element:<CollegeInfo></CollegeInfo> , 
      },
      {
        path: "notices",
        element: <AddNotice></AddNotice>, 
      },
      {
        path: "contact-info",
        element:  <ContactList></ContactList>, 
      },
      {
        path: "gallery-upload",
        element: <GalleryUpload></GalleryUpload>, 
      },
      {
        path: "principal-info",
        element: <PrincipalForms></PrincipalForms>,
      },
        {
        path: "student-info-form",
        element: <StudentInfo></StudentInfo>,
      },
        {
        path: "teacher-info-form",
        element: <TeacherInfo></TeacherInfo>,
      },
      {
        path: "staff-info-form",
        element: <StaffInfo></StaffInfo>,
      },

       {
        path: "class-routine",
        element: <ClassRoutine></ClassRoutine>,
      },

      {
        path: "add-class",
        element: <AddClass></AddClass>,
      },

      {
        path: "add-subject",
        element: <AddSubject></AddSubject>,
      },

       {
        path: "committee-member",
        element: <CommitteeMember></CommitteeMember>,
      },
      {
        path: "add-acknowledgement",
        element: <AdminAcknowledgment></AdminAcknowledgment>,
      },
      {
        path: "add-result",
        element: <ResultManager></ResultManager>,
      }
    ],
  },
]);

// Render to root
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>
  </React.StrictMode>
);
