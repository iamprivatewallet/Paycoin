import React, { useMemo } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import PaymentCashier from "./components/PaymentCashier";
import TopupStylePage from "./pages/TopupStylePage";
import { Toaster } from "sonner";

function RedirectToProWithQuery() {
  const location = useLocation();
  return <Navigate to={`/pro${location.search}`} replace />;
}

export default function App() {
  const location = useLocation();
  const routeQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      orderId: params.get("orderId") || "",
      e: params.get("e") || "",
      language: params.get("language") || "en_US",
      search: location.search,
    };
  }, [location.search]);

  return (
    <div className="min-h-screen bg-[#1c1c1e]">
      <Routes>
        <Route path="/" element={<RedirectToProWithQuery />} />
        <Route path="/pro" element={<PaymentCashier {...routeQuery} />} />
        <Route path="/enterprise" element={<TopupStylePage {...routeQuery} />} />
      </Routes>
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}
