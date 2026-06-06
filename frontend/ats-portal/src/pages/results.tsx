import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Download, ArrowLeft, ChevronDown, ChevronUp,
  Mail, Phone, GraduationCap, Briefcase, Award, AlertTriangle,
  CheckCircle, XCircle, FileSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useResults, CandidateResult } from "@/lib/results-context";

function ScoreRing({ score, size = 64, label }: { score: number; size?: number; label: string }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, score));
  const offset = circumference - (pct / 100) * circumference;

  const color = pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/40" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{pct}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const isHigh = score >= 80;
  const isMid = score >= 60;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
      isHigh ? "bg-green-500/15 border-green-500/30 text-green-400"
      : isMid ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
      : "bg-red-500/15 border-red-500/30 text-red-400"
    }`}>
      {isHigh ? <CheckCircle className="w-2.5 h-2.5" /> : isMid ? <AlertTriangle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
      {label}: {score}%
    </span>
  );
}

function CandidateCard({ candidate, rank }: { candidate: CandidateResult; rank: number }) {
  const [expanded, setExpanded] = useState(rank <= 1);

  const rankStyle = rank === 1
    ? "border-amber-400/40 bg-amber-400/5"
    : rank === 2
    ? "border-slate-300/30 bg-slate-300/5"
    : rank === 3
    ? "border-orange-600/30 bg-orange-600/5"
    : "border-border";

  const rankBadge = rank === 1
    ? "bg-amber-400 text-black"
    : rank === 2
    ? "bg-slate-300 text-black"
    : rank === 3
    ? "bg-orange-600 text-white"
    : "bg-muted text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.07, duration: 0.4 }}
      className={`rounded-2xl border bg-card overflow-hidden ${rankStyle}`}
      data-testid={`card-candidate-${rank}`}
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Rank badge */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${rankBadge}`}>
            {rank <= 3 ? ["", "1st", "2nd", "3rd"][rank] : `#${rank}`}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground" data-testid={`text-name-${rank}`}>
                  {candidate.candidate_name}
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  {candidate.email && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid={`text-email-${rank}`}>
                      <Mail className="w-3 h-3" />{candidate.email}
                    </span>
                  )}
                  {candidate.phone && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid={`text-phone-${rank}`}>
                      <Phone className="w-3 h-3" />{candidate.phone}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  {candidate.education && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <GraduationCap className="w-3 h-3" />{candidate.education}
                    </span>
                  )}
                  {candidate.experience_years != null && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Briefcase className="w-3 h-3" />{candidate.experience_years} yrs exp
                    </span>
                  )}
                </div>
              </div>

              {/* Score rings */}
              <div className="flex gap-4 shrink-0">
                <ScoreRing score={candidate.score} label="JD Match" size={60} />
                <ScoreRing score={candidate.ats_score} label="ATS Score" size={60} />
              </div>
            </div>

            {/* Score badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <ScoreBadge score={candidate.score} label="JD Match" />
              <ScoreBadge score={candidate.ats_score} label="ATS Format" />
            </div>
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-expand-${rank}`}
        className="w-full px-5 py-2.5 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border"
      >
        <span>{expanded ? "Hide details" : "View full profile"}</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 grid sm:grid-cols-2 gap-5">
              {/* Skills */}
              {candidate.core_skills?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />Core Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.core_skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* ATS Findings */}
              {candidate.ats_findings?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <FileSearch className="w-3.5 h-3.5" />ATS Findings
                  </h4>
                  <ul className="space-y-1">
                    {candidate.ats_findings.map((f, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 shrink-0">•</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strengths */}
              {candidate.strengths?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />Strengths
                  </h4>
                  <ul className="space-y-1">
                    {candidate.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-green-400 mt-0.5 shrink-0">+</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {candidate.weaknesses?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-red-400" />Areas to Probe
                  </h4>
                  <ul className="space-y-1">
                    {candidate.weaknesses.map((w, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5 shrink-0">–</span>{w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ResultsPage() {
  const [, setLocation] = useLocation();
  const { results } = useResults();
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("ats_token")) {
      setLocation("/login");
    }
  }, [setLocation]);

  async function downloadCSV() {
    setIsDownloading(true);
    try {
      const token = localStorage.getItem("ats_token") ?? "";
      const apiUrl = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(`${apiUrl}/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ats_report.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }

  if (!results || results.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md flex items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">TalentOS</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileSearch className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm mb-4">No results to display. Run a screening first.</p>
            <Button onClick={() => setLocation("/upload")} size="sm" variant="outline" data-testid="button-go-upload">
              Start New Screening
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const topScore = Math.round(results.reduce((s, c) => s + c.score, 0) / results.length);
  const topAts = Math.round(results.reduce((s, c) => s + c.ats_score, 0) / results.length);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">TalentOS</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/upload")}
            data-testid="button-new-screening"
            className="text-xs gap-1.5 border-border"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            New Screening
          </Button>
          <Button
            size="sm"
            onClick={downloadCSV}
            disabled={isDownloading}
            data-testid="button-download-csv"
            className="text-xs gap-1.5 bg-primary hover:bg-primary/90"
          >
            {isDownloading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Download CSV Report
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Summary stats */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-1">Screening Results</h1>
              <p className="text-muted-foreground text-sm">
                {results.length} candidate{results.length !== 1 ? "s" : ""} ranked by AI match score
              </p>

              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  { label: "Candidates", value: results.length, unit: "" },
                  { label: "Avg JD Match", value: topScore, unit: "%" },
                  { label: "Avg ATS Score", value: topAts, unit: "%" },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="p-4 rounded-xl bg-card border border-border">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="text-2xl font-bold text-foreground">{value}{unit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Candidate cards */}
            <div className="space-y-4">
              {results.map((candidate, i) => (
                <CandidateCard key={`${candidate.candidate_name}-${i}`} candidate={candidate} rank={i + 1} />
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
