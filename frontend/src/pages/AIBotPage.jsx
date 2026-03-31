import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Code,
  Search,
  GitPullRequest,
  GitMerge,
  ExternalLink,
  Send,
  Copy,
  Check,
  AlertTriangle,
  Lightbulb,
  Shield,
  Bug,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { Card, Button, Spinner } from '../components/ui';
import { aiAPI } from '../api/axios';

const TABS = [
  { id: 'explain', label: 'Explain Code', icon: Code },
  { id: 'review', label: 'Review Code', icon: Search },
  { id: 'pr', label: 'PR Generator', icon: GitPullRequest },
  { id: 'create-pr', label: 'Create PR', icon: GitMerge },
];

const LANGUAGES = [
  'Auto-detect', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#',
  'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'HTML', 'CSS', 'SQL', 'Shell',
];

const AIBotPage = () => {
  const [activeTab, setActiveTab] = useState('explain');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Auto-detect');
  const [diff, setDiff] = useState('');
  const [prContext, setPrContext] = useState('');
  // Create PR tab state
  const [cpOwner, setCpOwner] = useState('');
  const [cpRepo, setCpRepo] = useState('');
  const [cpHead, setCpHead] = useState('');
  const [cpBase, setCpBase] = useState('');
  const [cpDiff, setCpDiff] = useState('');
  const [cpContext, setCpContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  const handleSubmit = async () => {
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const lang = language === 'Auto-detect' ? null : language;
      let response;

      if (activeTab === 'explain') {
        if (!code.trim()) { setError('Please enter some code.'); setLoading(false); return; }
        response = await aiAPI.explain(code, lang);
      } else if (activeTab === 'review') {
        if (!code.trim()) { setError('Please enter some code.'); setLoading(false); return; }
        response = await aiAPI.review(code, lang);
      } else if (activeTab === 'pr') {
        if (!diff.trim()) { setError('Please enter a diff or code changes.'); setLoading(false); return; }
        response = await aiAPI.generatePR({ diff, additionalContext: prContext || undefined });
      } else {
        // create-pr tab
        if (!cpOwner.trim()) { setError('Repository owner is required.'); setLoading(false); return; }
        if (!cpRepo.trim()) { setError('Repository name is required.'); setLoading(false); return; }
        if (!cpHead.trim()) { setError('Head branch is required.'); setLoading(false); return; }
        response = await aiAPI.createPR({
          owner: cpOwner.trim(),
          repo: cpRepo.trim(),
          head: cpHead.trim(),
          base: cpBase.trim() || 'main',
          ...(cpDiff.trim() && { diff: cpDiff.trim() }),
          ...(cpContext.trim() && { additionalContext: cpContext.trim() }),
        });
      }

      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.message || 'Something went wrong.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to get AI response.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTabSwitch = (tabId) => {
    setActiveTab(tabId);
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">AI Code Assistant</h1>
          </div>
          <p className="text-zinc-500 ml-13">
            Explain code, review for issues, or generate PR descriptions — powered by AI.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center bg-zinc-900/60 rounded-lg p-1 border border-zinc-800/50 mb-6">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSwitch(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'text-zinc-100 bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Input Area */}
        <Card className="mb-6">
          {activeTab === 'explain' || activeTab === 'review' ? (
            <>
              {/* Language selector */}
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-1.5">Language</label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full appearance-none bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Code input */}
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-1.5">
                  Paste your code
                </label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your code here..."
                  rows={12}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y placeholder:text-zinc-600"
                  maxLength={10000}
                />
                <p className="text-xs text-zinc-600 mt-1">{code.length} / 10,000 characters</p>
              </div>
            </>
          ) : activeTab === 'pr' ? (
            <>
              {/* Diff input for PR generator */}
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-1.5">
                  Paste your diff or code changes
                </label>
                <textarea
                  value={diff}
                  onChange={(e) => setDiff(e.target.value)}
                  placeholder={"Paste a git diff, e.g. output of `git diff` or code changes..."}
                  rows={12}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y placeholder:text-zinc-600"
                  maxLength={50000}
                />
                <p className="text-xs text-zinc-600 mt-1">{diff.length} / 50,000 characters</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-1.5">
                  Additional context <span className="text-zinc-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={prContext}
                  onChange={(e) => setPrContext(e.target.value)}
                  placeholder="e.g. This fixes the login bug on mobile..."
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-zinc-600"
                />
              </div>
            </>
          ) : (
            /* create-pr tab */
            <>
              <div className="mb-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300">
                Generates an AI-written PR title &amp; description, then creates the pull request directly on GitHub. You must be logged in with a GitHub account that has write access to the target repository.
              </div>
              {/* Row: owner + repo */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Repository owner <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={cpOwner}
                    onChange={(e) => setCpOwner(e.target.value)}
                    placeholder="e.g. octocat"
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Repository name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={cpRepo}
                    onChange={(e) => setCpRepo(e.target.value)}
                    placeholder="e.g. my-project"
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-zinc-600"
                  />
                </div>
              </div>
              {/* Row: head + base */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Head branch <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={cpHead}
                    onChange={(e) => setCpHead(e.target.value)}
                    placeholder="e.g. feature/my-thing"
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Base branch <span className="text-zinc-600">(default: main)</span></label>
                  <input
                    type="text"
                    value={cpBase}
                    onChange={(e) => setCpBase(e.target.value)}
                    placeholder="main"
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-zinc-600"
                  />
                </div>
              </div>
              {/* Optional diff */}
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-1.5">
                  Diff / code changes <span className="text-zinc-600">(optional — auto-fetched from GitHub if omitted)</span>
                </label>
                <textarea
                  value={cpDiff}
                  onChange={(e) => setCpDiff(e.target.value)}
                  placeholder="Paste a git diff here, or leave blank to auto-fetch from GitHub..."
                  rows={6}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y placeholder:text-zinc-600"
                  maxLength={50000}
                />
                <p className="text-xs text-zinc-600 mt-1">{cpDiff.length} / 50,000 characters</p>
              </div>
              {/* Optional additional context */}
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-1.5">
                  Additional context <span className="text-zinc-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={cpContext}
                  onChange={(e) => setCpContext(e.target.value)}
                  placeholder="e.g. Fixes the auth regression from PR #120..."
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-zinc-600"
                />
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            icon={loading ? undefined : Send}
            loading={loading}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? 'Analyzing...'
              : activeTab === 'explain'
                ? 'Explain Code'
                : activeTab === 'review'
                  ? 'Review Code'
                  : activeTab === 'pr'
                    ? 'Generate PR Description'
                    : 'Create Pull Request on GitHub'}
          </Button>
        </Card>

        {/* Results */}
        {loading && (
          <Card className="flex items-center justify-center py-12">
            <div className="text-center">
              <Spinner size="lg" className="mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">AI is thinking...</p>
            </div>
          </Card>
        )}

        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'explain' && <ExplainResult data={result} onCopy={handleCopy} copiedKey={copiedKey} />}
            {activeTab === 'review' && <ReviewResult data={result} onCopy={handleCopy} copiedKey={copiedKey} />}
            {activeTab === 'pr' && <PRResult data={result} onCopy={handleCopy} copiedKey={copiedKey} />}
            {activeTab === 'create-pr' && <CreatePRResult data={result} onCopy={handleCopy} copiedKey={copiedKey} />}
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ─── Explain Result ─────────────────────────────────

const ExplainResult = ({ data, onCopy, copiedKey }) => (
  <Card>
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-amber-400" />
        Explanation
      </h2>
      <button
        onClick={() => onCopy('explanation', data.explanation)}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
      >
        {copiedKey === 'explanation' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copiedKey === 'explanation' ? 'Copied' : 'Copy'}
      </button>
    </div>

    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap mb-5">{data.explanation}</p>

    {data.keyConceptsUsed?.length > 0 && (
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-400 mb-2">Key Concepts</h3>
        <div className="flex flex-wrap gap-2">
          {data.keyConceptsUsed.map((c, i) => (
            <span key={i} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-xs">
              {c}
            </span>
          ))}
        </div>
      </div>
    )}

    {data.complexity && data.complexity !== 'unknown' && (
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500">Complexity:</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          data.complexity === 'beginner' ? 'bg-emerald-500/10 text-emerald-400' :
          data.complexity === 'intermediate' ? 'bg-amber-500/10 text-amber-400' :
          'bg-red-500/10 text-red-400'
        }`}>
          {data.complexity}
        </span>
      </div>
    )}
  </Card>
);

// ─── Review Result ──────────────────────────────────

const SEVERITY_COLORS = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const TYPE_ICONS = {
  bug: Bug,
  'bad-practice': AlertTriangle,
  'edge-case': Shield,
  security: Shield,
};

const ReviewResult = ({ data, onCopy, copiedKey }) => (
  <div className="space-y-4">
    {/* Score */}
    {data.overallScore !== null && data.overallScore !== undefined && (
      <Card className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">Overall Code Score</span>
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                data.overallScore >= 80 ? 'bg-emerald-500' :
                data.overallScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${data.overallScore}%` }}
            />
          </div>
          <span className={`text-lg font-bold ${
            data.overallScore >= 80 ? 'text-emerald-400' :
            data.overallScore >= 50 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {data.overallScore}
          </span>
        </div>
      </Card>
    )}

    {/* Issues */}
    {data.issues?.length > 0 && (
      <Card>
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 mb-4">
          <Bug className="w-5 h-5 text-red-400" />
          Issues Found ({data.issues.length})
        </h2>
        <div className="space-y-3">
          {data.issues.map((issue, i) => {
            const TypeIcon = TYPE_ICONS[issue.type] || AlertTriangle;
            return (
              <div key={i} className={`border rounded-lg p-3 ${SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.low}`}>
                <div className="flex items-start gap-2">
                  <TypeIcon className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium uppercase">{issue.type}</span>
                      <span className="text-xs opacity-60">•</span>
                      <span className="text-xs opacity-60">{issue.severity}</span>
                      {issue.line && <span className="text-xs opacity-60">• Line {issue.line}</span>}
                    </div>
                    <p className="text-sm">{issue.description}</p>
                    {issue.suggestion && (
                      <p className="text-xs mt-1.5 opacity-80">
                        <strong>Fix:</strong> {issue.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    )}

    {/* Improvements */}
    {data.improvements?.length > 0 && (
      <Card>
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          Improvements ({data.improvements.length})
        </h2>
        <div className="space-y-3">
          {data.improvements.map((imp, i) => (
            <div key={i} className="border border-zinc-700/50 rounded-lg p-3 bg-zinc-800/40">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-indigo-400 uppercase">{imp.category}</span>
              </div>
              <p className="text-sm text-zinc-300">{imp.description}</p>
              {imp.suggestedCode && (
                <div className="mt-2 relative">
                  <pre className="text-xs bg-zinc-900 text-zinc-300 rounded-md p-3 overflow-x-auto font-mono border border-zinc-700/50">
                    {imp.suggestedCode}
                  </pre>
                  <button
                    onClick={() => onCopy(`imp-${i}`, imp.suggestedCode)}
                    className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {copiedKey === `imp-${i}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    )}

    {/* No issues */}
    {(!data.issues || data.issues.length === 0) && (!data.improvements || data.improvements.length === 0) && (
      <Card className="text-center py-8">
        <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
        <p className="text-zinc-300">No issues found. Your code looks good!</p>
      </Card>
    )}
  </div>
);

// ─── PR Result ──────────────────────────────────────

const PRResult = ({ data, onCopy, copiedKey }) => (
  <div className="space-y-4">
    {/* Title */}
    <Card>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <GitPullRequest className="w-5 h-5 text-emerald-400" />
          PR Title
        </h2>
        <button
          onClick={() => onCopy('pr-title', data.title)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          {copiedKey === 'pr-title' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedKey === 'pr-title' ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-zinc-200 font-medium">{data.title}</p>

      {data.labels?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {data.labels.map((label, i) => (
            <span key={i} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs">
              {label}
            </span>
          ))}
        </div>
      )}

      {data.breakingChanges && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Contains breaking changes
        </div>
      )}
    </Card>

    {/* Description */}
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-400">Description</h3>
        <button
          onClick={() => onCopy('pr-desc', data.description)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          {copiedKey === 'pr-desc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedKey === 'pr-desc' ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="prose prose-invert prose-sm max-w-none">
        <pre className="whitespace-pre-wrap text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 font-sans leading-relaxed">
          {data.description}
        </pre>
      </div>
    </Card>

    {/* Summary */}
    {data.summary && (
      <Card>
        <h3 className="text-sm font-medium text-zinc-400 mb-2">One-Line Summary</h3>
        <p className="text-zinc-300 text-sm">{data.summary}</p>
      </Card>
    )}
  </div>
);

// ─── Create PR Result ────────────────────────────────

const CreatePRResult = ({ data, onCopy, copiedKey }) => (
  <div className="space-y-4">
    {/* Success banner with link */}
    <Card className="border border-emerald-500/30 bg-emerald-500/5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-400 font-semibold text-sm">Pull Request Created</p>
            <p className="text-zinc-500 text-xs mt-0.5">PR #{data.prNumber} is now open on GitHub</p>
          </div>
        </div>
        <a
          href={data.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg transition-colors shrink-0"
        >
          View on GitHub
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </Card>

    {/* PR Title */}
    <Card>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-indigo-400" />
          PR Title
        </h2>
        <button
          onClick={() => onCopy('cpr-title', data.title)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          {copiedKey === 'cpr-title' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedKey === 'cpr-title' ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-zinc-200 font-medium">{data.title}</p>

      {data.labels?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {data.labels.map((label, i) => (
            <span key={i} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs">
              {label}
            </span>
          ))}
        </div>
      )}

      {data.breakingChanges && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Contains breaking changes
        </div>
      )}
    </Card>

    {/* PR Description */}
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-400">Description</h3>
        <button
          onClick={() => onCopy('cpr-desc', data.description)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          {copiedKey === 'cpr-desc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedKey === 'cpr-desc' ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="whitespace-pre-wrap text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 font-sans leading-relaxed">
        {data.description}
      </pre>
    </Card>

    {/* Summary */}
    {data.summary && (
      <Card>
        <h3 className="text-sm font-medium text-zinc-400 mb-2">One-Line Summary</h3>
        <p className="text-zinc-300 text-sm">{data.summary}</p>
      </Card>
    )}
  </div>
);

export default AIBotPage;
