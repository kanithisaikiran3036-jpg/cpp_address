import React, { useState, useEffect } from 'react';
import { Location } from '../types';
import { api } from '../api';

export const LocationsView: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    api.getLocations().then(setLocations);
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1280px] mx-auto pb-12">
      <div>
        <h2 className="font-headline text-[26px] font-bold text-[#0f172a]">
          Locations
        </h2>
        <p className="text-[14px] text-[#64748b]">
          Verified operating offices and physical branches.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-xs flex flex-col gap-3 hover:border-[#2563eb] transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-headline text-[18px] font-bold text-[#0f172a]">
                  {loc.name}
                </h3>
                <p className="text-[13px] text-[#64748b]">
                  {loc.city}, {loc.country}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">location_on</span>
              </div>
            </div>

            <div className="p-3 bg-[#f8fafc] rounded-xl text-[12px] text-[#475569] font-mono">
              {loc.address}
            </div>

            <div className="text-[11px] text-[#64748b] font-mono flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>Timezone: {loc.timezone}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
