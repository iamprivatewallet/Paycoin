import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PaymentCashier from "./components/PaymentCashier";
import TopupStylePage from "./pages/TopupStylePage";
import { Toaster } from "sonner";

export default function App() {
  return (
    <div className="min-h-screen bg-[#1c1c1e]">
      <Routes>
        <Route path="/" element={<Navigate to="/pro" replace />} />
        <Route path="/pro" element={<PaymentCashier />} />
        <Route path="/enterprise" element={<TopupStylePage />} />
        <Route path="/style-a" element={<Navigate to="/pro" replace />} />
        <Route path="/style-b" element={<Navigate to="/enterprise" replace />} />
      </Routes>
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}
