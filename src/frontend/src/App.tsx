import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import { SimulationProvider } from "./contexts/SimulationContext";
import CommandMap from "./pages/CommandMap";
import Alerts from "./pages/Alerts";
import Cameras from "./pages/Cameras";
import Radar from "./pages/Radar";
import Tracks from "./pages/Tracks";
import Incidents from "./pages/Incidents";
import { lazy, Suspense } from "react";
import Audit from "./pages/Audit";
import Health from "./pages/Health";
import HumanReview from "./pages/HumanReview";

const View3D = lazy(() => import("./pages/View3D"));

// Mock pages for prototype
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full text-muted-foreground">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p>Component under construction</p>
    </div>
  </div>
);

function App() {
  return (
    <SimulationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<CommandMap />} />
            <Route path="cameras" element={<Cameras />} />
            <Route path="radar" element={<Radar />} />
            <Route path="tracks" element={<Tracks />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="incidents/:incidentId" element={<Incidents />} />
            <Route path="audit" element={<Audit />} />
            <Route path="health" element={<Health />} />
            <Route path="human-review" element={<HumanReview />} />
            <Route path="human-review/:alertId" element={<HumanReview />} />
            <Route 
              path="3d-view" 
              element={
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full bg-[#080B10] text-cyan-400 font-mono text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                      <span>INITIALIZING 3D TACTICAL ENGINE...</span>
                    </div>
                  </div>
                }>
                  <View3D />
                </Suspense>
              } 
            />
            <Route path="settings" element={<Placeholder title="Settings" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SimulationProvider>
  );
}

export default App;
