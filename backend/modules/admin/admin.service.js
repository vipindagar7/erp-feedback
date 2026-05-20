import prisma from "../../utils/prisma.js";
import xlsx from "xlsx";

// ══════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ══════════════════════════════════════════════════════════════
export const getDashboardStats = async () => {
  const [
    totalStudents, totalFaculty, totalDepts, totalSections,
    totalSubjects, totalCourses, totalPrograms,
    activeEnrollments, detainedEnrollments, passedEnrollments,
    activeForms, totalResponses,
    blockedStudents, blockedFaculty,
    recentStudents, recentFaculty,
    genderStats, sectionStats,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.faculty.count(),
    prisma.department.count(),
    prisma.section.count(),
    prisma.subject.count(),
    prisma.course.count(),
    prisma.program.count(),
    prisma.studentEnrollment.count({ where: { is_current: true, status: "ACTIVE" } }),
    prisma.studentEnrollment.count({ where: { is_current: true, status: "DETAINED" } }),
    prisma.studentEnrollment.count({ where: { is_current: true, status: "PASSED" } }),
    prisma.feedbackForm.count({ where: { is_active: true, end_date: { gte: new Date() } } }),
    prisma.feedbackResponse.count(),
    prisma.user.count({ where: { isBlocked: true, role: "STUDENT" } }),
    prisma.user.count({ where: { isBlocked: true, role: "FACULTY" } }),
    // Recent 5 students
    prisma.student.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, createdAt: true,
        section: { select: { name: true, semester: true } },
        department: { select: { name: true } },
      },
    }),
    // Recent 5 faculty
    prisma.faculty.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, designation: true, createdAt: true,
        department: { select: { name: true } },
      },
    }),
    // Gender breakdown
    prisma.student.groupBy({ by: ["gender"], _count: true }),
    // Top 5 sections by student count
    prisma.section.findMany({
      take: 5,
      select: {
        id: true, name: true, semester: true, batch: true,
        course: { select: { name: true } },
        _count: { select: { students: true } },
      },
      orderBy: { students: { _count: "desc" } },
    }),
  ]);

  return {
    counts: {
      students: totalStudents,
      faculty: totalFaculty,
      departments: totalDepts,
      sections: totalSections,
      subjects: totalSubjects,
      courses: totalCourses,
      programs: totalPrograms,
    },
    enrollments: {
      active: activeEnrollments,
      detained: detainedEnrollments,
      passed: passedEnrollments,
      total: activeEnrollments + detainedEnrollments + passedEnrollments,
    },
    feedback: {
      active_forms: activeForms,
      total_responses: totalResponses,
    },
    blocked: {
      students: blockedStudents,
      faculty: blockedFaculty,
    },
    gender: genderStats.map((g) => ({
      gender: g.gender || "Not specified",
      count: g._count,
    })),
    top_sections: sectionStats.map((s) => ({
      id: s.id,
      name: s.name,
      course: s.course?.name,
      semester: s.semester,
      batch: s.batch,
      students: s._count.students,
    })),
    recent: {
      students: recentStudents,
      faculty: recentFaculty,
    },
  };
};

// ══════════════════════════════════════════════════════════════
// ACTIVITY FEED (last 20 items across all entities)
// ══════════════════════════════════════════════════════════════
export const getActivityFeed = async () => {
  const [students, faculty, responses, enrollments] = await Promise.all([
    prisma.student.findMany({
      take: 8, orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.faculty.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.feedbackResponse.findMany({
      take: 5, orderBy: { submittedAt: "desc" },
      select: {
        id: true, submittedAt: true,
        form: { select: { title: true } },
        student: { select: { name: true } },
      },
    }),
    prisma.studentEnrollment.findMany({
      take: 5, orderBy: { enrolled_at: "desc" },
      where: { status: { in: ["PROMOTED", "PASSED", "DETAINED"] } },
      select: {
        id: true, status: true, semester: true, enrolled_at: true,
        student: { select: { name: true } },
      },
    }),
  ]);

  const items = [
    ...students.map((s) => ({ type: "student_added", label: `${s.name} enrolled`, time: s.createdAt, id: s.id })),
    ...faculty.map((f) => ({ type: "faculty_added", label: `${f.name} joined faculty`, time: f.createdAt, id: f.id })),
    ...responses.map((r) => ({ type: "feedback_submit", label: `${r.student?.name} submitted "${r.form?.title}"`, time: r.submittedAt, id: r.id })),
    ...enrollments.map((e) => ({ type: `enrollment_${e.status.toLowerCase()}`, label: `${e.student?.name} ${e.status.toLowerCase()} to Sem ${e.semester}`, time: e.enrolled_at, id: e.id })),
  ];

  return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 20);
};

// ══════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════
export const exportStudentsBySection = async (section_id) => {
  const where = section_id ? { section_id } : {};
  const students = await prisma.student.findMany({
    where,
    include: {
      user: { select: { email: true } },
      department: { select: { name: true } },
      program: { select: { name: true } },
      course: { select: { name: true } },
      section: {
        select: {
          name: true, semester: true, batch: true,
          course: { select: { name: true, program: { select: { name: true } } } }
        },
      },
      enrollments: {
        where: { is_current: true },
        select: { status: true, semester: true, academic_year: true },
      },
    },
    orderBy: [{ section_id: "asc" }, { name: "asc" }],
  });

  const headers = [
    "Name", "Roll No", "Enrollment No", "Email", "Phone", "Gender", "DOB",
    "Department", "Program", "Course", "Section", "Semester", "Batch", "Academic Year",
    "Enrollment Status", "Father Name", "Mother Name", "City", "State",
  ];

  const rows = students.map((s) => {
    const enr = s.enrollments[0];
    return [
      s.name, s.roll_no || "", s.enrollment_no || "", s.user?.email || "",
      s.phone || "", s.gender || "", s.dob ? new Date(s.dob).toLocaleDateString() : "",
      s.department?.name || "", s.program?.name || "", s.course?.name || "",
      s.section?.name || "", enr?.semester || "", s.section?.batch || "",
      enr?.academic_year || "", enr?.status || "",
      s.father_name || "", s.mother_name || "", s.city || "", s.state || "",
    ];
  });

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
  xlsx.utils.book_append_sheet(wb, ws, "Students");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

export const exportStudentsByDept = async (dept_id) => {
  return exportStudentsBySection(null); // same logic, filtered by dept if passed
};

export const exportFacultyReport = async () => {
  const faculty = await prisma.faculty.findMany({
    include: {
      user: { select: { email: true, isBlocked: true } },
      department: { select: { name: true } },
      subjects: { include: { subject: { select: { name: true, code: true } } } },
      _count: { select: { sectionSubjects: true, coordinating_sections: true } },
    },
    orderBy: { name: "asc" },
  });

  const headers = [
    "Name", "Emp ID", "Email", "Phone", "Designation", "Department",
    "Gender", "Joining Date", "Employee Type", "Status", "Subjects", "Active Sections", "Account Status",
  ];

  const rows = faculty.map((f) => [
    f.name, f.emp_id || "", f.user?.email || "", f.phone || "",
    f.designation || "", f.department?.name || "",
    f.gender || "", f.joining_date ? new Date(f.joining_date).toLocaleDateString() : "",
    f.employee_type || "", f.status || "ACTIVE",
    f.subjects.map((s) => `${s.subject.name} (${s.subject.code})`).join(", "),
    f._count.sectionSubjects,
    f.user?.isBlocked ? "Blocked" : "Active",
  ]);

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 16) }));
  xlsx.utils.book_append_sheet(wb, ws, "Faculty");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

export const exportEnrollmentReport = async () => {
  const enrollments = await prisma.studentEnrollment.findMany({
    where: { is_current: true },
    include: {
      student: {
        select: {
          name: true, roll_no: true, enrollment_no: true,
          department: { select: { name: true } },
          course: { select: { name: true } },
          program: { select: { name: true } },
        },
      },
      section: { select: { name: true, batch: true } },
    },
    orderBy: [{ dept_id: "asc" }, { semester: "asc" }],
  });

  const headers = [
    "Student Name", "Roll No", "Enrollment No", "Department", "Program", "Course",
    "Section", "Semester", "Academic Year", "Batch", "Status", "Remarks",
  ];

  const rows = enrollments.map((e) => [
    e.student?.name || "", e.student?.roll_no || "", e.student?.enrollment_no || "",
    e.student?.department?.name || "", e.student?.program?.name || "", e.student?.course?.name || "",
    e.section?.name || "", e.semester, e.academic_year, e.section?.batch || "",
    e.status, e.remarks || "",
  ]);

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
  xlsx.utils.book_append_sheet(wb, ws, "Enrollments");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};
