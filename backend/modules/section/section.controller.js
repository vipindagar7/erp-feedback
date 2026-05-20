import * as svc from "./section.service.js";

export const getAll = async (req, res, next) => {
  try { return res.json({ success: true, data: await svc.getAllSections(req.validatedData) }); }
  catch (e) { next(e); }
};
export const getById = async (req, res, next) => {
  try {
    const s = await svc.getSectionById(req.params.id);
    if (!s) return res.status(404).json({ success: false, message: "Section not found" });
    return res.json({ success: true, data: s });
  } catch (e) { next(e); }
};
export const create = async (req, res, next) => {
  try { return res.status(201).json({ success: true, message: "Section created", data: await svc.createSection(req.validatedData) }); }
  catch (e) { next(e); }
};
export const update = async (req, res, next) => {
  try { return res.json({ success: true, message: "Updated", data: await svc.updateSection(req.params.id, req.validatedData) }); }
  catch (e) { next(e); }
};
export const remove = async (req, res, next) => {
  try { await svc.deleteSection(req.params.id); return res.json({ success: true, message: "Deleted" }); }
  catch (e) { next(e); }
};

// ── Subject assignment ─────────────────────────────────────────
export const assignSubject = async (req, res, next) => {
  try {
    const { subject_id, faculty_id, type, status } = req.validatedData;
    const result = await svc.assignSubjectToSection(req.params.id, subject_id, faculty_id || null, type, status);
    return res.json({ success: true, message: "Subject assigned", data: result });
  } catch (e) { next(e); }
};
export const updateSubjectAssignment = async (req, res, next) => {
  try {
    const result = await svc.updateSectionSubject(req.params.id, req.params.subject_id, req.validatedData);
    return res.json({ success: true, message: "Updated", data: result });
  } catch (e) { next(e); }
};
export const removeSubject = async (req, res, next) => {
  try {
    const result = await svc.removeSubjectFromSection(req.params.id, req.params.subject_id);
    return res.json({ success: true, message: "Subject removed", data: result });
  } catch (e) { next(e); }
};

// ── Bulk upload ────────────────────────────────────────────────
export const bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    const r = await svc.bulkCreateSections(req.file.buffer);
    return res.json({ success: true, message: `${r.created.length} created, ${r.failed.length} failed`, data: r });
  } catch (e) { next(e); }
};
export const bulkAssignSubjects = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    const r = await svc.bulkAssignSubjects(req.file.buffer);
    return res.json({ success: true, message: `${r.created.length} assigned, ${r.failed.length} failed`, data: r });
  } catch (e) { next(e); }
};

// ── Templates ──────────────────────────────────────────────────
export const downloadTemplate = async (req, res, next) => {
  try {
    const buf = await svc.getSectionTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=section_template.xlsx");
    return res.send(buf);
  } catch (e) { next(e); }
};
export const downloadSubjectTemplate = async (req, res, next) => {
  try {
    const buf = await svc.getSectionSubjectTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=section_subject_template.xlsx");
    return res.send(buf);
  } catch (e) { next(e); }
};

export const promoteSectionController = async (req, res, next) => {
  try {
    const result = await svc.promoteSection(
      req.params.id,
      req.body.remarks
    );

    return res.json({
      success: true,
      message: `${result.promoted.length} promoted, ${result.skipped.length} skipped, ${result.failed.length} failed`,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

export const promoteMultipleSectionsController = async (
  req,
  res,
  next
) => {
  try {
    const { section_ids, remarks } = req.body;

    const results = await svc.promoteMultipleSections(
      section_ids,
      remarks
    );

    const totalPromoted = results.reduce(
      (s, r) => s + r.promoted.length,
      0
    );

    const totalSkipped = results.reduce(
      (s, r) => s + r.skipped.length,
      0
    );

    return res.json({
      success: true,
      message: `${totalPromoted} promoted, ${totalSkipped} skipped across ${results.length} sections`,
      data: results,
    });
  } catch (e) {
    next(e);
  }
};

export const setSectionStatusController = async (
  req,
  res,
  next
) => {
  try {
    const { status, remarks } = req.body;

    const result = await svc.setSectionStatus(
      req.params.id,
      status,
      remarks
    );

    return res.json({
      success: true,
      message: `${result.updated.length} student(s) marked ${status.toLowerCase()}`,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

export const getSectionStudentCountsController = async (
  req,
  res,
  next
) => {
  try {
    const counts = await svc.getSectionStudentCounts(
      req.body.section_ids

    );

    return res.json({
      success: true,
      data: counts,
    });
  } catch (e) {
    next(e);
  }
};