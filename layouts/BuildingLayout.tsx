import React from 'react';
import { Building } from '../types/building';

interface BuildingLayoutProps {
  buildings: Building[];
}

const BuildingLayout: React.FC<BuildingLayoutProps> = ({ buildings }) => {
  return (
    <div className="building-layout">
      {buildings.map((building) => (
        <div key={building.id} className="building-card">
          <div className="icon">{building.icon}</div>
          <h3>{building.title}</h3>
          <p>{building.description}</p>
        </div>
      ))}
    </div>
  );
};

export default BuildingLayout;
