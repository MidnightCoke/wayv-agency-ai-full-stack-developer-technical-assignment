import { useState } from 'react';
import type { NextPageWithLayout } from './_app';
import { trpc } from '~/utils/trpc';
import type { MatchingResult } from '~/features/matching/types';
import type { BriefOutput } from '~/features/brief/types';

// ─── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{Math.round(value)}</span>
    </div>
  );
}

// ─── Breakdown table ──────────────────────────────────────────────────────────
function BreakdownPanel({ breakdown }: { breakdown: MatchingResult['breakdown'] }) {
  const rows: [string, number][] = [
    ['Niche', breakdown.nicheScore],
    ['Country', breakdown.countryScore],
    ['Engagement', breakdown.engagementScore],
    ['Watch Time', breakdown.watchTimeScore],
    ['Follower Fit', breakdown.followerFitScore],
    ['Hook Alignment', breakdown.hookAlignmentScore],
    ['Brand Safety', breakdown.brandSafetyScore],
    ['Gender', breakdown.genderScore],
    ['Age Range', breakdown.ageScore],
  ];
  return (
    <div className="bg-gray-900 rounded-lg p-4 mt-2 space-y-2">
      {rows.map(([label, val]) => (
        <div key={label} className="grid grid-cols-[120px_1fr] items-center gap-2">
          <span className="text-xs text-gray-400">{label}</span>
          <ScoreBar value={val} />
        </div>
      ))}
      {breakdown.penalties > 0 && (
        <p className="text-xs text-red-400 mt-1">⚠ Penalties: -{Math.round(breakdown.penalties)} pts</p>
      )}
    </div>
  );
}

// ─── Brief panel ──────────────────────────────────────────────────────────────
function BriefPanel({
  brief,
  cached,
  onClose,
}: {
  brief: BriefOutput;
  cached: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">AI Campaign Brief</h3>
            {cached && (
              <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
                cached
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Outreach Message</p>
            <p className="text-sm bg-gray-900 rounded-lg p-3">{brief.outreachMessage}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Content Ideas</p>
            <ol className="space-y-1">
              {brief.contentIdeas.map((idea, i) => (
                <li key={i} className="text-sm bg-gray-900 rounded-lg p-3">
                  <span className="text-gray-500 mr-2">{i + 1}.</span>
                  {idea}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Hook Suggestions</p>
            <ul className="space-y-1">
              {brief.hookSuggestions.map((hook, i) => (
                <li key={i} className="text-sm bg-gray-900 rounded-lg p-3 italic text-gray-200">
                  &ldquo;{hook}&rdquo;
                </li>
              ))}
            </ul>
          </div>
          <details className="mt-2">
            <summary className="text-xs text-gray-500 cursor-pointer select-none hover:text-gray-400">
              Raw JSON
            </summary>
            <pre className="mt-2 text-xs bg-gray-900 rounded-lg p-3 overflow-x-auto text-green-400">
              {JSON.stringify(brief, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const IndexPage: NextPageWithLayout = () => {
  const [campaignId, setCampaignId] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [briefState, setBriefState] = useState<{
    brief: BriefOutput;
    cached: boolean;
  } | null>(null);
  const [briefLoading, setBriefLoading] = useState<string | null>(null); // creatorId being loaded

  const campaigns = trpc.campaign.list.useQuery();
  const matching = trpc.matching.getTopCreatorsForCampaign.useQuery(
    { campaignId },
    { enabled: !!campaignId },
  );

  const generateBrief = trpc.brief.generateBrief.useMutation();

  function toggleRow(creatorId: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(creatorId)) {
        next.delete(creatorId);
      } else {
        next.add(creatorId);
      }
      return next;
    });
  }

  async function handleGenerateBrief(creatorId: string) {
    if (!campaignId) return;
    setBriefLoading(creatorId);
    try {
      const result = await generateBrief.mutateAsync({ campaignId, creatorId });
      setBriefState(result);
    } catch (e) {
      console.error(e);
      alert('Brief generation failed. Check console for details.');
    } finally {
      setBriefLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      {briefState && (
        <BriefPanel
          brief={briefState.brief}
          cached={briefState.cached}
          onClose={() => setBriefState(null)}
        />
      )}

      <h1 className="text-3xl font-bold mb-1">Wayv</h1>
      <p className="text-gray-400 mb-8 text-sm">Campaign → Creator Matching Engine</p>

      {/* Campaign selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Campaign
        </label>
        {campaigns.isLoading ? (
          <div className="h-10 w-64 bg-gray-800 rounded-lg animate-pulse" />
        ) : campaigns.error ? (
          <p className="text-red-400 text-sm">Failed to load campaigns</p>
        ) : (
          <select
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 min-w-64"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
          >
            <option value="">-- choose a campaign --</option>
            {campaigns.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.brand} — {c.objective} ({c.niches.join(', ')})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Results */}
      {campaignId && (
        <div>
          {matching.isLoading ? (
            <p className="text-gray-400 text-sm animate-pulse">Fetching top creators…</p>
          ) : matching.error ? (
            <p className="text-red-400 text-sm">Error: {matching.error.message}</p>
          ) : matching.data ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold">
                  Top {matching.data.results.length} Creators
                </h2>
                <span className="text-xs text-gray-500">
                  for {matching.data.campaign.brand} · {matching.data.campaign.niches.join(', ')} · {matching.data.campaign.targetCountry}
                </span>
              </div>

              <div className="border border-gray-700 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[2rem_1fr_1fr_10rem_8rem_8rem] bg-gray-800 px-4 py-3 text-xs text-gray-400 uppercase tracking-wide gap-2">
                  <span>#</span>
                  <span>Creator</span>
                  <span>Niches</span>
                  <span className="text-center">Followers</span>
                  <span className="text-center">Score</span>
                  <span />
                </div>

                {matching.data.results.map((result, idx) => {
                  const isExpanded = expandedRows.has(result.creator.id);
                  const isLoadingBrief = briefLoading === result.creator.id;
                  return (
                    <div key={result.creator.id} className="border-t border-gray-700">
                      <div className="grid grid-cols-[2rem_1fr_1fr_10rem_8rem_8rem] items-center px-4 py-3 gap-2 hover:bg-gray-800/50 transition-colors">
                        <span className="text-gray-500 text-sm">{idx + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{result.creator.username}</p>
                          <p className="text-xs text-gray-500">{result.creator.country} · {result.creator.contentStyle}</p>
                        </div>
                        <p className="text-xs text-gray-400">
                          {result.creator.niches.join(', ')}
                        </p>
                        <p className="text-sm text-center text-gray-300">
                          {result.creator.followers.toLocaleString()}
                        </p>
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-lg font-bold ${
                              result.totalScore >= 70
                                ? 'text-emerald-400'
                                : result.totalScore >= 40
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                            }`}
                          >
                            {result.totalScore.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex gap-1 justify-end">
                          <button
                            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                            onClick={() => toggleRow(result.creator.id)}
                          >
                            {isExpanded ? 'Hide' : 'Details'}
                          </button>
                          <button
                            className="text-xs bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 px-2 py-1 rounded"
                            disabled={isLoadingBrief}
                            onClick={() => handleGenerateBrief(result.creator.id)}
                          >
                            {isLoadingBrief ? '…' : 'Brief'}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4">
                          <BreakdownPanel breakdown={result.breakdown} />
                          {result.reasons && result.reasons.length > 0 && (
                            <ul className="mt-3 space-y-1">
                              {result.reasons.map((r, i) => (
                                <li key={i} className="text-xs text-gray-400 flex items-start gap-1">
                                  <span className="text-gray-600 mt-0.5">•</span>
                                  {r}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      )}

      {!campaignId && (
        <p className="text-gray-600 text-sm mt-4">
          Select a campaign above to see ranked creators.
        </p>
      )}
    </div>
  );
};

export default IndexPage;
