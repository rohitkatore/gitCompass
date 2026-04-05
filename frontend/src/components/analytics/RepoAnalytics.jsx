import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Users,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Clock,
  GitPullRequest,
  BarChart2,
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { repositoryAPI } from '../../api/axios';
import { cn } from '../../lib/utils';

// ─── Score ring (SVG-based) ─────────────────────────────────────────────────

const ScoreRing = ({ score, size = 80 }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 65 ? '#10b981' : score >= 35 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      {/* Background track */}
      <circle cx="40" cy="40" r={radius} fill="none" stroke="#27272a" strokeWidth="8" />
      {/* Progress arc */}
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      {/* Score text */}
      <text x="40" y="44" textAnchor="middle" fill={color} fontSize="16" fontWeight="700">
        {score}
      </text>
    </svg>
  );
};

// ─── Contributor bar chart ───────────────────────────────────────────────────

const ContributorChart = ({ contributors }) => {
  if (!contributors?.length) return null;
  const max = contributors[0].contributions;

  return (
    <div className="space-y-2">
      {contributors.slice(0, 6).map((c) => (
        <div key={c.login} className="flex items-center gap-2">
          <img
            src={c.avatarUrl}
            alt={c.login}
            className="w-5 h-5 rounded-full border border-zinc-700 shrink-0"
          />
          <a
            href={c.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-24 shrink-0 text-xs text-zinc-400 hover:text-indigo-400 transition-colors truncate"
          >
            {c.login}
          </a>
          <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(c.contributions / max) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-indigo-500 rounded-full"
            />
          </div>
          <span className="text-[10px] text-zinc-500 w-10 text-right shrink-0">
            {c.contributions.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Verdict badge ───────────────────────────────────────────────────────────

const VERDICT_STYLES = {
  'Production Ready': {
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  'Moderate Maturity': {
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    text: 'text-yellow-400',
    dot: 'bg-yellow-400',
  },
  'Needs Evaluation': {
    bg: 'bg-red-500/10 border-red-500/30',
    text: 'text-red-400',
    dot: 'bg-red-400',
  },
};

const VerdictBadge = ({ label }) => {
  const styles = VERDICT_STYLES[label] ?? VERDICT_STYLES['Needs Evaluation'];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        styles.bg,
        styles.text
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
      {label}
    </span>
  );
};

// ─── Severity badge ──────────────────────────────────────────────────────────

const SEVERITY_COLORS = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  low: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  unknown: 'text-zinc-400 bg-zinc-700/30 border-zinc-600/30',
};

const SeverityBadge = ({ severity }) => (
  <span
    className={cn(
      'px-1.5 py-0.5 rounded text-[10px] font-semibold border uppercase',
      SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.unknown
    )}
  >
    {severity}
  </span>
);

// ─── License badge ───────────────────────────────────────────────────────────

const LicenseBadge = ({ licenseInfo }) => {
  if (!licenseInfo) return null;
  const isPermissive = licenseInfo.type === 'permissive';
  const isCopyleft = licenseInfo.type === 'copyleft';
  const isWeakCopyleft = licenseInfo.type === 'weak-copyleft';

  const style = isPermissive
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : isCopyleft
    ? 'text-red-400 bg-red-500/10 border-red-500/30'
    : isWeakCopyleft
    ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    : 'text-zinc-400 bg-zinc-700/30 border-zinc-600/30';

  return (
    <span className={cn('px-2 py-0.5 rounded border text-xs font-semibold', style)}>
      {licenseInfo.spdxId}
    </span>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const RepoAnalytics = ({ owner, repo }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showVulns, setShowVulns] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await repositoryAPI.getAnalytics(owner, repo);
      setAnalytics(response.data);
    } catch (err) {
      setError(
        err?.response?.status === 404
          ? 'Repository not found.'
          : 'Failed to load analytics. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Not yet loaded ──────────────────────────────────────────────
  if (!analytics && !loading && !error) {
    return (
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Repository Deep-Dive Analytics</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                AI health report: maintenance score, contributor diversity, vulnerabilities &amp; license
              </p>
            </div>
          </div>
          <Button size="sm" icon={Sparkles} onClick={fetchAnalytics}>
            Run Health Report
          </Button>
        </div>
      </Card>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-100">Running Health Report…</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Fetching data and generating AI verdict</p>
          </div>
        </div>
        <div className="space-y-2">
          {[80, 60, 72, 48].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded-full bg-zinc-800 animate-pulse"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </Card>
    );
  }

  // ── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-zinc-400">{error}</p>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchAnalytics}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  // ── Populated ────────────────────────────────────────────────────
  const {
    maintenanceScore,
    maintenanceBreakdown,
    contributors,
    diversityScore,
    vulnerabilities,
    vulnPermissionRequired,
    licenseInfo,
    aiVerdict,
  } = analytics;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-400" />
          Repository Health Report
        </h2>
        <button
          onClick={fetchAnalytics}
          className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
          title="Refresh analytics"
        >
          <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* ── Maintenance Score ─────────────────────────────────── */}
        <Card padding="sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-zinc-300">Maintenance Score</span>
          </div>

          <div className="flex items-center gap-5">
            <ScoreRing score={maintenanceScore} />
            <div className="space-y-1.5 text-xs text-zinc-500 flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  Last commit:{' '}
                  {new Date(maintenanceBreakdown.lastCommitDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 shrink-0" />
                <span>{maintenanceBreakdown.recentCommits} commits (last 30 fetched)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GitPullRequest className="w-3 h-3 shrink-0" />
                <span>
                  Avg PR merge:{' '}
                  {maintenanceBreakdown.avgPRDaysToMerge === 30 &&
                  maintenanceBreakdown.recentCommits === 0
                    ? 'N/A'
                    : `${maintenanceBreakdown.avgPRDaysToMerge}d`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Issue closure rate: {maintenanceBreakdown.issueClosureRate}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Contributor Diversity ─────────────────────────────── */}
        <Card padding="sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-zinc-300">Contributor Diversity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-100">{diversityScore}</span>
              <span className="text-[10px] text-zinc-500">/ 100</span>
            </div>
          </div>

          {contributors.length > 0 ? (
            <ContributorChart contributors={contributors} />
          ) : (
            <p className="text-xs text-zinc-500">Contributor data unavailable.</p>
          )}
        </Card>

        {/* ── Dependency Vulnerabilities ────────────────────────── */}
        <Card padding="sm">
          <div className="flex items-center gap-2 mb-4">
            {vulnerabilities.length > 0 ? (
              <ShieldAlert className="w-4 h-4 text-red-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-xs font-semibold text-zinc-300">Dependency Vulnerabilities</span>
          </div>

          {vulnPermissionRequired && (
            <p className="text-xs text-zinc-500 mb-3">
              Vulnerability scanning requires admin access to the repository. Log in with an
              account that has admin rights for detailed results.
            </p>
          )}

          {!vulnPermissionRequired && vulnerabilities.length === 0 && (
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-zinc-400">No known open vulnerabilities detected.</p>
            </div>
          )}

          {vulnerabilities.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-red-400 font-medium">
                  {vulnerabilities.length} open{' '}
                  {vulnerabilities.length === 1 ? 'vulnerability' : 'vulnerabilities'}
                </span>
                <button
                  onClick={() => setShowVulns((v) => !v)}
                  className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showVulns ? 'Hide' : 'Show'}
                  {showVulns ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>

              <AnimatePresence>
                {showVulns && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pt-1">
                      {vulnerabilities.map((v) => (
                        <div
                          key={v.id}
                          className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs text-zinc-300 leading-relaxed">{v.summary}</p>
                            {v.url && (
                              <a
                                href={v.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 mt-0.5"
                              >
                                <ExternalLink className="w-3 h-3 text-zinc-500 hover:text-zinc-300 transition-colors" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <SeverityBadge severity={v.severity} />
                            <span className="text-[10px] text-zinc-500">
                              {v.packageName} ({v.ecosystem})
                            </span>
                            {v.cvssScore && (
                              <span className="text-[10px] text-zinc-500">
                                CVSS {v.cvssScore}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </Card>

        {/* ── License Compatibility ─────────────────────────────── */}
        <Card padding="sm">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-zinc-300">License Compatibility</span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <LicenseBadge licenseInfo={licenseInfo} />
            <span className="text-xs text-zinc-400 capitalize">{licenseInfo.type}</span>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed">{licenseInfo.note}</p>

          {licenseInfo.compatible === false && licenseInfo.type !== 'unknown' && (
            <div className="flex items-center gap-1.5 mt-3 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <p className="text-[10px] text-red-300">
                This license may restrict commercial or proprietary use. Consult legal counsel.
              </p>
            </div>
          )}

          {licenseInfo.compatible === true && (
            <div className="flex items-center gap-1.5 mt-3 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <p className="text-[10px] text-emerald-300">
                Compatible with commercial and open-source projects.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ── AI Verdict ─────────────────────────────────────────────── */}
      {aiVerdict && (
        <Card padding="sm" className="border-indigo-500/20">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-zinc-300">AI Production Verdict</span>
            </div>
            <VerdictBadge label={aiVerdict.label} />
          </div>

          <p className="text-sm text-zinc-400 leading-relaxed mb-4">{aiVerdict.explanation}</p>

          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            {/* Strengths */}
            {aiVerdict.strengths?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Strengths
                </p>
                <ul className="space-y-1.5">
                  {aiVerdict.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-zinc-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Concerns */}
            {aiVerdict.concerns?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Concerns
                </p>
                <ul className="space-y-1.5">
                  {aiVerdict.concerns.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-zinc-400">
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendation */}
          {aiVerdict.recommendation && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-300 leading-relaxed">
                <span className="font-semibold text-indigo-200">Recommendation: </span>
                {aiVerdict.recommendation}
              </p>
            </div>
          )}
        </Card>
      )}
    </motion.div>
  );
};

export default RepoAnalytics;
