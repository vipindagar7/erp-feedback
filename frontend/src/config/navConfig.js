// Each nav item:
// { key, label, path, icon, end?, permission?, group? }
// permission: if set, user.permissions must include this string (admin only)
// group: optional section header label

import {
    LayoutDashboard, Users, GraduationCap, Building2, BookOpen,
    Library, Layers, UsersRound, MessageSquareText, HelpCircle,
    ClipboardList, BarChart3, ShieldCheck, Home,
    BookMarked, ClipboardCheck, UserCircle, FileText, Settings,
} from "lucide-react";

export const ADMIN_NAV = [
    { key: "dashboard", label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },

    { key: "g1", group: "People" },
    { key: "students", label: "Students", path: "/admin/students", icon: GraduationCap, permission: "manage_students" },
    { key: "faculty", label: "Faculty", path: "/admin/faculty", icon: UsersRound, permission: "manage_faculty" },
    { key: "enrollments", label: "Enrollments", path: "/admin/enrollments", icon: ClipboardCheck, permission: "manage_students" },
    { key: "groups", label: "Groups", path: "/admin/groups", icon: Users, permission: "manage_students" },
    { key: "admins", label: "Admins", path: "/admin/admins", icon: ShieldCheck, permission: "manage_admins" },

    { key: "g2", group: "Academics" },
    { key: "departments", label: "Departments", path: "/admin/departments", icon: Building2, permission: "manage_departments" },
    { key: "programs", label: "Programs", path: "/admin/programs", icon: BookMarked, permission: "manage_departments" },
    { key: "courses", label: "Courses", path: "/admin/courses", icon: BookOpen, permission: "manage_departments" },
    { key: "sections", label: "Sections", path: "/admin/sections", icon: Layers, permission: "manage_sections" },
    { key: "subjects", label: "Subjects", path: "/admin/subjects", icon: Library, permission: "manage_subjects" },
    { path: "/admin/curriculum", label: "Curriculum", icon: "📚", permission: "manage_subjects" },
    
    { key: "g3", group: "Feedback" },
    { key: "fb-cats", label: "Categories", path: "/admin/feedback/categories", icon: MessageSquareText, permission: "manage_feedback" },
    { key: "fb-qs", label: "Questions", path: "/admin/feedback/questions", icon: HelpCircle, permission: "manage_feedback" },
    { key: "fb-forms", label: "Forms", path: "/admin/feedback/forms", icon: ClipboardList, permission: "manage_feedback" },
    { key: "fb-results", label: "Results", path: "/admin/feedback/results", icon: BarChart3, permission: "manage_feedback" },
    { key: "fb-teaching", label: "Teaching Results", path: "/admin/feedback/teaching", icon: BarChart3, permission: "manage_feedback" },

    // { key: "g4", group: "System" },
    // { key: "reports", label: "Reports", path: "/admin/reports", icon: FileText },
    // { key: "settings", label: "Settings", path: "/admin/settings", icon: Settings },
];

export const FACULTY_NAV = [
    { key: "dashboard", label: "Dashboard", path: "/faculty", icon: Home, end: true },
    { key: "g1", group: "Feedback" },
    { key: "fb-results", label: "My Feedback", path: "/faculty/feedback", icon: BarChart3 },
    // { key: "g2", group: "Account" },
    // { key: "settings", label: "Settings", path: "/faculty/settings", icon: Settings },
];

export const STUDENT_NAV = [
    { key: "dashboard", label: "Dashboard", path: "/student", icon: Home, end: true },
    { key: "g1", group: "Academic" },
    { key: "enrollment", label: "My Enrollment", path: "/student/enrollment", icon: ClipboardCheck },
    { key: "feedback", label: "Feedback", path: "/student/feedback", icon: MessageSquareText },
    // { key: "g2", group: "Account" },
    // { key: "settings", label: "Settings", path: "/student/settings", icon: Settings },
];