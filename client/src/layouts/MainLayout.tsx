import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { apiService, HealthCheckData } from "../services/api";

export const MainLayout: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const data = await apiService.getHealth();
      setHealth(data);
    } catch (err) {
      console.error("Health check failed:", err);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans">
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Deep Navy Sidebar */}
      <Sidebar
        health={health}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
        <Navbar
          health={health}
          loadingHealth={loadingHealth}
          onRefreshHealth={fetchHealth}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
