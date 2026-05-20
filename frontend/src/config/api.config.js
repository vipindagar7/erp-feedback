// ─────────────────────────────────────────────────────────────
//  API Configuration — single source of truth for every endpoint
//  Usage:
//    import { API_BASE, EP } from "@/lib/api.config.js";
//    axiosInstance.post(EP.auth.login, payload)
//    axiosInstance.get(EP.students.list, { params })
// ─────────────────────────────────────────────────────────────

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
export const url = (path) => `${API_BASE}${path}`;

export const EP = {

  // ── Auth ──────────────────────────────────────────────────
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
    refresh: "/auth/refresh",
    changePassword: "/auth/change-password",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },

  // ── Students ──────────────────────────────────────────────
  students: {
    me: "/students/me",
    list: "/students",
    byId: (id) => `/students/${id}`,
    create: "/students",
    update: (id) => `/students/${id}`,
    delete: (id) => `/students/${id}`,
    // Individual actions
    block: (id) => `/students/${id}/block`,
    status: (id) => `/students/${id}/status`,
    promote: (id) => `/students/${id}/promote`,
    demote: (id) => `/students/${id}/demote`,
    changeSection: (id) => `/students/${id}/change-section`,
    // Bulk actions
    bulkDelete: "/students/bulk-delete",
    bulkPromote: "/students/bulk-promote",
    bulkChangeSection: "/students/bulk-change-section",
    bulkBlock: "/students/bulk-block",
    bulkStatus: "/students/bulk-status",
    // Upload / template
    bulkUpload: "/students/bulk-upload",
    template: "/students/template",
    myEnrollments: "/students/enrollments/my-enrollments",
  },

  // ── Enrollments (nested under /admin/enrollments) ──────
  enrollments: {
    list: "/admin/enrollments",
    byId: (id) => `/admin/enrollments/${id}`,
    create: "/admin/enrollments",
    update: (id) => `/admin/enrollments/${id}`,
    delete: (id) => `/admin/enrollments/${id}`,
    setCurrent: (id) => `/admin/enrollments/${id}/set-current`,
    byStudent: (sid) => `/admin/enrollments/by-student?student_id=${sid}`,
    myEnrollments: "/admin/enrollments/by-student",
    template: "/admin/enrollments/template",
    export: "/admin/enrollments/export",
    bulkUpload: "/admin/enrollments/bulk-upload",
    bulkStatus: "/admin/enrollments/bulk-status",
    bulkDelete: "/admin/enrollments/bulk-delete",
  },

  // ── Faculty ───────────────────────────────────────────────
  faculty: {
    me: "/faculty/me",
    list: "/faculty",
    byId: (id) => `/faculty/${id}`,
    create: "/faculty",
    update: (id) => `/faculty/${id}`,
    delete: (id) => `/faculty/${id}`,
    block: (id) => `/faculty/${id}/block`,
    assignSubjects: (id) => `/faculty/${id}/subjects`,
    bulkUpload: "/faculty/bulk-upload",
    template: "/faculty/template",
  },

  // ── Admins ────────────────────────────────────────────────
  admins: {
    list: "/admins",
    byId: (id) => `/admins/${id}`,
    create: "/admins",
    update: (id) => `/admins/${id}`,
    delete: (id) => `/admins/${id}`,
    block: (id) => `/admins/${id}/block`,
  },

  // ── Departments ───────────────────────────────────────────
  departments: {
    list: "/departments",
    byId: (id) => `/departments/${id}`,
    create: "/departments",
    update: (id) => `/departments/${id}`,
    delete: (id) => `/departments/${id}`,
    template: "/departments/template",
    bulkUpload: "/departments/bulk-upload",
  },

  // ── Programs ──────────────────────────────────────────────
  programs: {
    list: "/programs",
    byId: (id) => `/programs/${id}`,
    create: "/programs",
    update: (id) => `/programs/${id}`,
    delete: (id) => `/programs/${id}`,
    template: "/programs/template",
    bulkUpload: "/programs/bulk-upload",
  },

  // ── Courses ───────────────────────────────────────────────
  courses: {
    list: "/courses",
    byId: (id) => `/courses/${id}`,
    create: "/courses",
    update: (id) => `/courses/${id}`,
    delete: (id) => `/courses/${id}`,
    template: "/courses/template",
    bulkUpload: "/courses/bulk-upload",
  },

  // ── Subjects ──────────────────────────────────────────────
  subjects: {
    list: "/subjects",
    byId: (id) => `/subjects/${id}`,
    create: "/subjects",
    update: (id) => `/subjects/${id}`,
    delete: (id) => `/subjects/${id}`,
    template: "/subjects/template",
    bulkUpload: "/subjects/bulk-upload",
  },

  // ── Sections ──────────────────────────────────────────────
  sections: {
    list: "/sections",
    byId: (id) => `/sections/${id}`,
    create: "/sections",
    update: (id) => `/sections/${id}`,
    delete: (id) => `/sections/${id}`,
    template: "/sections/template",
    subjectTemplate: "/sections/subject-template",
    bulkUpload: "/sections/bulk-upload",
    bulkAssignSubjects: "/sections/bulk-assign-subjects",
    assignSubject: (id) => `/sections/${id}/subjects`,
    updateSubject: (id, subId) => `/sections/${id}/subjects/${subId}`,
    removeSubject: (id, subId) => `/sections/${id}/subjects/${subId}`,
  },

  // ── Feedback ──────────────────────────────────────────────
  // ── Feedback ──────────────────────────────────────────────
  feedback: {
    // Categories
    categories: "/feedback/categories",
    categoryById: (id) => `/feedback/categories/${id}`,
    categoryTemplate: "/feedback/categories/template",
    categoryBulkUpload: "/feedback/categories/bulk-upload",
    // Questions
    questions: "/feedback/questions",
    questionById: (id) => `/feedback/questions/${id}`,
    questionTemplate: "/feedback/questions/template",
    questionBulkUpload: "/feedback/questions/bulk-upload",
    // Forms
    forms: "/feedback/forms",
    formById: (id) => `/feedback/forms/${id}`,
    formAction: (id) => `/feedback/forms/${id}/action`,
    toggleActive: (id) => `/feedback/forms/${id}/toggle`,
    deleteResponses: (id) => `/feedback/forms/${id}/responses`,
    // Student
    myForms: "/feedback/my-forms",
    submit: (formId) => `/feedback/forms/${formId}/submit`,
    // Admin
    results: (formId) => `/feedback/forms/${formId}/results`,
    export: (formId) => `/feedback/forms/${formId}/export`,
    bulkSubmit: (formId) => `/feedback/forms/${formId}/bulk-submit`,
    bulkTemplate: (formId) => `/feedback/forms/${formId}/bulk-template`,
    formQuestions: (formId) => `/feedback/forms/${formId}/questions`,
  },


  // ── Special Groups ────────────────────────────────────────
  groups: {
    // Student groups
    list: "/groups",
    byId: (id) => `/groups/${id}`,
    create: "/groups",
    update: (id) => `/groups/${id}`,
    delete: (id) => `/groups/${id}`,
    addById: (id) => `/groups/${id}/members/by-id`,
    addByEmail: (id) => `/groups/${id}/members/by-email`,
    addBySection: (id) => `/groups/${id}/members/by-section`,
    removeMembers: (id) => `/groups/${id}/members`,
    removeMember: (id, sid) => `/groups/${id}/members/${sid}`,
    // Faculty groups
    facultyList: "/groups/faculty-groups",
    facultyById: (id) => `/groups/faculty-groups/${id}`,
    facultyCreate: "/groups/faculty-groups",
    facultyUpdate: (id) => `/groups/faculty-groups/${id}`,
    facultyDelete: (id) => `/groups/faculty-groups/${id}`,
    facultyAddById: (id) => `/groups/faculty-groups/${id}/members/by-id`,
    facultyAddByEmail: (id) => `/groups/faculty-groups/${id}/members/by-email`,
    facultyRemove: (id) => `/groups/faculty-groups/${id}/members`,
    facultyRemoveOne: (id, fid) => `/groups/faculty-groups/${id}/members/${fid}`,
  },

  // ── Admin Dashboard ───────────────────────────────────────
  admin: {
    stats: "/admin/dashboard/stats",
    activity: "/admin/dashboard/activity",
  },

  // ── Reports ───────────────────────────────────────────────
  reports: {
    studentsBySection: "/admin/reports/students",
    faculty: "/admin/reports/faculty",
    enrollments: "/admin/reports/enrollments",
  },

  // ── Settings ──────────────────────────────────────────────
  settings: {
    profile: "/settings/profile",
    updateStudent: "/settings/profile/student",
    updateFaculty: "/settings/profile/faculty",
  },

  // ── Notifications ─────────────────────────────────────────
  notifications: {
    list: "/notifications",
    unreadCount: "/notifications/unread-count",
    markRead: (id) => `/notifications/${id}/read`,
    markAllRead: "/notifications/read-all",
    delete: (id) => `/notifications/${id}`,
  },

  // ── Bulk (legacy) ─────────────────────────────────────────
  bulk: {
    students: "/bulk/students",
    faculty: "/bulk/faculty",
    template: (type) => `/bulk/template/${type}`,
  },
};