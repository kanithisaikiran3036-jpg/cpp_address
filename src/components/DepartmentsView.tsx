import React, { useState, useEffect } from 'react';
import { Department } from '../types';
import { api } from '../api';

export const DepartmentsView: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDepartments().then(setDepartments).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1280px] mx-auto pb-12">
      <div>
        <h2 className="font-headline text-[26px] font-bold text-[#0f172a]">
          Departments
        </h2>
        <p className="text-[14px] text-[#64748b]">
          Organizational units and departmental headcount tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-[#2563eb] transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[11px] font-bold text-[#2563eb] bg-[#eff6ff] px-2 py-0.5 rounded">
                  {dept.code}
                </span>
                <h3 className="font-headline text-[18px] font-bold text-[#0f172a] mt-2">
                  {dept.name}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#f1f5f9] flex justify-between items-center text-[13px] text-[#64748b]">
              <span>Department Lead: <strong>{dept.manager}</strong></span>
              <span className="font-mono font-bold text-[#0f172a]">{dept.headcount} members</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
