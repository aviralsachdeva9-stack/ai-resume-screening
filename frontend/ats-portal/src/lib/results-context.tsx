import { createContext, useContext, useState, ReactNode } from "react";

export interface CandidateResult {
  candidate_name: string;
  email: string;
  phone: string;
  education: string;
  experience_years: number;
  core_skills: string[];
  score: number;
  ats_score: number;
  ats_findings: string[];
  strengths: string[];
  weaknesses: string[];
}

interface ResultsContextType {
  results: CandidateResult[];
  setResults: (results: CandidateResult[]) => void;
}

const ResultsContext = createContext<ResultsContextType | undefined>(undefined);

export function ResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<CandidateResult[]>([]);

  return (
    <ResultsContext.Provider value={{ results, setResults }}>
      {children}
    </ResultsContext.Provider>
  );
}

export function useResults() {
  const context = useContext(ResultsContext);
  if (context === undefined) {
    throw new Error("useResults must be used within a ResultsProvider");
  }
  return context;
}
