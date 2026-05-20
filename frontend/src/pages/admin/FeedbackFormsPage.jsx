import { useEffect, useState, useCallback, useRef } from "react";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";
import { useNavigate } from "react-router-dom";
import { extractList } from "../../lib/apiResponse.js";
import { cn } from "../../lib/utils.js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Trash2, ToggleLeft, ToggleRight, Download, BarChart2,
  ChevronDown, ChevronUp, AlertTriangle, Users, GraduationCap,
  Layers, X, Search, Check, Star, MessageSquare, ListChecks,
  HelpCircle, ArrowLeft, ArrowRight, Loader2, RefreshCw, ExternalLink,
  Calendar, BookOpen, Pencil, Filter,
} from "lucide-react";
import { notify } from "../../hooks/notify.js";

// ── Constants ──────────────────────────────────────────────────
const FORM_TYPES = [
  { value: "TEACHING", label: "Teaching", icon: GraduationCap, color: "blue", desc: "Per subject×faculty for selected sections" },
  { value: "GENERAL", label: "General", icon: Users, color: "amber", desc: "Visible to all active students" },
  { value: "GROUP", label: "Group", icon: Layers, color: "purple", desc: "Targets a specific student group" },
];
const TYPE_STYLE = {
  TEACHING: { sel: "border-blue-400 bg-blue-50 dark:bg-blue-950/30", icon: "bg-blue-100 text-blue-600", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", text: "text-blue-700 dark:text-blue-400" },
  GENERAL: { sel: "border-amber-400 bg-amber-50 dark:bg-amber-950/30", icon: "bg-amber-100 text-amber-600", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", text: "text-amber-700 dark:text-amber-400" },
  GROUP: { sel: "border-purple-400 bg-purple-50 dark:bg-purple-950/30", icon: "bg-purple-100 text-purple-600", badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400", text: "text-purple-700 dark:text-purple-400" },
};
const Q_ICONS = { RATING: Star, TEXT: MessageSquare, MCQ: ListChecks };
const today = () => new Date().toISOString().split("T")[0];
const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().split("T")[0];

// ── Helpers ────────────────────────────────────────────────────
const getStatus = (f) => {
  const now = new Date();
  if (!f.is_active) return { label: "Inactive", cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" };
  if (new Date(f.end_date) < now) return { label: "Expired", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  if (new Date(f.start_date) > now) return { label: "Scheduled", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
  return { label: "Active", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
};

// ── MultiSelect ────────────────────────────────────────────────
function MultiSelect({ options = [], value = [], onChange, placeholder = "Select…", labelFn }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef();
  const getL = labelFn || ((o) => o.name || "");
  const fil = options.filter((o) => getL(o).toLowerCase().includes(q.toLowerCase()));
  const tog = (id) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  const names = options.filter((o) => value.includes(o.id)).map(getL);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="w-full h-9 border border-input rounded-lg px-3 text-sm text-left flex items-center justify-between bg-background hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring">
        <span className={cn("truncate flex-1 mr-2", value.length === 0 && "text-muted-foreground")}>
          {value.length === 0 ? placeholder : value.length === 1 ? names[0] : `${value.length} selected`}
        </span>
        <ChevronDown size={13} className={cn("text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
                className="w-full pl-7 pr-3 h-8 text-sm bg-muted rounded-lg border-0 outline-none" />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {fil.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-4">No results</p>
              : fil.map((o) => (
                <label key={o.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-accent cursor-pointer text-sm">
                  <Checkbox checked={value.includes(o.id)} onCheckedChange={() => tog(o.id)} />
                  <span className="truncate text-foreground">{getL(o)}</span>
                </label>
              ))}
          </div>
          {value.length > 0 && (
            <div className="px-3 py-2 border-t border-border flex justify-between">
              <span className="text-xs text-muted-foreground">{value.length} selected</span>
              <button type="button" onClick={() => onChange([])} className="text-xs text-destructive hover:underline">Clear all</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────
function Steps({ current, isEdit }) {
  const steps = isEdit ? ["Details", "Questions"] : ["Type", "Details", "Questions"];
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex items-center gap-1.5">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all",
              i < current ? "bg-primary text-primary-foreground" :
                i === current ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                  "bg-muted text-muted-foreground")}>
              {i < current ? <Check size={13} /> : i + 1}
            </div>
            <span className={cn("text-xs font-medium hidden sm:block", i === current ? "text-foreground" : "text-muted-foreground")}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={cn("w-6 sm:w-8 h-px mx-1 sm:mx-2", i < current ? "bg-primary" : "bg-border")} />}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// FORM MODAL — handles both CREATE (3 steps) and EDIT (2 steps)
// ══════════════════════════════════════════════════════════════
function FormModal({ open, onClose, onSaved, editData = null }) {
  const isEdit = !!editData;
  const BLANK = { form_type: "", title: "", category_id: "", start_date: today(), end_date: inDays(14), is_active: true, section_ids: [], group_id: "none" };

  const [step, setStep] = useState(isEdit ? 0 : 0);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [refData, setRefData] = useState({ categories: [], sections: [], groups: [] });
  const [catQs, setCatQs] = useState([]);
  const [excluded, setExcluded] = useState(new Set());
  const [loadingQs, setLoadingQs] = useState(false);

  // Init on open
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setExcluded(new Set());

    if (isEdit) {
      setForm({
        form_type: editData.form_type || editData.category?.type || "GENERAL",
        title: editData.title || "",
        category_id: editData.category_id || editData.category?.id || "",
        start_date: editData.start_date ? new Date(editData.start_date).toISOString().slice(0, 10) : today(),
        end_date: editData.end_date ? new Date(editData.end_date).toISOString().slice(0, 10) : inDays(14),
        is_active: editData.is_active ?? true,
        section_ids: editData.section_ids || [],
        group_id: editData.group_id || editData.group?.id || "none",
      });
      if (editData.category_id || editData.category?.id) {
        fetchQs(editData.category_id || editData.category?.id);
      }
    } else {
      setForm(BLANK);
      setCatQs([]);
    }

    // Load reference data
    Promise.all([
      axiosInstance.get(EP.feedback.categories),
      axiosInstance.get(EP.sections.list, { params: { limit: 200 } }),
      axiosInstance.get(EP.groups?.list || "/groups").catch(() => ({ data: { data: { groups: [] } } })),
    ]).then(([cat, sec, grp]) => setRefData({
      categories: extractList(cat.data, "categories"),
      sections: extractList(sec.data, "sections"),
      groups: extractList(grp.data, "groups") || [],
    })).catch(() => { });
  }, [open, editData]);

  const fetchQs = (category_id) => {
    if (!category_id) { setCatQs([]); return; }
    setLoadingQs(true);
    axiosInstance.get(EP.feedback.questions, { params: { category_id, limit: 100 } })
      .then((r) => setCatQs([...(r.data?.data?.questions || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))))
      .catch(() => setCatQs([]))
      .finally(() => setLoadingQs(false));
  };

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (k === "category_id") fetchQs(v);
  };

  const sel = FORM_TYPES.find((t) => t.value === form.form_type);
  const totalSteps = isEdit ? 2 : 3;
  const includedCount = catQs.length - excluded.size;

  const validate = () => {
    if (!form.title.trim()) { notify.error("Title required"); return false; }
    if (!form.category_id) { notify.error("Select a category"); return false; }
    if (!form.start_date || !form.end_date) { notify.error("Date range required"); return false; }
    if (!isEdit && form.form_type === "TEACHING" && !form.section_ids.length) { notify.error("Select at least one section"); return false; }
    if (!isEdit && form.form_type === "GROUP" && (!form.group_id || form.group_id === "none")) { notify.error("Select a group"); return false; }
    return true;
  };

  const handleNext = () => {
    if (!isEdit && step === 0 && !form.form_type) { notify.error("Choose a form type"); return; }
    if ((isEdit ? step === 0 : step === 1) && !validate()) return;
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const includedIds = catQs.filter((q) => !excluded.has(q.id)).map((q) => q.id);
      if (isEdit) {
        // PATCH — only send editable fields
        const payload = {
          title: form.title.trim(),
          category_id: form.category_id,
          start_date: form.start_date,
          end_date: form.end_date,
          is_active: form.is_active,
        };
        await axiosInstance.patch(EP.feedback.formById(editData.id), payload);
        notify.success("Form updated");
      } else {
        const payload = {
          form_type: form.form_type, title: form.title.trim(),
          category_id: form.category_id, start_date: form.start_date,
          end_date: form.end_date, is_active: form.is_active, question_ids: includedIds,
        };
        if (form.form_type === "TEACHING") payload.section_ids = form.section_ids;
        if (form.form_type === "GROUP") payload.group_id = form.group_id;
        const res = await axiosInstance.post(EP.feedback.forms, payload);
        notify.success(`${res.data?.data?.count ?? 1} form(s) created`);
      }
      onSaved();
    } catch (err) { notify.error(err.response?.data?.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  // Compute step indices relative to isEdit
  const detailsStep = isEdit ? 0 : 1;
  const questionsStep = isEdit ? 1 : 2;

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-border bg-card shrink-0">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0">
          <X size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-foreground">
            {isEdit ? `Edit — ${editData.title}` : step === 0 ? "Create Feedback Form" : step === detailsStep ? `${sel?.label} — Details` : "Review Questions"}
          </h1>
          {sel && step > 0 && !isEdit && <p className="text-xs text-muted-foreground truncate">{sel.desc}</p>}
        </div>
        <div className="hidden md:flex flex-1 justify-center">
          <Steps current={step} isEdit={isEdit} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {step > 0 && <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}><ArrowLeft size={13} className="mr-1" />Back</Button>}
          {step < totalSteps - 1
            ? <Button size="sm" onClick={handleNext}>Next <ArrowRight size={13} className="ml-1" /></Button>
            : <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]" onClick={handleSubmit} disabled={saving}>
              {saving ? <><Loader2 size={13} className="mr-1.5 animate-spin" />{isEdit ? "Saving…" : "Creating…"}</>
                : isEdit ? "Save Changes" : `Create${includedCount > 0 ? ` (${includedCount}Q)` : ""}`}
            </Button>}
        </div>
      </div>
      <div className="flex md:hidden justify-center py-3 border-b border-border bg-card shrink-0">
        <Steps current={step} isEdit={isEdit} />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* STEP 0 (create only): Choose type */}
          {!isEdit && step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Choose Form Type</h2>
                <p className="text-sm text-muted-foreground mt-1">Each type determines who receives the feedback form.</p>
              </div>
              <div className="grid gap-3">
                {FORM_TYPES.map((t) => {
                  const style = TYPE_STYLE[t.value];
                  const active = form.form_type === t.value;
                  return (
                    <button key={t.value} type="button" onClick={() => setForm((p) => ({ ...p, form_type: t.value }))}
                      className={cn("flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all",
                        active ? style.sel : "border-border bg-card hover:border-primary/30 hover:bg-muted/20")}>
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", active ? style.icon : "bg-muted text-muted-foreground")}>
                        <t.icon size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-semibold text-base", active ? style.text : "text-foreground")}>{t.label}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{t.desc}</p>
                      </div>
                      <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", active ? "border-primary bg-primary" : "border-muted-foreground/30")}>
                        {active && <Check size={11} className="text-primary-foreground" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details step */}
          {step === detailsStep && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">{isEdit ? "Edit Form Details" : "Form Details"}</h2>
                <p className="text-sm text-muted-foreground mt-1">{isEdit ? "Update title, category, dates and status." : "Configure the form settings and audience."}</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</p>
                <div className="space-y-1.5">
                  <Label>Title <span className="text-destructive">*</span></Label>
                  <Input className="h-9 text-sm" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. End Semester Teaching Feedback 2025" />
                </div>
                <div className="space-y-1.5">
                  <Label>Category <span className="text-destructive">*</span></Label>
                  <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select category…" /></SelectTrigger>
                    <SelectContent>
                      {refData.categories.length === 0
                        ? <SelectItem value="__none__" disabled>No categories — create one first</SelectItem>
                        : refData.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.type})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {form.category_id && !loadingQs && (
                    <p className={cn("text-xs flex items-center gap-1.5", catQs.length > 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400")}>
                      {catQs.length > 0
                        ? <><Check size={11} /> {catQs.length} question{catQs.length !== 1 ? "s" : ""} in this category</>
                        : <>⚠ No questions in this category. <a href="/admin/feedback/questions" target="_blank" className="underline inline-flex items-center gap-0.5">Add <ExternalLink size={10} /></a></>}
                    </p>
                  )}
                  {loadingQs && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" />Loading questions…</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Start Date <span className="text-destructive">*</span></Label>
                    <Input type="date" className="h-9 text-sm" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>End Date <span className="text-destructive">*</span></Label>
                    <Input type="date" className="h-9 text-sm" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active</p>
                    <p className="text-xs text-muted-foreground">Students can see and submit this form</p>
                  </div>
                  <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
                </div>
              </div>

              {/* Audience — only on create */}
              {!isEdit && (
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    {sel && <div className={cn("w-5 h-5 rounded-md flex items-center justify-center shrink-0", TYPE_STYLE[form.form_type]?.icon)}><sel.icon size={12} /></div>}
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Audience — {sel?.label}</p>
                  </div>
                  {form.form_type === "TEACHING" && (
                    <div className="space-y-2">
                      <Label>Sections <span className="text-destructive">*</span></Label>
                      <MultiSelect options={refData.sections} value={form.section_ids} onChange={(v) => set("section_ids", v)}
                        placeholder="Select one or more sections…"
                        labelFn={(s) => `${s.name}${s.course?.name ? ` — ${s.course.name}` : ""} (Sem ${s.semester})`} />
                      {form.section_ids.length > 0 && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                          <p className="text-xs text-blue-700 dark:text-blue-400"><strong>Auto-create:</strong> One form per subject×faculty in each section.</p>
                        </div>
                      )}
                    </div>
                  )}
                  {form.form_type === "GENERAL" && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <p className="text-xs text-amber-700 dark:text-amber-400">Visible to <strong>all active enrolled students</strong>.</p>
                    </div>
                  )}
                  {form.form_type === "GROUP" && (
                    <div className="space-y-2">
                      <Label>Special Group <span className="text-destructive">*</span></Label>
                      <Select value={form.group_id} onValueChange={(v) => set("group_id", v)}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select a group…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Select group —</SelectItem>
                          {refData.groups.length === 0
                            ? <SelectItem value="__none__" disabled>No groups</SelectItem>
                            : refData.groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name} ({g._count?.members ?? 0} members)</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Questions step */}
          {step === questionsStep && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">Questions</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  From <strong>{refData.categories.find((c) => c.id === form.category_id)?.name}</strong>. Uncheck to exclude.
                </p>
              </div>
              {loadingQs ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <Loader2 size={20} className="animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading questions…</span>
                </div>
              ) : catQs.length === 0 ? (
                <div className="text-center py-12 space-y-4 bg-muted/30 border-2 border-dashed border-border rounded-2xl">
                  <HelpCircle size={32} className="text-muted-foreground/40 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">No questions in this category</p>
                  <Button variant="outline" size="sm" onClick={() => window.open("/admin/feedback/questions", "_blank")}>
                    <ExternalLink size={13} className="mr-1.5" />Open Questions Page
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-medium">{includedCount} / {catQs.length} included</span>
                    <div className="flex gap-4">
                      <button onClick={() => setExcluded(new Set())} className="text-xs text-primary hover:underline">Include all</button>
                      <button onClick={() => setExcluded(new Set(catQs.map((q) => q.id)))} className="text-xs text-muted-foreground hover:underline">Exclude all</button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {catQs.map((q, i) => {
                      const isEx = excluded.has(q.id);
                      const Icon = Q_ICONS[q.type] || HelpCircle;
                      return (
                        <div key={q.id} onClick={() => setExcluded((s) => { const n = new Set(s); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}
                          className={cn("flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer select-none transition-all",
                            isEx ? "border-border bg-muted/20 opacity-50" : "border-primary/20 bg-card hover:border-primary/40")}>
                          <div onClick={(e) => e.stopPropagation()} className="shrink-0 mt-0.5">
                            <Checkbox checked={!isEx} onCheckedChange={() => setExcluded((s) => { const n = new Set(s); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })} />
                          </div>
                          <div className={cn("w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5", isEx ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>{i + 1}</div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1"><Icon size={11} />{q.type}</span>
                              {q.is_required && !isEx && <span className="text-[10px] text-destructive font-semibold">Required</span>}
                            </div>
                            <p className={cn("text-sm font-medium leading-snug", isEx ? "line-through text-muted-foreground" : "text-foreground")}>{q.question}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="sm:hidden flex items-center justify-between px-4 py-3 border-t border-border bg-card shrink-0">
        <Button variant="outline" size="sm" onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}>
          {step === 0 ? "Cancel" : <><ArrowLeft size={13} className="mr-1" />Back</>}
        </Button>
        {step < totalSteps - 1
          ? <Button size="sm" onClick={handleNext}>Next <ArrowRight size={13} className="ml-1" /></Button>
          : <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : isEdit ? "Save" : "Create"}
          </Button>}
      </div>
    </div>
  );
}

// ── Delete guard ───────────────────────────────────────────────
function DeleteGuardModal({ form, onClose, onDeleted }) {
  const [step, setStep] = useState("confirm");
  const [loading, setLoading] = useState(false);
  const responses = form._count?.responses ?? 0;

  const delResponses = async () => {
    setLoading(true);
    try { await axiosInstance.delete(EP.feedback.deleteResponses?.(form.id) || `/feedback/forms/${form.id}/responses`); notify.success("Responses deleted"); setStep("done"); }
    catch (err) { notify.error(err.response?.data?.message ?? "Failed"); }
    finally { setLoading(false); }
  };
  const delForm = async () => {
    setLoading(true);
    try { await axiosInstance.delete(EP.feedback.formById(form.id)); notify.success("Form deleted"); onDeleted(); }
    catch (err) { notify.error(err.response?.data?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle size={16} /> Delete Form</DialogTitle>
          <DialogDescription>"{form.title}"</DialogDescription>
        </DialogHeader>
        {step === "confirm" && responses > 0 ? (
          <div className="space-y-4 py-1">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-sm">This form has <strong className="text-destructive">{responses} response(s)</strong>. Delete responses first.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1" onClick={delResponses} disabled={loading}>
                {loading && <Loader2 size={13} className="mr-1.5 animate-spin" />}Delete {responses} Response(s)
              </Button>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            {step === "done" && <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl"><p className="text-sm text-green-700 dark:text-green-400">All responses deleted.</p></div>}
            {step === "confirm" && <p className="text-sm text-muted-foreground">No responses. This form will be permanently deleted.</p>}
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1" onClick={delForm} disabled={loading}>
                {loading && <Loader2 size={13} className="mr-1.5 animate-spin" />}Delete Permanently
              </Button>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function FeedbackFormsPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");   // all | active | scheduled | expired | inactive
  const [typeFilter, setTypeFilter] = useState("all");   // all | TEACHING | GENERAL | GROUP
  const searchTO = useRef(null);
  const PER_PAGE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PER_PAGE };
      if (typeFilter !== "all") params.category_type = typeFilter;
      if (search) params.search = search;
      const res = await axiosInstance.get(EP.feedback.forms, { params });
      const d = res.data?.data ?? res.data;
      const list = d?.forms ?? d?.data?.forms ?? (Array.isArray(d) ? d : []);
      setForms(Array.isArray(list) ? list : []);
      setPagination(d?.pagination ?? d?.data?.pagination ?? {});
    } catch { notify.error("Failed to load forms"); }
    finally { setLoading(false); }
  }, [page, search, filter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (form) => {
    try { await axiosInstance.patch(EP.feedback.toggleActive(form.id)); notify.success(`Form ${form.is_active ? "deactivated" : "activated"}`); load(); }
    catch { notify.error("Failed"); }
  };

  // Client-side status filter
  const now = new Date();
  const displayed = forms.filter((f) => {
    if (filter === "active") return f.is_active && new Date(f.start_date) <= now && new Date(f.end_date) >= now;
    if (filter === "scheduled") return f.is_active && new Date(f.start_date) > now;
    if (filter === "expired") return new Date(f.end_date) < now;
    if (filter === "inactive") return !f.is_active;
    return true;
  });

  const statusCounts = {
    active: forms.filter((f) => f.is_active && new Date(f.start_date) <= now && new Date(f.end_date) >= now).length,
    scheduled: forms.filter((f) => f.is_active && new Date(f.start_date) > now).length,
    expired: forms.filter((f) => new Date(f.end_date) < now).length,
    inactive: forms.filter((f) => !f.is_active).length,
  };

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Feedback Forms</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pagination.total ?? forms.length} forms
              {statusCounts.active > 0 && <> · <span className="text-green-600">{statusCounts.active} active</span></>}
              {statusCounts.scheduled > 0 && <> · <span className="text-blue-600">{statusCounts.scheduled} scheduled</span></>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={load}>
              <RefreshCw size={13} className={cn(loading && "animate-spin")} />
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={13} className="mr-1.5" />New Form
            </Button>
          </div>
        </div>

        {/* Search + filters */}
        <div className="space-y-2">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input type="text" placeholder="Search forms…" defaultValue={search}
              onChange={(e) => { clearTimeout(searchTO.current); searchTO.current = setTimeout(() => { setSearch(e.target.value); setPage(1); }, 350); }}
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>

          {/* Status + type filters */}
          <div className="flex gap-1.5 flex-wrap">
            {[["all", "All", forms.length], ["active", "Active", statusCounts.active], ["scheduled", "Scheduled", statusCounts.scheduled], ["expired", "Expired", statusCounts.expired], ["inactive", "Inactive", statusCounts.inactive]].map(([v, l, c]) => (
              <button key={v} onClick={() => { setFilter(v); setPage(1); }}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", filter === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                {l} <span className="opacity-60 ml-0.5">{c}</span>
              </button>
            ))}
            <div className="w-px bg-border mx-1" />
            {[["all", "All Types"], ["TEACHING", "Teaching"], ["GENERAL", "General"], ["GROUP", "Group"]].map(([v, l]) => (
              <button key={v} onClick={() => { setTypeFilter(v); setPage(1); }}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", typeFilter === v ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground")}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Table — scales to N forms */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loading && displayed.length === 0 ? (
            <div className="space-y-0 divide-y divide-border">
              {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-muted/30 animate-pulse" />)}
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <BookOpen size={24} className="text-muted-foreground opacity-40" />
              </div>
              <p className="text-sm text-muted-foreground">{search ? `No forms matching "${search}"` : "No forms yet."}</p>
              <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={13} className="mr-1.5" />Create First Form</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    {["Form", "Category", "Target", "Period", "Responses", "Status", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayed.map((f) => {
                    const st = getStatus(f);
                    const typeStyle = TYPE_STYLE[f.form_type] || TYPE_STYLE.GENERAL;
                    return (
                      <tr key={f.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-4 py-3 max-w-[220px]">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0", typeStyle.badge)}>
                              {(f.form_type || "GEN").slice(0, 3)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate text-sm">{f.title}</p>
                              {f.action_taken && <p className="text-[10px] text-green-600 truncate">✓ {f.action_taken}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{f.category?.name || "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          <div className="space-y-0.5">
                            {f.faculty && <p className="whitespace-nowrap">👤 {f.faculty.name}</p>}
                            {f.subject && <p className="whitespace-nowrap">📖 {f.subject.name}</p>}
                            {f.section && <p className="whitespace-nowrap">🏫 Sec {f.section.name}</p>}
                            {f.group && <p className="whitespace-nowrap">👥 {f.group.name}</p>}
                            {!f.faculty && !f.subject && !f.section && !f.group && <p>All students</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          <p>{new Date(f.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                          <p>{new Date(f.end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-bold text-foreground">{f._count?.responses ?? 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", st.cls)}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Toggle active */}
                            <button onClick={() => handleToggle(f)} title={f.is_active ? "Deactivate" : "Activate"}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
                              {f.is_active ? <ToggleRight size={15} className="text-green-500" /> : <ToggleLeft size={15} />}
                            </button>
                            {/* Edit */}
                            <button onClick={() => setEditTarget(f)} title="Edit"
                              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                              <Pencil size={13} />
                            </button>
                            {/* Results */}
                            <button onClick={() => navigate(`/admin/feedback/results/${f.id}`)} title="View results"
                              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors">
                              <BarChart2 size={13} />
                            </button>
                            {/* Delete */}
                            <button onClick={() => setDelTarget(f)} title="Delete"
                              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {(pagination.pages > 1) && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Page {page} of {pagination.pages} · {pagination.total} total
              </span>
              <div className="flex gap-1">
                {[["«", 1], ["‹", page - 1], ["›", page + 1], ["»", pagination.pages]].map(([l, t], i) => (
                  <button key={i} onClick={() => setPage(Math.max(1, Math.min(pagination.pages, t)))}
                    disabled={t < 1 || t > pagination.pages || t === page}
                    className="h-8 w-8 rounded-lg border border-input bg-background text-sm text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      <FormModal open={showCreate} onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load(); }} />

      {/* Edit modal */}
      <FormModal open={!!editTarget} onClose={() => setEditTarget(null)} editData={editTarget} onSaved={() => { setEditTarget(null); load(); }} />

      {/* Delete guard */}
      {delTarget && <DeleteGuardModal form={delTarget} onClose={() => setDelTarget(null)} onDeleted={() => { setDelTarget(null); load(); }} />}
    </>
  );
}