import { Outlet } from "react-router-dom";
import Navigation from "../components/Navigation";
import { TopHeader } from "../components/TopHeader";

export default function RootLayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#071014] text-[#E8F1F4] font-sans">
      <div className="bg-[#180a0c] text-[#F07576] font-mono-code font-bold text-center py-0.5 text-[10px] uppercase tracking-[0.2em] z-50 border-b border-[#F07576]/30">
        SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION
      </div>
      
      <TopHeader />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Navigation />
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative border-l border-[#192830]">
          <div className="flex-1 overflow-hidden relative">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

