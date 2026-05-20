import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSections, createSection, updateSection, deleteSection,
  assignSubject, updateSubjectAssign, removeSubjectAssign,
  fetchCourses, fetchSubjects, fetchPrograms, fetchDepartments,
} from "../../redux/academic/academicSlice.js";
import axiosInstance from "../../lib/axios.js";

import { Layers, ChevronRight, Plus, X, Pencil, Trash2, Upload, Download, UserCheck, ArrowUp, Users } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmModal, Spinner, ResultsModal } from "../AcademicPage.jsx";
import { PromoteSectionsModal, SectionBulkStatusModal } from "../../components/SectionPromoteModal.jsx";
import { cn } from "../../lib/utils.js";
import { notify } from "../../hooks/notify.js";

const TYPES = ["REGULAR", "ELECTIVE", "COMBINED", "TRAINING", "OTHER"];
const STATUSES = ["ACTIVE", "COMPLETED", "REMOVED"];
const TYPE_COLOR = {
  REGULAR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ELECTIVE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  COMBINED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  TRAINING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  OTHER: "bg-muted text-muted-foreground",
};
const STATUS_COLOR = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  COMPLETED: "bg-muted text-muted-foreground",
  REMOVED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// ── Section modal ───────────────────────────────────────────────
function SectionModal({ open, onClose, onSubmit, initialData, loading, courses, faculty }) {
  const BLANK = { name: "", course_id: "", semester: "1", batch: "", room_no: "", class_coordinator_id: "none" };
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: initialData?.name || "",
      course_id: initialData?.course_id || initialData?.course?.id || "",
      semester: String(initialData?.semester || 1),
      batch: initialData?.batch || "",
      room_no: initialData?.room_no || "",
      class_coordinator_id: initialData?.class_coordinator_id || initialData?.class_coordinator?.id || "none",
    });
  }, [open, initialData]);

  if (!open) return null;
  const setV = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setE = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.course_id || !form.batch.trim()) return;
    onSubmit({
      name: form.name.trim(),
      course_id: form.course_id,
      semester: parseInt(form.semester),
      batch: form.batch.trim(),
      room_no: form.room_no.trim() || null,
      class_coordinator_id: form.class_coordinator_id === "none" ? null : form.class_coordinator_id,
    });
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initialData ? "Edit Section" : "New Section"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Section Name *</Label>
            <Input className="h-9 text-sm" value={form.name} onChange={setE("name")} placeholder="e.g. A, CS-B" />
          </div>
          <div className="space-y-1.5">
            <Label>Course *</Label>
            <Select value={form.course_id} onValueChange={setV("course_id")}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select course…" /></SelectTrigger>
              <SelectContent>
                {courses.length === 0
                  ? <SelectItem value="__none__" disabled>No courses found</SelectItem>
                  : courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} — {c.program?.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Semester *</Label>
              <Select value={form.semester} onValueChange={setV("semester")}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <SelectItem key={n} value={String(n)}>Sem {n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Batch *</Label>
              <Input className="h-9 text-sm" value={form.batch} onChange={setE("batch")} placeholder="2024-2028" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Room No <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input className="h-9 text-sm" value={form.room_no} onChange={setE("room_no")} placeholder="e.g. 101" />
          </div>
          <div className="space-y-1.5">
            <Label>Class Coordinator <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Select value={form.class_coordinator_id} onValueChange={setV("class_coordinator_id")}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No coordinator</SelectItem>
                {faculty.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}{f.emp_id ? ` (${f.emp_id})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={!form.name.trim() || !form.course_id || !form.batch.trim() || loading}
            onClick={handleSubmit}>
            {loading && <Spinner size={13} />} Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Assign subject modal ────────────────────────────────────────
function AssignModal({ open, onClose, onSubmit, loading, subjects, faculty, assignedIds = [] }) {
  const [form, setForm] = useState({ subject_id: "", faculty_id: "none", type: "REGULAR", status: "ACTIVE" });
  useEffect(() => {
    if (open) setForm({ subject_id: "", faculty_id: "none", type: "REGULAR", status: "ACTIVE" });
  }, [open]);
  if (!open) return null;

  const available = subjects.filter((s) => !assignedIds.includes(s.id));
  const setV = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Subject</DialogTitle>
          <DialogDescription>Assigning a faculty here also adds this subject to their profile automatically.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Subject *</Label>
            <Select value={form.subject_id} onValueChange={setV("subject_id")}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select subject…" /></SelectTrigger>
              <SelectContent>
                {available.length === 0
                  ? <SelectItem value="__all_assigned__" disabled>All subjects already assigned</SelectItem>
                  : available.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Faculty <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Select value={form.faculty_id} onValueChange={setV("faculty_id")}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No faculty assigned</SelectItem>
                {faculty.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}{f.emp_id ? ` (${f.emp_id})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={setV("type")}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={setV("status")}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={!form.subject_id || loading}
            onClick={() => onSubmit({ ...form, faculty_id: form.faculty_id === "none" ? null : form.faculty_id })}>
            {loading && <Spinner size={13} />} Assign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Subject row (inline edit) ───────────────────────────────────
function SubjectRow({ ss, faculty, onUpdate, onRemove, loading }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    faculty_id: ss.faculty_id || "none",
    type: ss.type,
    status: ss.status,
  });
  const setV = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  if (editing) {
    return (
      <tr className="bg-accent/30">
        <td colSpan={4} className="px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium min-w-[120px]">{ss.subject?.name}</span>
            <Select value={form.faculty_id} onValueChange={setV("faculty_id")}>
              <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No faculty</SelectItem>
                {faculty.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.type} onValueChange={setV("type")}>
              <SelectTrigger className="h-8 text-xs w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.status} onValueChange={setV("status")}>
              <SelectTrigger className="h-8 text-xs w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex gap-1 ml-auto">
              <Button size="sm" className="h-7 text-xs" disabled={loading}
                onClick={() => {
                  onUpdate({ ...form, faculty_id: form.faculty_id === "none" ? null : form.faculty_id });
                  setEditing(false);
                }}>
                {loading ? <Spinner size={11} /> : "Save"}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(false)}>
                <X size={12} />
              </Button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border/50 hover:bg-muted/20">
      <td className="pl-4 pr-2 py-2.5">
        <p className="text-sm font-medium">{ss.subject?.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{ss.subject?.code}</p>
      </td>
      <td className="px-2 py-2.5 text-sm text-muted-foreground">
        {ss.faculty ? (
          <span className="flex items-center gap-1.5">
            <UserCheck size={12} className="text-green-600" />
            {ss.faculty.name}
          </span>
        ) : <span className="text-muted-foreground/50 text-xs">No faculty</span>}
      </td>
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            TYPE_COLOR[ss.type] || TYPE_COLOR.OTHER)}>{ss.type}</span>
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            STATUS_COLOR[ss.status] || STATUS_COLOR.ACTIVE)}>{ss.status}</span>
        </div>
      </td>
      <td className="px-2 py-2.5 text-right">
        <div className="flex items-center justify-end gap-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditing(true)}>
            <Pencil size={11} />
          </Button>
          <Button variant="ghost" size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onRemove}>
            <X size={11} />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// ── Section row (collapsible) ───────────────────────────────────
function SectionRow({ section, allSubjects, allFaculty, onEdit, onDelete, onPromote, onBulkStatus, onRefresh }) {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((s) => s.academic.sections);
  const [expanded, setExpanded] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const assignedIds = section.sectionSubjects?.map((ss) => ss.subject_id) || [];

  const handleAssign = async (data) => {
    const r = await dispatch(assignSubject({ id: section.id, data }));
    if (assignSubject.fulfilled.match(r)) { notify.success("Subject assigned"); setAssignOpen(false); onRefresh(); }
    else notify.error(r.payload);
  };
  const handleUpdate = async (subId, data) => {
    const r = await dispatch(updateSubjectAssign({ id: section.id, subId, data }));
    if (updateSubjectAssign.fulfilled.match(r)) { notify.success("Updated"); onRefresh(); }
    else notify.error(r.payload);
  };
  const handleRemove = async (subId) => {
    const r = await dispatch(removeSubjectAssign({ id: section.id, subId }));
    if (removeSubjectAssign.fulfilled.match(r)) { notify.success("Removed"); onRefresh(); }
    else notify.error(r.payload);
  };

  return (
    <>
      <tr className={cn("hover:bg-muted/30 transition-colors", expanded && "bg-muted/20")}>
        <td className="w-8 px-2 py-3">
          <button onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight size={14} className={cn("transition-transform duration-200", expanded && "rotate-90")} />
          </button>
        </td>
        <td className="px-3 py-3">
          <p className="text-sm font-medium">{section.name}</p>
          {section.room_no && <p className="text-xs text-muted-foreground">Room {section.room_no}</p>}
        </td>
        <td className="px-3 py-3 text-sm text-muted-foreground hidden sm:table-cell">
          {section.course?.name}
          <span className="text-xs ml-1 opacity-60">· {section.course?.program?.name}</span>
        </td>
        <td className="px-3 py-3 text-sm text-muted-foreground hidden md:table-cell">Sem {section.semester}</td>
        <td className="px-3 py-3 text-sm text-muted-foreground hidden md:table-cell">{section.batch}</td>
        <td className="px-3 py-3 text-sm hidden lg:table-cell">
          {section.class_coordinator ? (
            <span className="flex items-center gap-1.5 text-foreground">
              <UserCheck size={12} className="text-green-600" />
              {section.class_coordinator.name}
            </span>
          ) : <span className="text-muted-foreground/50 text-xs">—</span>}
        </td>
        <td className="px-3 py-3 text-sm text-muted-foreground hidden lg:table-cell">
          {section.sectionSubjects?.length || 0}
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center justify-end gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                  onClick={() => onPromote(section)}>
                  <ArrowUp size={13} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Promote section</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onBulkStatus(section)}>
                  <Users size={13} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bulk status</TooltipContent>
            </Tooltip>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onEdit}>
              <Pencil size={13} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
              <Trash2 size={13} />
            </Button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={8} className="bg-muted/10 border-b border-border">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Subjects ({section.sectionSubjects?.length || 0})
                </p>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
                  onClick={() => setAssignOpen(true)}>
                  <Plus size={11} /> Assign Subject
                </Button>
              </div>
              {!section.sectionSubjects?.length ? (
                <p className="text-sm text-muted-foreground py-1">No subjects assigned yet.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Subject", "Faculty", "Type / Status", ""].map((h) => (
                        <th key={h} className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.sectionSubjects.map((ss) => (
                      <SubjectRow key={ss.id} ss={ss} faculty={allFaculty}
                        onUpdate={(data) => handleUpdate(ss.subject_id, data)}
                        onRemove={() => handleRemove(ss.subject_id)}
                        loading={actionLoading} />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}

      <AssignModal open={assignOpen} onClose={() => setAssignOpen(false)}
        onSubmit={handleAssign} loading={actionLoading}
        subjects={allSubjects} faculty={allFaculty} assignedIds={assignedIds} />
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function SectionsPage() {
  const dispatch = useDispatch();
  const { list, pagination, loading, actionLoading } = useSelector((s) => s.academic.sections);
  const { list: courses } = useSelector((s) => s.academic.courses);
  const { list: subjects } = useSelector((s) => s.academic.subjects);
  const { list: programs } = useSelector((s) => s.academic.programs);
  const { list: departments } = useSelector((s) => s.academic.departments);
  const [faculty, setFaculty] = useState([]);

  useEffect(() => {
    axiosInstance.get("/faculty?limit=200")
      .then((r) => setFaculty(r.data.data?.faculty || []))
      .catch(() => { });
  }, []);

  const [search, setSearch] = useState("");
  const [filterCourse, setFC] = useState("all");
  const [filterSem, setFS] = useState("all");
  const [filterDept, setFD] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [results, setResults] = useState(null);
  const [promoteModal, setPromoteModal] = useState(false);
  const [promoteInit, setPromoteInit] = useState(null); // pre-selected section ids
  const [statusModal, setStatusModal] = useState(null); // section object
  const fileRef = useRef();
  const subFileRef = useRef();

  const load = useCallback(() => {
    dispatch(fetchSections({
      page, limit: 20,
      ...(search && { search }),
      ...(filterCourse !== "all" && { course_id: filterCourse }),
      ...(filterSem !== "all" && { semester: filterSem }),
      ...(filterDept !== "all" && { dept_id: filterDept }),
    }));
  }, [page, search, filterCourse, filterSem, filterDept, dispatch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!courses.length) dispatch(fetchCourses({ limit: 200 }));
    if (!subjects.length) dispatch(fetchSubjects({ limit: 500 }));
    if (!programs.length) dispatch(fetchPrograms({ limit: 200 }));
    if (!departments.length) dispatch(fetchDepartments({ limit: 200 }));
  }, []);

  const handleCreate = async (data) => {
    const r = await dispatch(createSection(data));
    if (createSection.fulfilled.match(r)) { notify.success("Section created"); setModal(null); load(); }
    else notify.error(r.payload);
  };
  const handleUpdate = async (data) => {
    const r = await dispatch(updateSection({ id: modal.id, data }));
    if (updateSection.fulfilled.match(r)) { notify.success("Updated"); setModal(null); load(); }
    else notify.error(r.payload);
  };
  const handleDelete = async () => {
    const r = await dispatch(deleteSection(del.id));
    if (deleteSection.fulfilled.match(r)) { notify.success("Deleted"); setDel(null); load(); }
    else notify.error(r.payload);
  };

  const handleBulkUpload = async (file, url) => {
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await axiosInstance.post(url, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResults(res.data.data); load();
    } catch (err) { notify.error(err.response?.data?.message || "Upload failed"); }
  };

  const handleTemplate = async (url, name) => {
    try {
      const res = await axiosInstance.get(url, { responseType: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(res.data); a.download = name; a.click();
    } catch { notify.error("Download failed"); }
  };

  const filteredCourses = filterDept === "all"
    ? courses
    : courses.filter((c) => c.program?.department?.id === filterDept);

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Layers size={19} className="text-muted-foreground" /> Sections
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{pagination.total} sections</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input ref={fileRef} type="file" accept=".xlsx" className="sr-only"
              onChange={(e) => { if (e.target.files[0]) { handleBulkUpload(e.target.files[0], "/sections/bulk-upload"); e.target.value = ""; } }} />
            <input ref={subFileRef} type="file" accept=".xlsx" className="sr-only"
              onChange={(e) => { if (e.target.files[0]) { handleBulkUpload(e.target.files[0], "/sections/bulk-assign-subjects"); e.target.value = ""; } }} />
            <Button variant="outline" size="sm" onClick={() => handleTemplate("/sections/template", "section_template.xlsx")}>
              <Download size={13} className="mr-1.5" /> Section Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleTemplate("/sections/subject-template", "subject_assign_template.xlsx")}>
              <Download size={13} className="mr-1.5" /> Subject Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload size={13} className="mr-1.5" /> Bulk Sections
            </Button>
            <Button variant="outline" size="sm" onClick={() => subFileRef.current?.click()}>
              <Upload size={13} className="mr-1.5" /> Bulk Assign
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setPromoteInit(null); setPromoteModal(true); }}
              className="text-green-700 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800">
              <ArrowUp size={13} className="mr-1.5" /> Promote Sections
            </Button>
            <Button size="sm" onClick={() => setModal("create")}>
              <Plus size={13} className="mr-1.5" /> Add Section
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <Input className="pl-8 h-9 text-sm" placeholder="Search section…"
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>

          <Select value={filterDept} onValueChange={(v) => { setFD(v); setFC("all"); setPage(1); }}>
            <SelectTrigger className="h-9 text-sm w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterCourse} onValueChange={(v) => { setFC(v); setPage(1); }}>
            <SelectTrigger className="h-9 text-sm w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {filteredCourses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterSem} onValueChange={(v) => { setFS(v); setPage(1); }}>
            <SelectTrigger className="h-9 text-sm w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <SelectItem key={n} value={String(n)}>Sem {n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="w-8 px-2 py-3" />
                  {["Section", "Course", "Sem", "Batch", "Coordinator", "Subjects", "Actions"].map((h, i) => (
                    <th key={h} className={cn(
                      "px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide",
                      i < 6 ? "text-left" : "text-right",
                      i === 2 || i === 3 ? "hidden md:table-cell" : "",
                      i === 4 || i === 5 ? "hidden lg:table-cell" : "",
                      i === 1 ? "hidden sm:table-cell" : "",
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && list.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12">
                    <Spinner size={20} className="mx-auto text-muted-foreground" />
                  </td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                    No sections found. Add one or upload in bulk.
                  </td></tr>
                ) : list.map((section) => (
                  <SectionRow key={section.id} section={section}
                    allSubjects={subjects} allFaculty={faculty}
                    onEdit={() => setModal(section)}
                    onDelete={() => setDel(section)}
                    onPromote={(s) => { setPromoteInit([s.id]); setPromoteModal(true); }}
                    onBulkStatus={(s) => setStatusModal(s)}
                    onRefresh={load} />
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
              <span>{((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7 text-xs" disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}>‹</Button>
                <Button variant="outline" size="icon" className="h-7 w-7 text-xs" disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}>›</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <SectionModal open={!!modal} onClose={() => setModal(null)}
        onSubmit={modal === "create" ? handleCreate : handleUpdate}
        initialData={modal !== "create" ? modal : null}
        loading={actionLoading} courses={courses} faculty={faculty} />

      <ConfirmModal open={!!del} onClose={() => setDel(null)} title="Delete Section"
        description={`Delete "${del?.name}"? All enrollments and subject assignments will also be deleted.`}
        onConfirm={handleDelete} loading={actionLoading} />

      <ResultsModal open={!!results} onClose={() => setResults(null)} title="Bulk Upload Results" data={results} />

      <PromoteSectionsModal
        open={promoteModal}
        onClose={() => setPromoteModal(false)}
        sections={list}
        initialSelected={promoteInit}
        onSuccess={load} />

      <SectionBulkStatusModal
        open={!!statusModal}
        onClose={() => setStatusModal(null)}
        section={statusModal}
        onSuccess={load} />
    </>
  );
}