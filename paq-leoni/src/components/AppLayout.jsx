import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "../styles/layout.css";

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar />
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}