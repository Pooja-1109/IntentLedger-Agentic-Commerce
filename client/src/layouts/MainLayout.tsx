import React, { useEffect, useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { apiService, HealthCheckData } from "../services/api";

export const MainLayout: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);

  const fetchHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const data = await apiService.getHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    // Poll health status every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <div className="flex min-h-screen bg-background text-slate-100 font-sans">
      {/* Fixed Left Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar health={health} loadingHealth={loadingHealth} onRefreshHealth={fetchHealth} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          <Outlet context={{ health, refreshHealth: fetchHealth }} />
        </main>
      </div>
    </div>
  );
};
