import React from 'react';
import PaymentCashier from './components/PaymentCashier';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <div className="bg-[#1c1c1e] min-h-screen">
      <PaymentCashier />
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}
