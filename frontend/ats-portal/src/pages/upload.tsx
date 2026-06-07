import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Upload, FileText, X, LogOut, Zap, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useResults } from "@/lib/results-context";

function NavBar() {
  const [, setLocation] = useLocation();
  const name = localStorage.getItem("ats_name") ?? "User";

  function logout() {
    localStorage.removeItem("ats_token");
    localStorage.removeItem("ats_name");
    setLocation("/login");
  }

  return (
    <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">TalentOS</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
        <span className="text-sm text-foreground font-medium">New Screening</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
            {name[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-muted-foreground hidden sm:block">{name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          data-testid="button-logout"
          className="text-muted-foreground hover:text-foreground text-xs gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </Button>
      </div>
    </header>
  );
}

function ScanningOverlay() {
  const [phase, setPhase] = useState(0);
  const phases = [
    "Initializing AI Engine...",
    "Parsing resume documents...",
    "Extracting candidate profiles...",
    "Analyzing against job description...",
    "Computing ATS compatibility scores...",
    "Ranking candidates by fit...",
    "Generating intelligence report...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(p => Math.min(p + 1, phases.length - 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center"
    >
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg" />

      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"
          style={{ animation: "scanLine 3s linear infinite" }}
        />
      </div>

      {/* Glow orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[100px] animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-accent/8 blur-[80px] animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md px-8 text-center">
        {/* Pulsing AI core */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-2 border-primary/30 flex items-center justify-center pulse-glow">
            <div className="w-16 h-16 rounded-full border border-primary/50 flex items-center justify-center bg-primary/10">
              <Brain className="w-8 h-8 text-primary" />
            </div>
          </div>
          {/* Orbiting rings */}
          <div className="absolute inset-0 rounded-full border border-primary/20" style={{ animation: "spin 4s linear infinite" }} />
          <div className="absolute -inset-3 rounded-full border border-accent/10" style={{ animation: "spin 6s linear infinite reverse" }} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">AI Engine Processing</h2>
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-primary font-mono"
              data-testid="status-scanning-phase"
            >
              {phases[phase]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {phases.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${i <= phase ? "bg-primary w-6" : "bg-muted w-2"}`}
            />
          ))}
        </div>

        {/* Data stream lines */}
        <div className="w-full space-y-1.5">
          {[0.3, 0.5, 0.7, 0.2, 0.85, 0.45].map((opacity, i) => (
            <div key={i} className="flex gap-2 items-center font-mono text-xs text-primary/60">
              <span className="text-primary/30">[{String(i).padStart(2, "0")}]</span>
              <div
                className="h-px rounded-full bg-primary"
                style={{ width: `${opacity * 100}%`, opacity, transition: "all 1s" }}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function UploadPage() {
  const [, setLocation] = useLocation();
  const { setResults } = useResults();
  const [jd, setJd] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!localStorage.getItem("ats_token")) {
      setLocation("/login");
    }
  }, [setLocation]);

  const addFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const pdfs = Array.from(newFiles).filter(f => f.type === "application/pdf");
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      return [...prev, ...pdfs.filter(f => !existingNames.has(f.name))];
    });
  }, []);

  function removeFile(name: string) {
    setFiles(prev => prev.filter(f => f.name !== name));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  async function handleLaunch() {
    if (!jd.trim()) { setError("Please provide a job description."); return; }
    if (files.length === 0) { setError("Please upload at least one resume PDF."); return; }
    setError("");
    setIsScanning(true);

    try {
      const token = localStorage.getItem("ats_token") ?? "";
      const apiUrl = "http://13.127.149.197:5000";
      const formData = new FormData();
      formData.append("jd", jd.trim());
      files.forEach(f => formData.append("resumes", f));

      const res = await fetch(`${apiUrl}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.status === 401) {
        localStorage.removeItem("ats_token");
        localStorage.removeItem("ats_name");
        setLocation("/login");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? body.error ?? "Processing failed. Please try again.");
        return;
      }

      const data = await res.json();
      const candidates = Array.isArray(data) ? data : data.results ?? data.candidates ?? [];
      setResults(candidates);
      setLocation("/results");
    } catch {
      setError("Unable to connect to the AI engine. Please check your connection.");
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <AnimatePresence>{isScanning && <ScanningOverlay />}</AnimatePresence>

      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">AI Resume Screening</h1>
              <p className="text-muted-foreground text-sm mt-1">Paste a job description and upload candidate resumes to get instant AI-powered rankings.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Job Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-xs font-bold">1</span>
                  </div>
                  <label className="text-sm font-semibold text-foreground">Job Description</label>
                </div>
                <div className="relative">
                  <Textarea
                    value={jd}
                    onChange={e => setJd(e.target.value)}
                    placeholder="Paste your job description here. Include required skills, responsibilities, qualifications, and any other relevant details the AI should use for scoring..."
                    data-testid="textarea-jd"
                    className="min-h-[340px] bg-card border-border focus:border-primary/50 text-sm resize-none placeholder:text-muted-foreground/40 leading-relaxed"
                  />
                  {jd && (
                    <div className="absolute bottom-3 right-3 text-xs text-muted-foreground font-mono">
                      {jd.split(/\s+/).filter(Boolean).length} words
                    </div>
                  )}
                </div>
              </div>

              {/* Resume Upload */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-xs font-bold">2</span>
                  </div>
                  <label className="text-sm font-semibold text-foreground">Resume Files</label>
                  {files.length > 0 && (
                    <span className="ml-auto text-xs text-primary font-medium">{files.length} file{files.length !== 1 ? "s" : ""} added</span>
                  )}
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="dropzone-resumes"
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 min-h-[160px]
                    ${isDragging
                      ? "border-primary bg-primary/10 scale-[1.01]"
                      : "border-border bg-card/50 hover:border-primary/40 hover:bg-card"
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    multiple
                    className="hidden"
                    data-testid="input-file"
                    onChange={e => addFiles(e.target.files)}
                  />
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isDragging ? "bg-primary/20" : "bg-muted"}`}>
                    <Upload className={`w-5 h-5 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {isDragging ? "Release to upload" : "Drop PDF resumes here"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">or click to browse — multiple files supported</p>
                  </div>
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    <AnimatePresence>
                      {files.map(file => (
                        <motion.div
                          key={file.name}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border group"
                          data-testid={`file-item-${file.name}`}
                        >
                          <div className="w-7 h-7 rounded bg-destructive/15 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5 text-destructive" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); removeFile(file.name); }}
                            data-testid={`button-remove-file-${file.name}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive text-muted-foreground rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 flex items-center gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                data-testid="error-upload"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Launch button */}
            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleLaunch}
                disabled={isScanning}
                data-testid="button-launch"
                className="relative overflow-hidden bg-primary hover:bg-primary/90 text-white font-semibold px-10 h-12 text-sm gap-2.5 group"
              >
                <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Launch AI Engine
                {(jd && files.length > 0) && (
                  <span className="ml-1 text-white/70 font-normal">— {files.length} resume{files.length !== 1 ? "s" : ""}</span>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
