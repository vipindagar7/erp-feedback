import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { bulkPromoteStudents } from "../redux/student/studentSlice.js";
import { fetchSections } from "../redux/academic/academicSlice.js";
import axiosInstance from "../lib/axios.js";
import { cn } from "../lib/utils.js";
import MultiSectionPicker, { formatSection } from "./MultiSectionPicker.jsx";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowUp, Loader2, AlertTriangle, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { notify } from "../hooks/notify.js";

// ── SelectBySectionModal ──────────────────────────────────────
export function SelectBySectionModal({ open, onClose, onSelect }) {
  const sections  = useSelector((s) => s.academic?.sections?.list ?? s.section?.items ?? []);
  const dispatch  = useDispatch();
  const [sectionSel, setSectionSel] = useState(new Set());
  const [loading, setLoading]       = useState(false);
  useEffect(() => { if (!sections.length) dispatch(fetchSections({ limit: 500 })); }, []);
  useEffect(() => { if (open) setSectionSel(new Set()); }, [open]);

  const handleSelect = async () => {
    if (sectionSel.size === 0) return notify.error("Select at least one section");
    setLoading(true);
    try {
      const results = await Promise.all([...sectionSel].map((section_id) =>
        axiosInstance.get("/students", { params: { section_id, limit: 500 } })
          .then((r) => r.data.data?.students?.map((s) => s.id) || [])
      ));
      const unique = new Set(results.flat());
      onSelect(unique);
      notify.success(`${unique.size} students selected from ${sectionSel.size} section(s)`);
      onClose();
    } catch { notify.error("Failed to fetch students"); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users size={17} /> Select Students by Section</DialogTitle>
            <DialogDescription>All students in selected sections will be added to your selection.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <MultiSectionPicker sections={sections} selected={sectionSel} onChange={setSectionSel} maxHeight="max-h-72" groupByCourse />
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSelect} disabled={sectionSel.size === 0 || loading}>
            {loading && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Select ({sectionSel.size} section{sectionSel.size !== 1 ? "s" : ""})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── PromoteBySectionModal ─────────────────────────────────────
export function PromoteBySectionModal({ open, onClose, onSuccess }) {
  const dispatch      = useDispatch();
  const sections      = useSelector((s) => s.academic?.sections?.list ?? s.section?.items ?? []);
  const actionLoading = useSelector((s) => s.student?.actionLoading ?? false);
  const [sectionSel, setSectionSel] = useState(new Set());
  const [remarks, setRemarks]       = useState("");
  const [step,    setStep]          = useState("pick"); // pick | confirm | done
  const [results, setResults]       = useState(null);
  const [preview, setPreview]       = useState([]); // { sectionId, name, format, students, nextSem, nextYear }
  const [loading, setLoading]       = useState(false);

  useEffect(() => { if (!sections.length) dispatch(fetchSections({ limit: 500 })); }, []);
  useEffect(() => { if (open) { setStep("pick"); setResults(null); setRemarks(""); setSectionSel(new Set()); setPreview([]); } }, [open]);

  const handleNext = async () => {
    if (sectionSel.size === 0) return notify.error("Select at least one section");
    setLoading(true);
    try {
      const previews = await Promise.all([...sectionSel].map(async (section_id) => {
        const sec   = sections.find((s) => s.id === section_id);
        const res   = await axiosInstance.get("/students", { params: { section_id, limit: 500 } });
        const studs = res.data.data?.students || [];
        const curSem = sec?.semester ?? 1;
        const nextSem = curSem + 1;
        // Compute next academic year
        const currentEnr = studs[0]?.enrollments?.find((e) => e.is_current) ||
                           studs[0]?.studentEnrollments?.find((e) => e.is_current);
        const curYear   = currentEnr?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear()+1}`;
        const [y1, y2]  = curYear.split("-").map(Number);
        const nextYear  = curSem % 2 === 0 ? `${y1+1}-${y2+1}` : curYear;
        return {
          section_id,
          name:     sec?.name,
          format:   sec ? formatSection(sec) : section_id,
          students: studs,
          ids:      studs.map((s) => s.id),
          curSem, nextSem, curYear, nextYear,
          batch:    sec?.batch,
        };
      }));
      setPreview(previews);
      setStep("confirm");
    } catch (err) { notify.error("Failed to fetch students: " + err.message); }
    finally { setLoading(false); }
  };

  const totalStudents = preview.reduce((a, p) => a + p.ids.length, 0);

  const handlePromote = async () => {
    setLoading(true);
    try {
      const allIds = [...new Set(preview.flatMap((p) => p.ids))];
      const r = await dispatch(bulkPromoteStudents({ ids: allIds, remarks }));
      if (!bulkPromoteStudents.fulfilled.match(r)) {
        notify.error(r.payload || "Promotion failed");
        setLoading(false);
        return;
      }
      const promoteResults = r.payload?.data ?? r.payload;

      // Also update each Section's semester
      const sectionUpdates = await Promise.allSettled(
        preview.map((p) =>
          axiosInstance.patch(`/sections/${p.section_id}`, { semester: p.nextSem })
            .then(() => ({ section_id: p.section_id, name: p.name, ok: true }))
            .catch((e) => ({ section_id: p.section_id, name: p.name, ok: false, error: e.message }))
        )
      );

      setResults({
        ...promoteResults,
        sectionUpdates: sectionUpdates.map((r) => r.value ?? r.reason),
      });
      setStep("done");
      onSuccess?.();
    } catch (err) { notify.error(err.message); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUp size={17} className="text-green-600" /> Promote by Section
            </DialogTitle>
            <DialogDescription>
              {step === "pick"    && "Select sections to promote. Both students and section semester will be updated."}
              {step === "confirm" && `${totalStudents} students across ${preview.length} section(s) will be promoted.`}
              {step === "done"    && "Promotion complete."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {step === "pick" && (
            <MultiSectionPicker sections={sections} selected={sectionSel} onChange={setSectionSel} maxHeight="max-h-80" groupByCourse />
          )}

          {step === "confirm" && (
            <div className="space-y-4">
              {/* Per-section preview */}
              <div className="space-y-2">
                {preview.map((p) => (
                  <div key={p.section_id} className="bg-muted/30 border border-border rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.format}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.ids.length} student{p.ids.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="text-muted-foreground">Sem {p.curSem} → <span className="font-semibold text-green-600">Sem {p.nextSem}</span></p>
                        {p.nextYear !== p.curYear && (
                          <p className="text-muted-foreground">{p.curYear} → <span className="font-semibold text-green-600">{p.nextYear}</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">{preview.length}</p>
                  <p className="text-xs text-muted-foreground">Sections</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{totalStudents}</p>
                  <p className="text-xs text-green-600">Students to promote</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Remarks <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input className="h-9 text-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. End of semester promotion" />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-400">
                ℹ Section semester number will also be updated automatically.
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl text-xs text-orange-700 dark:text-orange-400">
                ⚠ Detained students will be skipped.
              </div>
            </div>
          )}

          {step === "done" && results && (
            <div className="space-y-4">
              {/* Promotion results */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Promoted", value: results.promoted?.length || 0, color: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400" },
                  { label: "Skipped",  value: results.skipped?.length  || 0, color: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400" },
                  { label: "Failed",   value: results.failed?.length   || 0, color: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className={cn("rounded-xl p-3 text-center border", color)}>
                    <p className="text-xl font-bold">{value}</p>
                    <p className="text-xs">{label}</p>
                  </div>
                ))}
              </div>

              {/* Section updates */}
              {results.sectionUpdates?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Section Updates</p>
                  <div className="space-y-1.5">
                    {results.sectionUpdates.map((u, i) => (
                      <div key={i} className={cn("flex items-center gap-2 text-xs px-3 py-2 rounded-lg",
                        u?.ok ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                               : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400")}>
                        {u?.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        <span>{u?.name || u?.section_id}</span>
                        {!u?.ok && <span className="opacity-70">— {u?.error}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.skipped?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-yellow-600 mb-1.5">Skipped</p>
                  <div className="max-h-28 overflow-y-auto space-y-0.5">
                    {results.skipped.map((s, i) => (
                      <p key={i} className="text-xs text-muted-foreground">{s.name || s.id} — {s.reason}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex gap-3 justify-end">
          {step === "pick" && (<>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleNext} disabled={sectionSel.size === 0 || loading}>
              {loading && <Loader2 size={13} className="mr-1.5 animate-spin" />} Next →
            </Button>
          </>)}
          {step === "confirm" && (<>
            <Button variant="outline" onClick={() => setStep("pick")}>← Back</Button>
            <Button onClick={handlePromote} disabled={loading || actionLoading} className="bg-green-600 hover:bg-green-700">
              {loading || actionLoading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <ArrowUp size={13} className="mr-1.5" />}
              Promote {totalStudents} Students
            </Button>
          </>)}
          {step === "done" && <Button onClick={onClose}>Close</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── InstituteWidePromoteModal ─────────────────────────────────
export function InstituteWidePromoteModal({ open, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const actionLoading = useSelector((s) => s.student?.actionLoading ?? false);
  const [step,    setStep]    = useState("warn");
  const [remarks, setRemarks] = useState("");
  const [confirm, setConfirm] = useState("");
  const [results, setResults] = useState(null);
  const [count,   setCount]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("warn"); setResults(null); setRemarks(""); setConfirm("");
    axiosInstance.get("/students", { params: { limit: 1 } })
      .then((r) => setCount(r.data.data?.pagination?.total || 0))
      .catch(() => setCount("?"));
  }, [open]);

  const handlePromote = async () => {
    if (confirm !== "PROMOTE ALL") return notify.error('Type "PROMOTE ALL" to confirm');
    setLoading(true);
    try {
      let allIds = [], page = 1;
      while (true) {
        const res = await axiosInstance.get("/students", { params: { limit: 200, page } });
        const studs = res.data.data?.students || [];
        allIds = [...allIds, ...studs.map((s) => s.id)];
        if (studs.length < 200) break;
        page++;
      }
      const r = await dispatch(bulkPromoteStudents({ ids: allIds, remarks }));
      if (bulkPromoteStudents.fulfilled.match(r)) {
        setResults(r.payload?.data ?? r.payload);
        setStep("done");
        onSuccess?.();
      } else notify.error(r.payload);
    } catch (err) { notify.error(err.message); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle size={18} /> Institute-Wide Promotion
          </DialogTitle>
          <DialogDescription>Promotes ALL active students across ALL sections.</DialogDescription>
        </DialogHeader>
        {step === "warn" && (
          <div className="space-y-4 py-2">
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">⚠ Major operation</p>
              <ul className="text-xs text-orange-700 dark:text-orange-400 space-y-1 list-disc pl-4">
                <li>ALL ~{count} active students will be promoted</li>
                <li>Detained students will be skipped automatically</li>
                <li>This cannot be undone in bulk</li>
              </ul>
            </div>
            <div className="space-y-1.5">
              <Label>Remarks <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input className="h-9 text-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Annual promotion 2025" />
            </div>
            <div className="space-y-1.5">
              <Label>Type <strong>PROMOTE ALL</strong> to confirm</Label>
              <Input className="h-9 text-sm font-mono" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="PROMOTE ALL" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={confirm !== "PROMOTE ALL" || loading || actionLoading} onClick={handlePromote}>
                {loading || actionLoading
                  ? <><Loader2 size={13} className="mr-1.5 animate-spin" />Promoting…</>
                  : <><ArrowUp size={13} className="mr-1.5" />Promote All</>}
              </Button>
            </div>
          </div>
        )}
        {step === "done" && results && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Promoted", value: results.promoted?.length || 0, cls: "text-green-600" },
                { label: "Skipped",  value: results.skipped?.length  || 0, cls: "text-yellow-600" },
                { label: "Failed",   value: results.failed?.length   || 0, cls: "text-destructive" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className={cn("text-2xl font-bold", cls)}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <Button className="w-full" variant="outline" onClick={onClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Default export: Single Promote Modal ──────────────────────
export default function PromoteModal({ open, student, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  if (!open || !student) return null;

  const enr = student.enrollments?.find((e) => e.is_current) ||
              student.studentEnrollments?.find((e) => e.is_current);
  const sec = student.section;

  const handle = async () => {
    setLoading(true);
    try {
      await axiosInstance.post(`/students/${student.id}/promote`);
      notify.success(`${student.first_name} promoted to Sem ${(enr?.semester || 0) + 1}`);
      onSuccess?.(); onClose();
    } catch (err) { notify.error(err.response?.data?.message || "Promotion failed"); }
    finally { setLoading(false); }
  };

  const statusColor = {
    ACTIVE:      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    DETAINED:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    PASSED:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PROMOTED:    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUp size={17} className="text-green-600" /> Promote Student
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {/* Student info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {student.first_name?.[0] || "S"}
            </div>
            <div>
              <p className="font-semibold text-foreground">{student.first_name} {student.last_name}</p>
              <p className="text-xs text-muted-foreground font-mono">{student.roll_no || student.roll_number}</p>
            </div>
          </div>

          {/* Current enrollment */}
          {enr && (
            <div className="bg-muted/40 border border-border rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Enrollment</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Sem {enr.semester} · {enr.academic_year}
                  </p>
                  {sec && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[sec.course?.program?.name, sec.course?.name].filter(Boolean).join(" › ")} › Sec {sec.name}
                      {sec.batch ? ` · ${sec.batch}` : ""}
                    </p>
                  )}
                </div>
                <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full",
                  statusColor[enr.status] || "bg-muted text-muted-foreground")}>
                  {enr.status}
                </span>
              </div>
            </div>
          )}

          {/* Promotion preview */}
          {enr && enr.semester < 8 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-medium">Sem {enr.semester}</span>
              <ArrowUp size={14} className="text-green-600 shrink-0" />
              <span className="px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold">Sem {enr.semester + 1}</span>
              {enr.semester % 2 === 0 && (
                <span className="text-xs text-muted-foreground">· New academic year</span>
              )}
            </div>
          )}

          {enr?.semester >= 8 && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl text-xs text-orange-700 dark:text-orange-400">
              ⚠ Student is at Semester 8 (final). Cannot promote further.
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading || !enr || enr.semester >= 8} onClick={handle}>
            {loading && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            ↑ Promote
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}