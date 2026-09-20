import React from 'react';
import { BellRing, Users, Truck, Wind } from 'lucide-react';
import { MetricCard } from '../primitives/MetricCard';
import { useSimulationContext } from '../../contexts/SimulationContext';
import { useNavigate } from 'react-router-dom';

export interface TacticalMetricsGridProps {
  className?: string;
  onSelectTrack?: (trackId: string) => void;
}

export const TacticalMetricsGrid: React.FC<TacticalMetricsGridProps> = ({
  className = '',
  onSelectTrack,
}) => {
  const { tracks, newAlerts, setSelectedTrackId } = useSimulationContext();
  const navigate = useNavigate();

  const peopleTracks = tracks.filter((t) =>
    t.object_type.toLowerCase().includes('person')
  );
  const vehicleTracks = tracks.filter((t) =>
    ['vehicle', 'truck', 'tank', 'car'].some((k) =>
      t.object_type.toLowerCase().includes(k)
    )
  );
  const aerialTracks = tracks.filter(
    (t) =>
      ['drone', 'aircraft', 'aerial', 'plane', 'helicopter'].some((k) =>
        t.object_type.toLowerCase().includes(k)
      ) || t.altitude > 10
  );

  const handleTrackClick = (trackList: typeof tracks, fallbackId?: string) => {
    const id = trackList[0]?.id || fallbackId;
    if (id) {
      setSelectedTrackId(id);
      if (onSelectTrack) onSelectTrack(id);
    }
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 ${className}`}>
      {/* 1. Active Alerts */}
      <MetricCard
        label="Active alerts"
        value={newAlerts.length}
        subtext={newAlerts.length > 0 ? "Requires triage" : "Nominal telemetry"}
        icon={BellRing}
        accentColor="amber"
        onClick={() => navigate('/alerts')}
      />

      {/* 2. People Tracked */}
      <MetricCard
        label="People tracked"
        value={peopleTracks.length}
        subtext={peopleTracks.length > 0 ? `${peopleTracks.length} active border tracks` : "Across ground sectors"}
        icon={Users}
        accentColor="cyan"
        onClick={() => handleTrackClick(peopleTracks, 'TRK-001')}
      />

      {/* 3. Vehicles Tracked */}
      <MetricCard
        label="Vehicles tracked"
        value={vehicleTracks.length}
        subtext={vehicleTracks.length > 0 ? `${vehicleTracks.length} ground vehicles` : "Patrol & logistic routes"}
        icon={Truck}
        accentColor="violet"
        onClick={() => handleTrackClick(vehicleTracks, 'TRK-002')}
      />

      {/* 4. Aerial Objects */}
      <MetricCard
        label="Aerial objects"
        value={aerialTracks.length}
        subtext={aerialTracks.length > 0 ? `${aerialTracks.length} airspace radar tracks` : "Low-altitude FMCW scan"}
        icon={Wind}
        accentColor="green"
        onClick={() => handleTrackClick(aerialTracks, 'TRK-003')}
      />
    </div>
  );
};
