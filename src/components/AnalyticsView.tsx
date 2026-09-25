import React, { useState } from 'react';
import { Contact, AnalyticsData, DistributionItem } from '../types';

interface AnalyticsViewProps {
  contacts: Contact[];
  analytics: AnalyticsData | null;
  onSelectContact: (id: string) => void;
  onFilterChange: (filters: {
    search: string;
    category: string;
    tags: string;
    lastContacted: string;
  }) => void;
  onViewAllContacts: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  contacts,
  analytics,
  onSelectContact,
  onFilterChange,
  onViewAllContacts,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [dateAdded, setDateAdded] = useState('');
  const [lastContacted, setLastContacted] = useState('Anytime');
  const [tags, setTags] = useState('');
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onFilterChange({
      search,
      category,
      tags,
      lastContacted,
    });
  };

  const handleClear = () => {
    setSearch('');
    setCategory('All Categories');
    setDateAdded('');
    setLastContacted('Anytime');
    setTags('');
    onFilterChange({
      search: '',
      category: 'All Categories',
      tags: '',
      lastContacted: 'Anytime',
    });
  };

  // Dynamic distribution stats
  const distribution: DistributionItem[] = analytics?.distribution || [
    { category: 'Clients', count: 560, color: '#004ac6' },
    { category: 'Vendors', count: 315, color: '#2563eb' },
    { category: 'Partners', count: 210, color: '#505f76' },
    { category: 'Internal', count: 163, color: '#737686' },
  ];

  const maxCount = Math.max(...distribution.map((d: DistributionItem) => d.count), 1);
  const totalContacts = analytics?.total_contacts || (contacts.length >= 3 ? 1248 : contacts.length);

  // Recently added contacts
  const recentlyAdded = contacts.slice(0, 4);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1280px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="font-headline text-[32px] md:text-[36px] leading-[40px] md:leading-[44px] font-bold text-[#111c2d]">
          Search & Analytics
        </h1>
        <p className="text-[16px] leading-[24px] text-[#505f76]">
          Advanced filtering and contact insights.
        </p>
      </div>

      {/* Advanced Search Filter Box */}
      <form
        onSubmit={handleApply}
        className="bg-white border border-[#c3c6d7] rounded-xl p-4 md:p-6 shadow-xs"
      >
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#c3c6d7]/60">
          <span className="material-symbols-outlined text-[#004ac6]">filter_list</span>
          <h3 className="font-headline text-[18px] font-semibold text-[#111c2d]">
            Advanced Search
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Global Search */}
          <div className="lg:col-span-4 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, or tags..."
              className="w-full h-10 pl-10 pr-16 bg-[#f9f9ff] border border-[#c3c6d7] rounded-lg text-[14px] text-[#111c2d] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-[#e7eeff] border border-[#c3c6d7] rounded text-[#505f76] font-mono text-[11px]">
              Cmd+K
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-[#505f76]">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 pl-3 pr-8 bg-[#f9f9ff] border border-[#c3c6d7] rounded-lg text-[14px] text-[#111c2d] appearance-none focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all cursor-pointer"
              >
                <option>All Categories</option>
                <option>Clients</option>
                <option>Vendors</option>
                <option>Partners</option>
                <option>Internal</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#737686] pointer-events-none text-[20px]">
                expand_more
              </span>
            </div>
          </div>

          {/* Date Added */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-[#505f76]">Date Added</label>
            <div className="relative">
              <input
                type="date"
                value={dateAdded}
                onChange={(e) => setDateAdded(e.target.value)}
                className="w-full h-10 pl-3 pr-3 bg-[#f9f9ff] border border-[#c3c6d7] rounded-lg text-[14px] text-[#111c2d] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Last Contacted */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-[#505f76]">Last Contacted</label>
            <div className="relative">
              <select
                value={lastContacted}
                onChange={(e) => setLastContacted(e.target.value)}
                className="w-full h-10 pl-3 pr-8 bg-[#f9f9ff] border border-[#c3c6d7] rounded-lg text-[14px] text-[#111c2d] appearance-none focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all cursor-pointer"
              >
                <option>Anytime</option>
                <option>Past 7 Days</option>
                <option>Past 30 Days</option>
                <option>Past 90 Days</option>
                <option>Over 1 Year</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#737686] pointer-events-none text-[20px]">
                expand_more
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-[#505f76]">Tags</label>
            <div className="relative">
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. VIP, Priority"
                className="w-full h-10 pl-3 pr-3 bg-[#f9f9ff] border border-[#c3c6d7] rounded-lg text-[14px] text-[#111c2d] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Filter Action Buttons */}
        <div className="mt-5 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 text-[14px] text-[#505f76] hover:bg-[#e7eeff] rounded-lg transition-colors active:translate-y-px cursor-pointer"
          >
            Clear Filters
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-[#004ac6] text-white text-[14px] font-medium rounded-lg hover:bg-[#003ea8] transition-all active:translate-y-px shadow-xs cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* KPI Cards (Column 1) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Total Contacts KPI */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-xs flex items-center justify-between group hover:border-[#b4c5ff] transition-colors">
            <div>
              <p className="font-mono text-[12px] text-[#505f76] uppercase tracking-wider mb-1">
                TOTAL CONTACTS
              </p>
              <p className="font-headline text-[32px] md:text-[36px] leading-[40px] font-bold text-[#111c2d]">
                {totalContacts.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#dee8ff] flex items-center justify-center text-[#004ac6] group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[26px]">contacts</span>
            </div>
          </div>

          {/* Top Category KPI */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-xs flex items-center justify-between group hover:border-[#b4c5ff] transition-colors">
            <div>
              <p className="font-mono text-[12px] text-[#505f76] uppercase tracking-wider mb-1">
                TOP CATEGORY
              </p>
              <p className="font-headline text-[22px] font-semibold text-[#111c2d]">
                {analytics?.top_category?.name || 'Clients'}
              </p>
              <p className="text-[13px] text-[#505f76] mt-0.5">
                {analytics?.top_category?.percentage || 45}% of total
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#dee8ff] flex items-center justify-center text-[#004ac6] group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[26px]">star</span>
            </div>
          </div>

          {/* Recently Added Card */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-xs flex flex-col group hover:border-[#b4c5ff] transition-colors">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#c3c6d7]/40">
              <p className="font-mono text-[12px] text-[#505f76] uppercase tracking-wider">
                RECENTLY ADDED
              </p>
              <button
                type="button"
                onClick={onViewAllContacts}
                className="text-[#004ac6] text-[13px] font-medium hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {recentlyAdded.map((contact, i) => {
                const initials = contact.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();
                const colors = [
                  'bg-[#d0e1fb] text-[#003e73]',
                  'bg-[#e0e3e5] text-[#191c1e]',
                  'bg-[#b4c5ff] text-[#00174b]',
                  'bg-[#dbe1ff] text-[#004ac6]',
                ];
                return (
                  <div
                    key={contact.id}
                    onClick={() => onSelectContact(contact.id)}
                    className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors cursor-pointer"
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${
                        colors[i % colors.length]
                      } flex items-center justify-center font-bold text-[12px] shrink-0`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-[#111c2d] leading-tight truncate">
                        {contact.name}
                      </p>
                      <p className="text-[12px] text-[#505f76]">
                        {contact.category} • {i === 0 ? '2 hrs ago' : i === 1 ? '1 day ago' : '3 days ago'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contact Distribution Chart (Columns 2-3) */}
        <div className="lg:col-span-2 bg-white border border-[#c3c6d7] rounded-xl p-4 md:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#c3c6d7]/50">
            <h3 className="font-headline text-[18px] font-semibold text-[#111c2d] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004ac6]">bar_chart</span>
              <span>Contact Distribution</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#004ac6]"></span>
              <span className="font-mono text-[12px] text-[#505f76]">Count</span>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="flex-1 flex items-end justify-around gap-4 pt-10 pb-4 relative min-h-[260px]">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-25">
              <div className="w-full border-b border-[#c3c6d7] h-0"></div>
              <div className="w-full border-b border-[#c3c6d7] h-0"></div>
              <div className="w-full border-b border-[#c3c6d7] h-0"></div>
              <div className="w-full border-b border-[#c3c6d7] h-0"></div>
            </div>

            {/* Render Distribution Bars */}
            {distribution.map((item: DistributionItem, idx: number) => {
              const heightPercent = Math.max(15, Math.round((item.count / maxCount) * 85));
              const opacities = ['opacity-100', 'opacity-80', 'opacity-60', 'opacity-40'];

              return (
                <div
                  key={item.category}
                  onMouseEnter={() => setHoveredBar(item.category)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="flex flex-col items-center gap-2 z-10 w-full group max-w-[80px]"
                >
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full bg-[#004ac6] ${opacities[idx % opacities.length]} rounded-t-sm hover:bg-[#2563eb] transition-all relative cursor-pointer shadow-xs`}
                  >
                    {/* Tooltip on hover */}
                    <div
                      className={`absolute -top-9 left-1/2 -translate-x-1/2 bg-[#263143] text-white px-2.5 py-1 rounded text-[11px] font-mono transition-opacity whitespace-nowrap shadow-md z-20 ${
                        hoveredBar === item.category ? 'opacity-100 scale-105' : 'opacity-0 pointer-events-none'
                      }`}
                    >
                      {item.count} ({Math.round((item.count / totalContacts) * 100)}%)
                    </div>
                  </div>
                  <span className="font-mono text-[12px] text-[#505f76] text-center truncate w-full">
                    {item.category}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-[#c3c6d7]/40 flex justify-between items-center text-[12px] text-[#505f76] font-mono">
            <span>Real-Time Category Distribution</span>
            <span>Sub-millisecond WAL Query</span>
          </div>
        </div>
      </div>
    </div>
  );
};
