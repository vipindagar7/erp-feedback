
import xlsx from "xlsx";
import prisma from "../../utils/prisma.js";
// ── CATEGORY ──────────────────────────────────────────────────────────────────
export const getAllCategories = async () =>
  prisma.feedbackCategory.findMany({ orderBy: [{ is_active: "desc" }, { name: "asc" }], include: { _count: { select: { questions: true, forms: true } } } });

export const createCategory = async ({ name, type }) =>
  prisma.feedbackCategory.create({ data: { name, type, is_active: true } });

export const updateCategory = async (id, data) => {
  const existing = await prisma.feedbackCategory.findUnique({ where: { id } });
  if (!existing) { const e = new Error("Category not found"); e.statusCode = 404; throw e; }
  return prisma.feedbackCategory.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.is_active !== undefined && { is_active: Boolean(data.is_active) }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });
};

export const deleteCategory = async (id) => {
  await prisma.feedbackCategory.delete({ where: { id } });
  return { id };
};

// ── QUESTIONS ─────────────────────────────────────────────────────────────────
export const getQuestionsByCategory = async (category_id) =>
  prisma.feedbackQuestion.findMany({ where: { category_id }, orderBy: [{ order: "asc" }] });

export const createQuestion = async ({ category_id, question, type, options, is_required, order }) =>
  prisma.feedbackQuestion.create({ data: { category_id, question, type, options: options || [], is_required: is_required ?? true, order: order ?? 0 } });

export const updateQuestion = async (id, data) => {
  const existing = await prisma.feedbackQuestion.findUnique({ where: { id } });
  if (!existing) { const e = new Error("Question not found"); e.statusCode = 404; throw e; }
  return prisma.feedbackQuestion.update({
    where: { id },
    data: {
      ...(data.question !== undefined && { question: data.question }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.options !== undefined && { options: data.options }),
      ...(data.is_required !== undefined && { is_required: Boolean(data.is_required) }),
      ...(data.order !== undefined && { order: parseInt(data.order) }),
    },
  });
};

export const deleteQuestion = async (id) => {
  await prisma.feedbackQuestion.delete({ where: { id } });
  return { id };
};

// ── FORMS ─────────────────────────────────────────────────────────────────────
export const getAllForms = async ({ page = 1, limit = 10, is_active, form_type, category_type } = {}) => {
  const _page = parseInt(page) || 1;
  const _limit = parseInt(limit) || 10;
  const skip = (_page - 1) * _limit;
  const where = {
    ...(is_active !== undefined && { is_active: is_active === "true" || is_active === true }),
    ...((form_type || category_type) && { category: { type: form_type || category_type } }),
  };
  const [forms, total] = await Promise.all([
    prisma.feedbackForm.findMany({
      where, skip, take: _limit, orderBy: [{ is_active: "desc" }, { start_date: "desc" }],
      include: {
        category: { select: { id: true, name: true, type: true } },
        faculty: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
        specialGroup: { select: { id: true, name: true } },
        _count: { select: { responses: true } },
      },
    }),
    prisma.feedbackForm.count({ where }),
  ]);
  return { forms, pagination: { total, page: _page, limit: _limit, pages: Math.ceil(total / _limit) } };
};

export const getFormById = async (id) =>
  prisma.feedbackForm.findUnique({
    where: { id },
    include: {
      category: { include: { questions: { orderBy: { order: "asc" } } } },
      faculty: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
      section: { select: { id: true, name: true } },
    },
  });

export const createForm = async (data) => {
  return prisma.feedbackForm.create({
    data: {
      title: data.title,
      category_id: data.category_id,
      is_active: data.is_active ?? true,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      section_id: data.section_id || null,
      faculty_id: data.faculty_id || null,
      subject_id: data.subject_id || null,
      specialGroupId: data.group_id || data.specialGroupId || null,
    },
    include: { category: { select: { id: true, name: true } } },
  });
};

export const updateForm = async (id, data) => {
  const existing = await prisma.feedbackForm.findUnique({ where: { id } });
  if (!existing) { const e = new Error("Form not found"); e.statusCode = 404; throw e; }

  // Build safe update — only known FeedbackForm fields
  // action_taken is handled separately via updateActionTaken
  const u = {};
  if (data.title !== undefined) u.title = data.title;
  if (data.category_id !== undefined) u.category_id = data.category_id;
  if (data.is_active !== undefined) u.is_active = Boolean(data.is_active);
  if (data.all_students !== undefined) u.all_students = Boolean(data.all_students);
  if (data.batch_year !== undefined) u.batch_year = data.batch_year ? parseInt(data.batch_year) : null;
  if (data.department_id !== undefined) u.department_id = data.department_id || null;
  if (data.course_id !== undefined) u.course_id = data.course_id || null;
  if (data.faculty_id !== undefined) u.faculty_id = data.faculty_id || null;
  if (data.subject_id !== undefined) u.subject_id = data.subject_id || null;
  if (data.section_id !== undefined) u.section_id = data.section_id || null;
  if (data.group_id !== undefined) u.specialGroupId = data.group_id || null;
  if (data.specialGroupId !== undefined) u.specialGroupId = data.specialGroupId || null;
  if (data.start_date !== undefined) u.start_date = data.start_date ? new Date(data.start_date) : existing.start_date;
  if (data.end_date !== undefined) u.end_date = data.end_date ? new Date(data.end_date) : existing.end_date;

  return prisma.feedbackForm.update({
    where: { id },
    data: u,
    include: { category: { select: { id: true, name: true } } },
  });
};

export const deleteForm = async (id) => {
  await prisma.feedbackForm.delete({ where: { id } });
  return { id };
};

// ── STUDENT - get active forms ────────────────────────────────────────────────
// Visibility rules:
//   section_id set  → only students in that section
//   faculty_id set  → only students whose section has a SectionSubject taught by that faculty
//   group_id set    → only students who are members of that SpecialGroup
//   none set        → all active students (general form)
//   multiple set    → student must satisfy ALL conditions (AND)
export const getActiveFormsForStudent = async (student_id) => {
  const now = new Date();

  // Load student profile — section, and special group memberships
  const student = await prisma.student.findUnique({
    where: { id: student_id },
    select: {
      id: true,
      section_id: true,
      specialGroupMembers: { select: { group_id: true } },
    },
  });
  if (!student) { const e = new Error("Student not found"); e.statusCode = 404; throw e; }

  // IDs the student belongs to
  const studentSectionId = student.section_id;
  const studentGroupIds = student.specialGroupMembers.map((g) => g.group_id);

  // Get all faculty who teach in the student's section
  const sectionSubjects = studentSectionId
    ? await prisma.sectionSubject.findMany({
      where: { section_id: studentSectionId, faculty_id: { not: null } },
      select: { faculty_id: true },
    })
    : [];
  const facultyIdsInSection = [...new Set(sectionSubjects.map((s) => s.faculty_id).filter(Boolean))];

  // Fetch all active, in-window forms
  const allForms = await prisma.feedbackForm.findMany({
    where: { is_active: true, start_date: { lte: now }, end_date: { gte: now } },
    include: {
      category: { include: { questions: { orderBy: { order: "asc" } } } },
      faculty: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
      section: { select: { id: true, name: true } },
      responses: { where: { student_id }, select: { id: true } },
    },
  });

  // Filter: student must satisfy every targeting constraint on the form
  const visible = allForms.filter((form) => {
    // Section targeting — student must be in this section
    if (form.section_id) {
      if (form.section_id !== studentSectionId) return false;
    }

    // Faculty targeting — faculty must teach in the student's section
    if (form.faculty_id) {
      if (!facultyIdsInSection.includes(form.faculty_id)) return false;
    }

    // Group targeting — student must be a member of this group
    if (form.specialGroupId) {
      if (!studentGroupIds.includes(form.specialGroupId)) return false;
    }

    // No constraints → general form → visible to all
    return true;
  });

  return visible.map((f) => ({ ...f, submitted: f.responses.length > 0, responses: undefined }));
};

// ── RESPONSE — submit feedback ────────────────────────────────────────────────
export const submitFeedback = async (form_id, student_id, answers) => {
  const form = await prisma.feedbackForm.findUnique({ where: { id: form_id }, include: { category: { include: { questions: true } } } });
  if (!form) { const e = new Error("Form not found"); e.statusCode = 404; throw e; }
  if (!form.is_active) { const e = new Error("Form is not active"); e.statusCode = 400; throw e; }
  const now = new Date();
  if (now < form.start_date || now > form.end_date) { const e = new Error("Form is not in the submission window"); e.statusCode = 400; throw e; }
  const existing = await prisma.feedbackResponse.findUnique({ where: { form_id_student_id: { form_id, student_id } } });
  if (existing) { const e = new Error("You have already submitted this feedback"); e.statusCode = 409; throw e; }
  return prisma.feedbackResponse.create({
    data: {
      form_id, student_id,
      answers: { create: answers.map(({ question_id, answer_text, rating, selected }) => ({ question_id, answer_text, rating, selected })) },
    },
    include: { answers: true },
  });
};

// ── ADMIN — form results with full student details ────────────────────────────
export const getFormResults = async (form_id) => {
  const form = await prisma.feedbackForm.findUnique({
    where: { id: form_id },
    include: {
      responses: {
        include: {
          student: {
            select: {
              id: true, name: true, roll_no: true, enrollment_no: true, batch_year: true,
              user: { select: { email: true } },
              department: { select: { id: true, name: true } },
              program: { select: { id: true, name: true } },
              course: { select: { id: true, name: true } },
              section: {
                select: {
                  id: true, name: true, batch: true, semester: true,
                  course: { select: { name: true } },
                },
              },
            },
          },
          answers: { include: { question: true } },
        },
        orderBy: { submittedAt: "desc" },
      },
      category: { include: { questions: { orderBy: { order: "asc" } } } },
      faculty: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
      section: { select: { id: true, name: true } },
      _count: { select: { responses: true } },
    },
  });
  if (!form) { const e = new Error("Form not found"); e.statusCode = 404; throw e; }
  return form;
};

// ── Export results as Excel ───────────────────────────────────────────────────
export const exportFormResults = async (form_id) => {
  const result = await getFormResults(form_id);
  // Handle both new shape { form, question_stats, responses } and old flat shape
  const form = result.form ?? result;
  const responses_data = result.responses ?? result.responses ?? [];
  // Build questions list from question_stats or category.questions
  const questions = (result.question_stats ?? result.category?.questions ?? [])
    .map((q) => ({ id: q.id, question: q.question, type: q.type }));

  // Header
  const headers = [
    "Student Name", "Roll Number", "Enrollment No", "Email",
    "Department", "Program", "Course", "Section", "Batch", "Semester", "Batch year",
    "Submitted At",
    ...questions.map((q, i) => `Q${i + 1}: ${q.question}`),
  ];

  const rows = responses_data.map((r) => {
    const s = r.student;
    const ansMap = {};
    r.answers.forEach((a) => { ansMap[a.question_id] = a.rating ?? a.answer_text ?? a.selected ?? ""; });
    return [
      s?.name || "",
      s?.roll_no || "",
      s?.enrollment_no || "",
      s?.user?.email || "",
      s?.department?.name || "",
      s?.program?.name || "",
      s?.course?.name || "",
      s?.section?.name || "",
      s?.section?.batch || "",
      s?.section?.semester || "",
      s?.batch_year || "",
      new Date(r.submittedAt).toLocaleString("en-IN"),
      ...questions.map((q) => ansMap[q.id] ?? ""),
    ];
  });

  const ws = xlsx.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 18) }));

  // Summary sheet
  const summaryRows = [["Question", "Type", "Avg Rating / Most Common", "Response Count"]];
  (result.question_stats ?? result.category?.questions ?? []).forEach((q) => {
    let summary = "";
    if (q.type === "RATING") {
      summary = q.avg_rating ? String(q.avg_rating) : "—";
    } else if (q.type === "MCQ") {
      const top = Object.entries(q.distribution || {}).sort((a, b) => b[1] - a[1])[0];
      summary = top ? `${top[0]} (${top[1]})` : "—";
    } else {
      summary = `${(q.text_answers || []).length} answers`;
    }
    summaryRows.push([q.question, q.type, summary, q.total_answers]);
  });

  // Action taken row at top
  summaryRows.unshift(["Action Taken", form.action_taken || "(none)", "", ""]);
  summaryRows.unshift(["Form Title", form.title, "", ""]);
  summaryRows.unshift(["Faculty", form.faculty?.name || "", "", ""]);
  summaryRows.unshift(["Subject", form.subject?.name || "", "", ""]);
  summaryRows.unshift(["Section", form.section?.name || "", "", ""]);
  summaryRows.unshift([]);

  const wsSummary = xlsx.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 30 }, { wch: 40 }, { wch: 30 }, { wch: 18 }];

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Responses");
  xlsx.utils.book_append_sheet(wb, wsSummary, "Summary");

  const filename = `feedback_${form.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.xlsx`;
  return { buffer: xlsx.write(wb, { type: "buffer", bookType: "xlsx" }), filename };
};

// ── Template + bulk submit (unchanged) ───────────────────────────────────────
export const generateFeedbackTemplate = async (form_id) => {
  const form = await prisma.feedbackForm.findUnique({
    where: { id: form_id },
    include: { category: { include: { questions: { orderBy: { order: "asc" } } } } },
  });
  if (!form) { const e = new Error("Form not found"); e.statusCode = 404; throw e; }
  const questions = form.category?.questions || [];
  const headers = ["student_email", "submitted_at", ...questions.map((q, i) => `Q${i + 1}_${q.type}: ${q.question}`)];
  const example = ["student@college.edu", "2026-04-15", ...questions.map((q) => {
    if (q.type === "TEXT") return "Write your answer here";
    if (q.type === "RATING") return "4";
    if (q.type === "MCQ") return q.options?.[0] || "Option1";
    return "";
  })];
  const notes = [[], ["// INSTRUCTIONS:"], ["// student_email: must match an existing student account"], ["// RATING: 1-5"], ...questions.filter((q) => q.type === "MCQ").map((q) => [`// MCQ options: ${q.options?.join(" | ")}`]), ["// submitted_at: optional backdate — leave blank for now"], ["// Do NOT change column headers"]];
  const ws = xlsx.utils.aoa_to_sheet([headers, example, ...notes]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 24) }));
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Feedback");
  return { buffer: xlsx.write(wb, { type: "buffer", bookType: "xlsx" }), formTitle: form.title };
};

export const bulkSubmitFeedback = async (form_id, buffer) => {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  if (!rows.length) throw Object.assign(new Error("File is empty"), { statusCode: 400 });
  const form = await prisma.feedbackForm.findUnique({ where: { id: form_id }, include: { category: { include: { questions: { orderBy: { order: "asc" } } } } } });
  if (!form) { const e = new Error("Form not found"); e.statusCode = 404; throw e; }
  if (!form.is_active) { const e = new Error("Form is not active"); e.statusCode = 400; throw e; }
  const questions = form.category?.questions || [];
  if (!questions.length) throw Object.assign(new Error("Form has no questions"), { statusCode: 400 });
  const headers = Object.keys(rows[0] || {}).filter((h) => h !== "student_email");
  const questionMap = {};
  headers.forEach((header) => { const match = header.match(/^Q(\d+)_/); if (match) { const idx = parseInt(match[1]) - 1; if (questions[idx]) questionMap[header] = questions[idx]; } });
  const results = { success: [], failed: [], total: rows.length };
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]; const rowNum = i + 2;
    if (!row.student_email?.toString().trim()) { results.failed.push({ row: rowNum, email: "—", reason: "student_email is required" }); continue; }
    const email = row.student_email.toString().trim();
    try {
      const user = await prisma.user.findUnique({ where: { email }, include: { student: { select: { id: true, name: true, section_id: true } } } });
      if (!user) { results.failed.push({ row: rowNum, email, reason: "No account found with this email" }); continue; }
      if (!user.student) { results.failed.push({ row: rowNum, email, reason: "This user is not a student" }); continue; }
      if (user.student.section_id !== form.section_id) { results.failed.push({ row: rowNum, email, reason: "This student is not a this section" }); continue; }

      const student_id = user.student.id;
      const existing = await prisma.feedbackResponse.findUnique({ where: { form_id_student_id: { form_id, student_id } } });
      if (existing) { results.failed.push({ row: rowNum, email, reason: "Already submitted" }); continue; }
      let submittedAt = new Date();
      if (row.submitted_at?.toString().trim()) { const parsed = new Date(row.submitted_at.toString().trim()); if (!isNaN(parsed.getTime())) submittedAt = parsed; else { results.failed.push({ row: rowNum, email, reason: `Invalid submitted_at: "${row.submitted_at}"` }); continue; } }
      const answers = [];
      for (const [header, question] of Object.entries(questionMap)) {
        const rawValue = row[header]?.toString().trim();
        if (!rawValue) { if (question.is_required) throw new Error(`Q${question.order} is required but empty`); continue; }
        if (question.type === "TEXT") answers.push({ question_id: question.id, answer_text: rawValue });
        else if (question.type === "RATING") { const rating = parseInt(rawValue); if (isNaN(rating) || rating < 1 || rating > 5) throw new Error(`Q${question.order}: Rating must be 1-5`); answers.push({ question_id: question.id, rating }); }
        else if (question.type === "MCQ") { if (!question.options?.includes(rawValue)) throw new Error(`Q${question.order}: "${rawValue}" not valid. Options: ${question.options?.join(", ")}`); answers.push({ question_id: question.id, selected: rawValue }); }
      }
      await prisma.feedbackResponse.create({ data: { form_id, student_id, submittedAt, answers: { create: answers } } });
      results.success.push({ row: rowNum, email, name: user.student.name });
    } catch (err) { results.failed.push({ row: rowNum, email, reason: err.message }); }
  }
  return results;
};

// ── ADDITIONS — functions required by feedback.routes.js ─────────────────────

// Get single category by id
export const getCategoryById = async (id) =>
  prisma.feedbackCategory.findUnique({
    where: { id },
    include: { _count: { select: { questions: true, forms: true } } },
  });

// Get all questions — filterable by category_id query param
export const getAllQuestions = async ({ category_id, page = 1, limit = 100 } = {}) => {
  const _page = parseInt(page) || 1;
  const _limit = parseInt(limit) || 100;
  const where = category_id ? { category_id } : {};
  const [questions, total] = await Promise.all([
    prisma.feedbackQuestion.findMany({
      where,
      orderBy: [{ category_id: "asc" }, { order: "asc" }],
      skip: (_page - 1) * _limit,
      take: _limit,
      include: { category: { select: { id: true, name: true, type: true } } },
    }),
    prisma.feedbackQuestion.count({ where }),
  ]);
  return { questions, pagination: { total, page: _page, limit: _limit, pages: Math.ceil(total / _limit) } };
};

// Get single question by id
export const getQuestionById = async (id) =>
  prisma.feedbackQuestion.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true, type: true } } },
  });

// Toggle form active/inactive
export const toggleFormActive = async (id) => {
  const form = await prisma.feedbackForm.findUnique({ where: { id }, select: { is_active: true } });
  if (!form) { const e = new Error("Form not found"); e.statusCode = 404; throw e; }
  return prisma.feedbackForm.update({
    where: { id },
    data: { is_active: !form.is_active },
    include: { category: { select: { id: true, name: true } }, _count: { select: { responses: true } } },
  });
};

// Update action taken note on a form
export const updateActionTaken = async (id, action_taken) => {
  return prisma.feedbackForm.update({
    where: { id },
    data: { action_taken: action_taken || null },
  });
};

// Delete all responses for a form
export const deleteFormResponses = async (form_id) => {
  const result = await prisma.feedbackResponse.deleteMany({ where: { form_id } });
  return { deleted: result.count };
};

// Get questions for a specific form (via category, minus excluded)
export const getFormQuestions = async (form_id) => {
  const form = await prisma.feedbackForm.findUnique({
    where: { id: form_id },
    select: {
      id: true, title: true, category_id: true,
      category: { include: { questions: { orderBy: { order: "asc" } } } },
    },
  });
  if (!form) { const e = new Error("Form not found"); e.statusCode = 404; throw e; }
  return { form_id: form.id, title: form.title, questions: form.category.questions };
};

// Bulk upload questions from xlsx

export const bulkUploadQuestions = async (buffer) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Data"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const results = { created: [], failed: [] };

  for (const row of rows) {
    const category_id = String(row["Category ID*"] || row.category_id || "").trim();
    const question = String(row["Question*"] || row.question || "").trim();
    const type = String(row["Type*"] || row.type || "RATING").trim().toUpperCase();
    const is_required = String(row["Required"] || "true").toLowerCase() !== "false";
    const order = parseInt(row["Order"] || 0) || 0;
    const options_raw = String(row["Options (MCQ, comma-separated)"] || row.options || "").trim();
    const options = type === "MCQ" ? options_raw.split(",").map((o) => o.trim()).filter(Boolean) : [];

    if (!category_id) { results.failed.push({ row: question, reason: "Category ID required" }); continue; }
    if (!question) { results.failed.push({ row: question, reason: "Question text required" }); continue; }
    if (!["RATING", "TEXT", "MCQ"].includes(type)) { results.failed.push({ row: question, reason: `Invalid type: ${type}` }); continue; }

    try {
      const q = await prisma.feedbackQuestion.create({
        data: { category_id, question, type, options, is_required, order },
      });
      results.created.push({ id: q.id, question: q.question });
    } catch (e) { results.failed.push({ row: question, reason: e.message }); }
  }
  return results;
};

// Generate question bulk upload template
export const generateQuestionTemplate = async () => {
  const categories = await prisma.feedbackCategory.findMany({
    select: { id: true, name: true, type: true },
    orderBy: { name: "asc" },
  });

  const headers = [
    "Category ID*", "Category Name (ref)", "Question*",
    "Type* (RATING/TEXT/MCQ)", "Required (true/false)", "Order",
    "Options (MCQ, comma-separated)",
  ];

  const sampleRows = categories.slice(0, 3).map((c, i) => [
    c.id, c.name,
    i === 0 ? "How would you rate the teaching quality?" :
      i === 1 ? "Any suggestions for improvement?" :
        "How was your overall experience?",
    i === 0 ? "RATING" : i === 1 ? "TEXT" : "MCQ",
    "true", i + 1,
    i === 2 ? "Excellent,Good,Average,Poor" : "",
  ]);

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 20) }));
  xlsx.utils.book_append_sheet(wb, ws, "Data");

  // Categories reference sheet
  const refSheet = xlsx.utils.aoa_to_sheet([
    ["Category ID", "Name", "Type"],
    ...categories.map((c) => [c.id, c.name, c.type]),
  ]);
  refSheet["!cols"] = [{ wch: 40 }, { wch: 30 }, { wch: 16 }];
  xlsx.utils.book_append_sheet(wb, refSheet, "Categories");

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};