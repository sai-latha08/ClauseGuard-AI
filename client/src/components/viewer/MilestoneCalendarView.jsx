import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarPlus,
  Download,
  Bell,
  Share2,
  Send,
  CreditCard,
  ShieldAlert,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

export const MilestoneCalendarView = ({
  documentName = "Agreement",
  milestones = [],
  renewalInfo = {},
  riskScore = 50
}) => {
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline', 'calendar', 'alerts'
  const [selectedMilestone, setSelectedMilestone] = useState(milestones[0] || null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [slackSent, setSlackSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [reminderConfig, setReminderConfig] = useState({
    days90: true,
    days60: true,
    days30: true,
    days7: true,
    email: 'executive-team@company.com',
    slackChannel: '#legal-contracts-alerts'
  });

  const isAutoRenew = renewalInfo?.isAutoRenew || milestones.some(m => m.category?.includes('renewal'));
  const noticeDays = renewalInfo?.noticePeriodDays || 30;
  const renewalCutoffDate = renewalInfo?.renewalCutoffDate || 'October 15, 2026';
  const effectiveDate = renewalInfo?.effectiveDate || 'Today';
  const expirationDate = renewalInfo?.expirationDate || '12 Months from Activation';
  const paymentTerms = renewalInfo?.paymentTerms || 'Standard Recurring Billing';

  // Helper to format dates for iCal / Google Calendar (YYYYMMDD)
  const formatForGoogleCal = (title, desc, dateStr) => {
    try {
      const parsed = dateStr ? new Date(dateStr) : new Date();
      const validDate = isNaN(parsed.getTime()) ? new Date(Date.now() + 300 * 86400000) : parsed;
      const startStr = validDate.toISOString().replace(/-|:|\.\d+/g, '').substring(0, 8);
      const endStr = new Date(validDate.getTime() + 86400000).toISOString().replace(/-|:|\.\d+/g, '').substring(0, 8);
      
      const gUrl = new URL('https://calendar.google.com/calendar/render');
      gUrl.searchParams.set('action', 'TEMPLATE');
      gUrl.searchParams.set('text', `[ClauseGuard Alert] ${title} - ${documentName}`);
      gUrl.searchParams.set('details', `${desc}\n\nGoverning Contract: ${documentName}\nContract Risk Score: ${riskScore}/100\nAutomated Alert by ClauseGuard AI.`);
      gUrl.searchParams.set('dates', `${startStr}/${endStr}`);
      return gUrl.toString();
    } catch (e) {
      return 'https://calendar.google.com';
    }
  };

  const formatForOutlook = (title, desc, dateStr) => {
    try {
      const parsed = dateStr ? new Date(dateStr) : new Date();
      const validDate = isNaN(parsed.getTime()) ? new Date(Date.now() + 300 * 86400000) : parsed;
      const isoStart = validDate.toISOString();
      const isoEnd = new Date(validDate.getTime() + 86400000).toISOString();

      const oUrl = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
      oUrl.searchParams.set('path', '/calendar/action/compose');
      oUrl.searchParams.set('subject', `[ClauseGuard Alert] ${title} - ${documentName}`);
      oUrl.searchParams.set('body', `${desc}\n\nGoverning Contract: ${documentName}\nManaged with ClauseGuard AI.`);
      oUrl.searchParams.set('startdt', isoStart);
      oUrl.searchParams.set('enddt', isoEnd);
      return oUrl.toString();
    } catch (e) {
      return 'https://outlook.live.com';
    }
  };

  // Generate universal .ics calendar file
  const downloadIcsFile = (milestoneList = milestones) => {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ClauseGuard AI//Contract Milestone Tracker//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    const eventsToExport = Array.isArray(milestoneList) && milestoneList.length > 0 ? milestoneList : milestones;

    eventsToExport.forEach((m, idx) => {
      const parsed = m.dateString ? new Date(m.dateString) : new Date(Date.now() + (idx + 1) * 30 * 86400000);
      const valid = isNaN(parsed.getTime()) ? new Date() : parsed;
      const dateTag = valid.toISOString().replace(/-|:|\.\d+/g, '').substring(0, 8);
      const nextDayTag = new Date(valid.getTime() + 86400000).toISOString().replace(/-|:|\.\d+/g, '').substring(0, 8);

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:clauseguard-${m.id || idx}-${Date.now()}@clauseguard.ai`,
        `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d+/g, '').substring(0, 15)}Z`,
        `DTSTART;VALUE=DATE:${dateTag}`,
        `DTEND;VALUE=DATE:${nextDayTag}`,
        `SUMMARY:[ClauseGuard Alert] ${m.title} (${documentName})`,
        `DESCRIPTION:${(m.description || '').replace(/\n/g, ' ')} - Action: ${(m.actionRequired || '').replace(/\n/g, ' ')}`,
        'STATUS:CONFIRMED',
        'TRANSP:TRANSPARENT',
        'BEGIN:VALARM',
        'TRIGGER:-P7D',
        'DESCRIPTION:Contract Milestone Reminder (7 Days Prior)',
        'ACTION:DISPLAY',
        'END:VALARM',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${documentName.replace(/[^a-zA-Z0-9]/g, '_')}_Milestones.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSimulateSlack = () => {
    setSlackSent(true);
    setTimeout(() => setSlackSent(false), 4000);
  };

  const handleSimulateEmail = () => {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 4000);
  };

  const urgencyStyles = {
    CRITICAL: {
      badge: 'bg-rose-100 text-rose-900 border-rose-300',
      card: 'bg-rose-50/70 border-rose-200 hover:border-rose-400',
      dot: 'bg-rose-600 ring-4 ring-rose-100',
      text: 'text-rose-700'
    },
    HIGH: {
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      card: 'bg-amber-50/70 border-amber-200 hover:border-amber-400',
      dot: 'bg-amber-600 ring-4 ring-amber-100',
      text: 'text-amber-700'
    },
    MEDIUM: {
      badge: 'bg-blue-100 text-blue-900 border-blue-300',
      card: 'bg-blue-50/60 border-blue-200 hover:border-blue-400',
      dot: 'bg-blue-600 ring-4 ring-blue-100',
      text: 'text-blue-700'
    },
    LOW: {
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      card: 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-400',
      dot: 'bg-emerald-600 ring-4 ring-emerald-100',
      text: 'text-emerald-700'
    },
    INFO: {
      badge: 'bg-slate-100 text-slate-800 border-slate-300',
      card: 'bg-slate-50 border-slate-200 hover:border-slate-300',
      dot: 'bg-slate-500 ring-4 ring-slate-100',
      text: 'text-slate-700'
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Notice Window & Auto-Renewal Alert Card */}
      <div className={`p-6 rounded-2xl border shadow-xs transition-all ${
        isAutoRenew 
          ? 'bg-gradient-to-br from-amber-50/90 via-cream-50 to-white border-amber-300' 
          : 'bg-white border-cream-300'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isAutoRenew ? 'bg-amber-500 text-white' : 'bg-burgundy-800 text-cream-100'
            }`}>
              {isAutoRenew ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isAutoRenew ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-cream-200 text-burgundy-900 border-cream-300'
                }`}>
                  {isAutoRenew ? 'Auto-Renewal Notice Window Detected' : 'Fixed Term Agreement'}
                </span>
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  {noticeDays > 0 ? `${noticeDays}-Day Notice Policy` : 'Standard Expiration'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-burgundy-950 mt-1">
                {isAutoRenew
                  ? `Mandatory Cancellation Notice Required Before ${renewalCutoffDate}`
                  : `Fixed Term Expires on ${expirationDate}`}
              </h3>
              <p className="text-xs text-burgundy-900/80 mt-1 max-w-2xl leading-relaxed">
                {isAutoRenew
                  ? `Failure to give written non-renewal notice at least ${noticeDays} days in advance locks in successive recurring billing cycles automatically.`
                  : `This contract does not contain an automatic evergreen renewal clause and ceases at expiration unless extended by mutual addendum.`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <button
              onClick={() => downloadIcsFile()}
              className="px-4 py-2.5 rounded-xl bg-burgundy-800 hover:bg-burgundy-900 text-cream-50 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-cream-200" />
              <span>Export All to iCal (.ics)</span>
            </button>
            <span className="text-[11px] text-slate-500 text-center sm:text-right">
              Syncs to Google, Apple & Outlook
            </span>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-cream-300/80">
          <div className="p-3 rounded-xl bg-white border border-cream-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-slate-500">Effective Date</span>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{effectiveDate}</p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-cream-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-amber-700">Cancellation Deadline</span>
            <p className="text-xs font-bold text-amber-900 mt-0.5 truncate">{renewalCutoffDate}</p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-cream-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-slate-500">Term Expiration</span>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{expirationDate}</p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-cream-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-slate-500">Payment Terms</span>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{paymentTerms}</p>
          </div>
        </div>
      </div>

      {/* 2. Navigation Mode Tabs */}
      <div className="flex items-center justify-between border-b border-cream-300 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-cream-200/70 rounded-xl border border-cream-300">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'timeline'
                ? 'bg-white text-burgundy-950 shadow-xs'
                : 'text-burgundy-900/70 hover:text-burgundy-950'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Visual Timeline</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-white text-burgundy-950 shadow-xs'
                : 'text-burgundy-900/70 hover:text-burgundy-950'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Interactive Calendar</span>
          </button>
          <button
            onClick={() => setViewMode('alerts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'alerts'
                ? 'bg-white text-burgundy-950 shadow-xs'
                : 'text-burgundy-900/70 hover:text-burgundy-950'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>Sync & Alert Channels</span>
          </button>
        </div>

        <span className="text-xs font-medium text-slate-500 hidden sm:inline">
          {milestones.length} Milestones Tracked
        </span>
      </div>

      {/* 3. Tab View 1: Visual Timeline */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-cream-300">
            {milestones.map((milestone, idx) => {
              const style = urgencyStyles[milestone.urgency] || urgencyStyles.INFO;
              const isSelected = selectedMilestone?.id === milestone.id;

              return (
                <div key={milestone.id || idx} className="relative group">
                  {/* Timeline Dot Indicator */}
                  <div className={`absolute -left-6 sm:-left-8 top-3.5 w-3.5 h-3.5 rounded-full ${style.dot} transition-transform group-hover:scale-125`} />

                  {/* Milestone Card */}
                  <div
                    onClick={() => setSelectedMilestone(milestone)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-burgundy-500 shadow-md ring-2 ring-burgundy-400/20'
                        : `${style.card} bg-white shadow-2xs`
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${style.badge}`}>
                          {milestone.urgency}
                        </span>
                        <h4 className="text-sm font-bold text-burgundy-950">{milestone.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-500">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{milestone.dateString}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {milestone.description}
                    </p>

                    {milestone.actionRequired && (
                      <div className="mt-3 p-3 rounded-xl bg-cream-100/70 border border-cream-200 text-xs text-burgundy-950 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-burgundy-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-burgundy-900">Required Action:</strong> {milestone.actionRequired}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                      <a
                        href={formatForGoogleCal(milestone.title, milestone.description, milestone.dateString)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <CalendarPlus className="w-3 h-3 text-blue-600" />
                        <span>Google Calendar</span>
                      </a>

                      <a
                        href={formatForOutlook(milestone.title, milestone.description, milestone.dateString)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-cyan-600" />
                        <span>Outlook</span>
                      </a>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadIcsFile([milestone]);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3 h-3 text-slate-600" />
                        <span>iCal (.ics)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Tab View 2: Interactive Calendar Grid */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-2xl border border-cream-300 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-burgundy-950">Contract Governance Calendar Schedule</h4>
              <p className="text-xs text-slate-500">Upcoming milestone obligations mapped across active contract life-cycle</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-burgundy-800 bg-cream-100 px-3 py-1 rounded-lg border border-cream-300">
                12-Month Projection
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestones.map((m, idx) => {
              const style = urgencyStyles[m.urgency] || urgencyStyles.INFO;
              return (
                <div
                  key={m.id || idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${style.card} bg-white`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${style.badge}`}>
                        {m.urgency}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        {m.dateString}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">{m.title}</h5>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{m.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">1-Click Sync:</span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={formatForGoogleCal(m.title, m.description, m.dateString)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md hover:bg-slate-100 text-blue-600"
                        title="Add to Google Calendar"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={formatForOutlook(m.title, m.description, m.dateString)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md hover:bg-slate-100 text-cyan-600"
                        title="Add to Outlook"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Tab View 3: Sync & Alert Channels Setup */}
      {viewMode === 'alerts' && (
        <div className="bg-white rounded-2xl border border-cream-300 p-6 shadow-xs space-y-6">
          <div>
            <h4 className="text-sm font-bold text-burgundy-950 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              Automated 30 / 60 / 90 Day Renewal Alert Dispatcher
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure automatic proactive reminders delivered to your executive inbox or Slack channels before non-renewal deadlines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alert Schedule Checkboxes */}
            <div className="p-5 rounded-xl bg-cream-100/50 border border-cream-200 space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-burgundy-900">
                Pre-Renewal Reminder Intervals
              </h5>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderConfig.days90}
                    onChange={(e) => setReminderConfig({ ...reminderConfig, days90: e.target.checked })}
                    className="mt-0.5 rounded text-burgundy-800 focus:ring-burgundy-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900">90 Days Prior: Strategic Audit Alert</span>
                    <p className="text-[11px] text-slate-500">Initiate internal software utilization and market alternative review.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderConfig.days60}
                    onChange={(e) => setReminderConfig({ ...reminderConfig, days60: e.target.checked })}
                    className="mt-0.5 rounded text-burgundy-800 focus:ring-burgundy-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900">60 Days Prior: Commercial Renegotiation Alert</span>
                    <p className="text-[11px] text-slate-500">Request updated rate cards and negotiate price escalation caps.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderConfig.days30}
                    onChange={(e) => setReminderConfig({ ...reminderConfig, days30: e.target.checked })}
                    className="mt-0.5 rounded text-burgundy-800 focus:ring-burgundy-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-rose-900">30 Days Prior: Critical Cancellation Cutoff Alert</span>
                    <p className="text-[11px] text-slate-500">Mandatory window to dispatch formal cancellation notice before auto-lock-in.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderConfig.days7}
                    onChange={(e) => setReminderConfig({ ...reminderConfig, days7: e.target.checked })}
                    className="mt-0.5 rounded text-burgundy-800 focus:ring-burgundy-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900">7 Days Prior: Final Confirmation Notice</span>
                    <p className="text-[11px] text-slate-500">Verify confirmation receipt of cancellation from vendor representative.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Notification Integrations Simulation */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-blue-600" />
                    Email Notification Dispatch
                  </span>
                  <button
                    type="button"
                    onClick={handleSimulateEmail}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    {emailSent ? '✓ Alert Dispatched' : 'Send Test Alert'}
                  </button>
                </div>
                <input
                  type="email"
                  value={reminderConfig.email}
                  onChange={(e) => setReminderConfig({ ...reminderConfig, email: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  placeholder="legal@company.com"
                />
                {emailSent && (
                  <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                    Proactive 30/60/90 day reminder scheduled to {reminderConfig.email}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-purple-600" />
                    Slack Webhook Channel Alert
                  </span>
                  <button
                    type="button"
                    onClick={handleSimulateSlack}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                  >
                    {slackSent ? '✓ Webhook Triggered' : 'Test Slack Alert'}
                  </button>
                </div>
                <input
                  type="text"
                  value={reminderConfig.slackChannel}
                  onChange={(e) => setReminderConfig({ ...reminderConfig, slackChannel: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  placeholder="#legal-contract-alerts"
                />
                {slackSent && (
                  <div className="text-[11px] text-purple-900 bg-purple-50 p-2.5 rounded-lg border border-purple-200 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <span>🤖 ClauseGuard Bot in {reminderConfig.slackChannel}:</span>
                    </div>
                    <p className="font-mono text-[10px] text-purple-800">
                      "🚨 ALERT: Non-Renewal Notice Cutoff for {documentName} in 30 days ({renewalCutoffDate}). Action Required: Submit cancellation letter."
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
