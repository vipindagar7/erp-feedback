import xlsx from "xlsx";
import prisma from "../../utils/prisma.js";


/** Build a workbook with a data sheet + an optional reference sheet */
const buildWorkbook = (dataHeaders, sampleRow, refSheet = null) => {
  const wb = xlsx.utils.book_new();

  // Main data sheet
  const ws = xlsx.utils.aoa_to_sheet([dataHeaders, sampleRow]);
  ws["!cols"] = dataHeaders.map((h) => ({ wch: Math.max(h.length + 4, 18) }));
  xlsx.utils.book_append_sheet(wb, ws, "Data");

  // Reference sheet (IDs for lookup)
  if (refSheet) {
    const { name, headers, rows } = refSheet;
    const refWs = xlsx.utils.aoa_to_sheet([headers, ...rows]);
    refWs["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 20) }));
    xlsx.utils.book_append_sheet(wb, refWs, name);
  }

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

export const departmentTemplate = () =>
  buildWorkbook(["Name*"], ["Computer Science"]);

export const programTemplate = async () => {
  const depts = await prisma.department.findMany({ orderBy: { name: "asc" } });
  return buildWorkbook(
    ["Name*", "Department ID*"],
    ["B. Tech.", depts[0]?.id || "<dept-id>"],
    {
      name:    "Departments (Reference)",
      headers: ["Department ID", "Department Name"],
      rows:    depts.map((d) => [d.id, d.name]),
    }
  );
};

export const courseTemplate = async () => {
  const programs = await prisma.program.findMany({
    orderBy: { name: "asc" },
    include: { department: true },
  });
  return buildWorkbook(
    ["Name*", "Program ID*"],
    ["CSE AIML", programs[0]?.id || "<program-id>"],
    {
      name:    "Programs (Reference)",
      headers: ["Program ID", "Program Name", "Department"],
      rows:    programs.map((p) => [p.id, p.name, p.department?.name || ""]),
    }
  );
};

export const subjectTemplate = () =>
  buildWorkbook(
    ["Name*", "Code*", "Nickname", "Category", "Credits"],
    ["Data Structures", "CS301", "DS", "THEORY", "4"]
  );

export const sectionTemplate = async () => {
  const [courses, faculty] = await Promise.all([
    prisma.course.findMany({
      orderBy: { name: "asc" },
      include: { program: { include: { department: true } } },
    }),
    prisma.faculty.findMany({ orderBy: { name: "asc" } }),
  ]);

  const wb = xlsx.utils.book_new();

  // Main sheet
  const headers = ["Name*", "Course ID*", "Semester* (1-8)", "Batch*", "Room No", "Class Coordinator ID"];
  const sample  = ["A", courses[0]?.id || "<course-id>", "1", "2024-2028", "101", faculty[0]?.id || ""];
  const ws = xlsx.utils.aoa_to_sheet([headers, sample]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 20) }));
  xlsx.utils.book_append_sheet(wb, ws, "Data");

  // Courses reference
  const cWs = xlsx.utils.aoa_to_sheet([
    ["Course ID", "Course Name", "Program", "Department"],
    ...courses.map((c) => [c.id, c.name, c.program?.name || "", c.program?.department?.name || ""]),
  ]);
  cWs["!cols"] = [{ wch: 38 }, { wch: 24 }, { wch: 20 }, { wch: 20 }];
  xlsx.utils.book_append_sheet(wb, cWs, "Courses (Reference)");

  // Faculty reference
  const fWs = xlsx.utils.aoa_to_sheet([
    ["Faculty ID", "Name", "Emp ID"],
    ...faculty.map((f) => [f.id, f.name, f.emp_id || ""]),
  ]);
  fWs["!cols"] = [{ wch: 38 }, { wch: 24 }, { wch: 14 }];
  xlsx.utils.book_append_sheet(wb, fWs, "Faculty (Reference)");

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

export const sectionSubjectTemplate = async () => {
  const [sections, subjects, faculty] = await Promise.all([
    prisma.section.findMany({
      orderBy: { name: "asc" },
      include: { course: true },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.faculty.findMany({ orderBy: { name: "asc" } }),
  ]);

  const wb = xlsx.utils.book_new();

  const headers = ["Section ID*", "Subject ID*", "Faculty ID", "Type", "Status"];
  const sample  = [sections[0]?.id || "<section-id>", subjects[0]?.id || "<subject-id>", faculty[0]?.id || "", "REGULAR", "ACTIVE"];
  const ws = xlsx.utils.aoa_to_sheet([headers, sample]);
  ws["!cols"] = headers.map(() => ({ wch: 38 }));
  xlsx.utils.book_append_sheet(wb, ws, "Data");

  const sWs = xlsx.utils.aoa_to_sheet([
    ["Section ID", "Section Name", "Course", "Semester"],
    ...sections.map((s) => [s.id, s.name, s.course?.name || "", s.semester]),
  ]);
  xlsx.utils.book_append_sheet(wb, sWs, "Sections (Reference)");

  const subWs = xlsx.utils.aoa_to_sheet([
    ["Subject ID", "Name", "Code", "Category"],
    ...subjects.map((s) => [s.id, s.name, s.code, s.category]),
  ]);
  xlsx.utils.book_append_sheet(wb, subWs, "Subjects (Reference)");

  const fWs = xlsx.utils.aoa_to_sheet([
    ["Faculty ID", "Name", "Emp ID"],
    ...faculty.map((f) => [f.id, f.name, f.emp_id || ""]),
  ]);
  xlsx.utils.book_append_sheet(wb, fWs, "Faculty (Reference)");

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};
