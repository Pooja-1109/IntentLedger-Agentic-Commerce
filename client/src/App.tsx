import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { IntentStudio } from "./pages/IntentStudio";
import { SimulationPage } from "./pages/Simulation";
import { DecisionCenterPage } from "./pages/DecisionCenter";
import { ApprovalsPage } from "./pages/Approvals";
import { PaymentGatePage } from "./pages/PaymentGate";
import { LedgerPage } from "./pages/Ledger";
import { IntentReplayPage } from "./pages/Replay";
import { DemoPage } from "./pages/Demo";
import { SecurityCenterPage } from "./pages/Security";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="demo" element={<DemoPage />} />
          <Route path="studio" element={<IntentStudio />} />
          <Route path="simulation" element={<SimulationPage />} />
          <Route path="decisions" element={<DecisionCenterPage />} />
          <Route path="approvals" element={<ApprovalsPage />} />
          <Route path="payment" element={<PaymentGatePage />} />
          <Route path="ledger" element={<LedgerPage />} />
          <Route path="replay" element={<IntentReplayPage />} />
          <Route path="security" element={<SecurityCenterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
