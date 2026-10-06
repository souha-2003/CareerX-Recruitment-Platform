import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  Users,
  Search,
  Briefcase,
  MapPin,
  Calendar,
  ChevronRight,
  ArrowRight,
  Filter,
  X,
  Clock,
  CheckCircle2,
  Award,
  Video,
  Eye,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import useTranslation from '@/hooks/useTranslation';

export default function Applicants({
  applications,
  companyJobs = [],
  cities = [],
  counts = {},
  filters = {},
}) {
  const { __, locale, isRtl } = useTranslation();

  const [viewMode, setViewMode] = useState('table'); 
  const [search, setSearch] = useState(filters.search || '');
  const [jobId, setJobId] = useState(filters.job_id || '');
  const [status, setStatus] = useState(filters.status || '');
  const [experience, setExperience] = useState(filters.experience || '');
  const [cityId, setCityId] = useState(filters.city_id || '');

  const applyFilters = (newFilters = {}) => {
    const query = {
      search: newFilters.search !== undefined ? newFilters.search : search,
      job_id: newFilters.job_id !== undefined ? newFilters.job_id : jobId,
      status: newFilters.status !== undefined ? newFilters.status : status,
      experience: newFilters.experience !== undefined ? newFilters.experience : experience,
      city_id: newFilters.city_id !== undefined ? newFilters.city_id : cityId,
    };

    Object.keys(query).forEach((k) => {
      if (!query[k]) delete query[k];
    });

    router.get(`/${locale}/employer/applicants`, query, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };

  const handleStatusClick = (selectedStatus) => {
    setStatus(selectedStatus);
    applyFilters({ status: selectedStatus });
  };

  const clearFilters = () => {
    setSearch('');
    setJobId('');
    setStatus('');
    setExperience('');
    setCityId('');
    router.get(`/${locale}/employer/applicants`);
  };

  const hasActiveFilters = Boolean(search || jobId || status || experience || cityId);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'interview_success':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: __('Success Interview'),
        };
      case 'interview_failed':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          label: __('Failed Interview'),
        };
      case 'accepted':
      case 'interview':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: __('Interview'),
        };
      case 'reviewed':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: __('Review'),
        };
      case 'rejected':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          label: __('Rejected'),
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          label: __('Applied'),
        };
    }
  };

  const statusPills = [
    { key: '', label: __('All Candidates'), count: counts.total || 0 },
    { key: 'applied', label: __('Applied'), count: counts.applied || 0 },
    { key: 'reviewed', label: __('Review'), count: counts.reviewed || 0 },
    { key: 'interview', label: __('Interview'), count: counts.interview || 0 },
    { key: 'interview_success', label: __('Success Interview'), count: counts.interview_success || 0 },
    { key: 'interview_failed', label: __('Failed Interview'), count: counts.interview_failed || 0 },
    { key: 'rejected', label: __('Rejected'), count: counts.rejected || 0 },
  ];

  return (
    <DashboardLayout userRole="employer">
      <Head title={__('Job Applicants')} />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {__('Candidate Applications')}
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              {__('Track, filter, and review applications across your job openings.')}
            </p>
          </div>

          <div className="inline-flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title={__('Table View')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#008A7B] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              <span>{__('Table View')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title={__('Grid View')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#008A7B] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>{__('Grid View')}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {statusPills.map((pill) => {
            const isActive = status === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => handleStatusClick(pill.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#008A7B] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-4 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={__('Search by candidate name...')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#008A7B] focus:ring-1 focus:ring-[#008A7B] transition-all ps-9"
              />
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-3" />
            </div>

            <div className="lg:col-span-3">
              <select
                value={jobId}
                onChange={(e) => {
                  setJobId(e.target.value);
                  applyFilters({ job_id: e.target.value });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#008A7B] transition-all cursor-pointer"
              >
                <option value="">{__('Filter by Job (All)')}</option>
                {companyJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={experience}
                onChange={(e) => {
                  setExperience(e.target.value);
                  applyFilters({ experience: e.target.value });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#008A7B] transition-all cursor-pointer"
              >
                <option value="">{__('Experience (Any)')}</option>
                <option value="1">1+ {__('Years')}</option>
                <option value="3">3+ {__('Years')}</option>
                <option value="5">5+ {__('Years')}</option>
                <option value="8">8+ {__('Years')}</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={cityId}
                onChange={(e) => {
                  setCityId(e.target.value);
                  applyFilters({ city_id: e.target.value });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#008A7B] transition-all cursor-pointer"
              >
                <option value="">{__('Location (Any)')}</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1 flex items-center gap-1.5">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#008A7B] text-white hover:bg-[#014D55] transition-all flex items-center justify-center cursor-pointer shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  title={__('Clear Filters')}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {applications?.data && applications.data.length > 0 ? (
          viewMode === 'table' ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-start border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-500 uppercase tracking-wider text-start">
                      <th className="py-4 px-5 text-start">{__('Candidate')}</th>
                      <th className="py-4 px-5 text-start">{__('Position Applied For')}</th>
                      <th className="py-4 px-5 text-start">{__('Experience')}</th>
                      <th className="py-4 px-5 text-start">{__('Applied Date')}</th>
                      <th className="py-4 px-5 text-start">{__('Status')}</th>
                      <th className="py-4 px-5 text-center">{__('Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {applications.data.map((app) => {
                      const statusInfo = getStatusBadge(app.status);
                      const candidate = app.profile?.user;
                      const locationText = [app.profile?.city?.name, app.profile?.country?.name]
                        .filter(Boolean)
                        .join(', ');

                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3.5">
                              {candidate?.avatar ? (
                                <img
                                  src={
                                    candidate.avatar.startsWith('http')
                                      ? candidate.avatar
                                      : `/storage/${candidate.avatar}`
                                  }
                                  alt={candidate.name}
                                  className="w-10 h-10 rounded-2xl object-cover border border-slate-100 shrink-0 bg-slate-50 shadow-xs"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-2xl bg-[#014D55] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                                  {candidate?.name ? candidate.name.slice(0, 2).toUpperCase() : 'CA'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <Link
                                  href={`/${locale}/employer/applicants/${app.id}`}
                                  className="font-bold text-slate-900 hover:text-[#008A7B] transition-colors block truncate"
                                >
                                  {candidate?.name || __('Candidate')}
                                </Link>
                                <span className="text-[11px] text-slate-400 font-medium block truncate mt-0.5">
                                  {candidate?.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-5">
                            <div>
                              <span className="font-bold text-slate-800 block truncate">
                                {app.job_post?.title || __('Job')}
                              </span>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
                                {app.job_post?.job_type && <span>{app.job_post.job_type}</span>}
                                {app.job_post?.work_type && <span>• {app.job_post.work_type}</span>}
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-5">
                            <div className="space-y-1">
                              {app.profile?.years_of_experience !== undefined && app.profile?.years_of_experience !== null ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                                  <Award className="w-3 h-3 text-slate-400" />
                                  {app.profile.years_of_experience} {__('Years')}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">-</span>
                              )}
                              {locationText && (
                                <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{locationText}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-5 whitespace-nowrap text-slate-600 font-medium text-[11px]">
                            {app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}
                          </td>

                          <td className="py-4 px-5">
                            <div className="flex flex-col gap-1.5 items-start">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.bg}`}
                              >
                                {statusInfo.label}
                              </span>

                              {app.meeting_link && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 font-bold text-[10px] border border-blue-200">
                                  <Video className="w-3 h-3 text-blue-600" />
                                  <span>{__('Interview')}</span>
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-5 text-center">
                            <Link
                              href={`/${locale}/employer/applicants/${app.id}`}
                              title={__('Review Application')}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#008A7B] hover:text-white transition-all shadow-xs cursor-pointer group/btn"
                            >
                              <Eye className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {applications.data.map((app) => {
                const statusInfo = getStatusBadge(app.status);
                const candidate = app.profile?.user;
                const locationText = [app.profile?.city?.name, app.profile?.country?.name]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.bg}`}
                        >
                          {statusInfo.label}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">
                          {app.created_at ? new Date(app.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>

                      <div className="flex items-start gap-3.5 mb-4">
                        {candidate?.avatar ? (
                          <img
                            src={
                              candidate.avatar.startsWith('http')
                                ? candidate.avatar
                                : `/storage/${candidate.avatar}`
                            }
                            alt={candidate.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shrink-0 bg-slate-50"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-[#014D55] text-white font-black text-lg flex items-center justify-center shrink-0">
                            {candidate?.name ? candidate.name.slice(0, 2).toUpperCase() : 'CA'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-black text-slate-900 truncate group-hover:text-[#008A7B] transition-colors">
                            {candidate?.name || __('Candidate')}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                            {candidate?.email}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-3 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Briefcase className="w-3.5 h-3.5 text-[#008A7B] shrink-0" />
                          <span className="truncate">{app.job_post?.title || __('Job')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                          {app.job_post?.job_type && <span>{app.job_post.job_type}</span>}
                          {app.job_post?.work_type && <span>• {app.job_post.work_type}</span>}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {app.profile?.years_of_experience !== undefined && app.profile?.years_of_experience !== null && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            <Award className="w-3 h-3 text-slate-500" />
                            {app.profile.years_of_experience} {__('Years Experience')}
                          </span>
                        )}
                        {locationText && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {locationText}
                          </span>
                        )}
                      </div>

                      {app.meeting_link && (
                        <div className="mt-3 p-2 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-blue-600" />
                            <span>{__('Google Meet Scheduled')}</span>
                          </span>
                          {app.interview_date && (
                            <span className="text-[10px] text-blue-700 font-semibold">
                              {new Date(app.interview_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/${locale}/employer/applicants/${app.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-[#008A7B] transition-all cursor-pointer shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{__('Review Application')}</span>
                      {isRtl ? <ArrowRight className="w-3.5 h-3.5 rotate-180" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </Link>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1">
              {__('No applications found')}
            </h3>
            <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mb-5">
              {__('Try adjusting your search criteria or filter to see more candidates.')}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#008A7B] text-white hover:bg-[#014D55] transition-all cursor-pointer shadow-sm"
              >
                {__('Clear Filters')}
              </button>
            )}
          </div>
        )}

        {applications?.links && applications.links.length > 3 && (
          <div className="flex items-center justify-center gap-1.5 pt-4">
            {applications.links.map((lnk, idx) => (
              <Link
                key={idx}
                href={lnk.url || '#'}
                dangerouslySetInnerHTML={{ __html: lnk.label }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  lnk.active
                    ? 'bg-[#008A7B] text-white'
                    : lnk.url
                    ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
