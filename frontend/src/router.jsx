// frontend/src/router.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RoleGuard, PublicRoute, ProtectedRoute, getRoleHome } from "./components/auth/RoleGuard.jsx";
import { useSelector } from "react-redux";

// ── Layouts ────────────────────────────────────────────────────
import AdminLayout from "./layout/adminLayout.jsx";
import FacultyLayout from "./layout/facultyLayout.jsx";
import StudentLayout from "./layout/studentLayout.jsx";

// ── Auth ───────────────────────────────────────────────────────
import LoginPage from "./pages/auth/Login.jsx";

// ── Admin pages ────────────────────────────────────────────────
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import StudentsPage from "./pages/admin/StudentsPage.jsx";
import FacultyPage from "./pages/admin/FacultyPage.jsx";
import DepartmentsPage from "./pages/admin/DepartmentsPage.jsx";
import ProgramsPage from "./pages/admin/ProgramsPage.jsx";
import CoursesPage from "./pages/admin/CoursesPage.jsx";
import SubjectsPage from "./pages/admin/SubjectsPage.jsx";
import SectionsPage from "./pages/admin/SectionsPage.jsx";
import FeedbackCategoriesPage from "./pages/admin/FeedbackCategoriesPage.jsx";
import FeedbackQuestionsPage from "./pages/admin/FeedbackQuestionsPage.jsx";
import FeedbackFormsPage from "./pages/admin/FeedbackFormsPage.jsx";
import FeedbackResultsPage from "./pages/admin/FeedbackResultsPage.jsx";
import FeedbackTeachingReportPage from "./pages/admin/FeedbackTeachingReportPage.jsx";
import SettingsPage from "./pages/admin/SettingsPage.jsx";
import AdminsPage from "./pages/admin/AdminsPage.jsx";
import StudentEnrollmentPage from "./pages/student/StudentEnrollmentPage.jsx";
import SpecialGroupsPage from "./pages/admin/SpecialGroupsPage.jsx";
// ── Faculty pages ──────────────────────────────────────────────
import FacultyDashboard from "./pages/faculty/FacultyDashboard.jsx";
import FacultyFeedbackPage from "./pages/faculty/FacultyFeedbackPage.jsx";

// ── Student pages ──────────────────────────────────────────────
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import StudentFeedbackPage from "./pages/student/StudentFeedbackPage.jsx";
import EnrollmentPage from "./pages/admin/EnrollmentPage.jsx";
import CurriculumPage from "./pages/admin/Curriculumpage.jsx";

// ── Root redirect — sends user to their role home ──────────────
function RootRedirect() {
    const { user, initialized } = useSelector((s) => s.auth ?? {});
    if (!initialized) return null; // wait for fetchMe
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to={getRoleHome(user.role)} replace />;
}

export const router = createBrowserRouter([

    // ── Root ──────────────────────────────────────────────────────
    {
        path: "/",
        element: <RootRedirect />,
    },

    // ── Public (unauthenticated only) ─────────────────────────────
    {
        path: "/login",
        element: (
            <PublicRoute>
                <LoginPage />
            </PublicRoute>
        ),
    },

    // ── Admin & Super Admin ───────────────────────────────────────
    {
        path: "/admin",
        element: (
            <RoleGuard roles={["ADMIN", "SUPER_ADMIN"]}>
                <AdminLayout />
            </RoleGuard>
        ),
        children: [
            { index: true, element: <AdminDashboard /> },

            // ── Students ──────────────────────────────────────────────
            { path: "students", element: <StudentsPage /> },

            // ── Faculty ───────────────────────────────────────────────
            { path: "faculty", element: <FacultyPage /> },

            // ── Academic structure ────────────────────────────────────
            { path: "departments", element: <DepartmentsPage /> },
            { path: "programs", element: <ProgramsPage /> },
            { path: "courses", element: <CoursesPage /> },
            { path: "subjects", element: <SubjectsPage /> },
            { path: "sections", element: <SectionsPage /> },
            { path: "enrollments", element: <EnrollmentPage /> },

            // ── Feedback ──────────────────────────────────────────────
            { path: "feedback/categories", element: <FeedbackCategoriesPage /> },
            { path: "feedback/questions", element: <FeedbackQuestionsPage /> },
            { path: "feedback/forms", element: <FeedbackFormsPage /> },
            { path: "feedback/results/:form_id", element: <FeedbackResultsPage /> },
            // Results needs :form_id param — FeedbackResultsPage uses useParams()
            { path: "feedback/results", element: <FeedbackResultsPage /> },
            { path: "feedback/teaching", element: <FeedbackTeachingReportPage /> },
            { path: "curriculum", element: <CurriculumPage /> },
            { path: "admins", element: <AdminsPage /> },
            { path: "groups", element: <SpecialGroupsPage /> },

            // ── Reports ───────────────────────────────────────────────
            // { path: "reports", element: <ReportsPage /> },

            // ── Settings (any authenticated user) ────────────────────
            // {
            //     path: "settings",
            //     element: (
            //         <ProtectedRoute>
            //             <SettingsPage />
            //         </ProtectedRoute>
            //     ),
            // },
        ],
    },

    // ── Faculty ───────────────────────────────────────────────────
    {
        path: "/faculty",
        element: (
            <RoleGuard roles={["FACULTY"]}>
                <FacultyLayout />
            </RoleGuard>
        ),
        children: [
            { index: true, element: <FacultyDashboard /> },
            { path: "feedback", element: <FacultyFeedbackPage /> },
            {
                path: "settings",
                element: (
                    <ProtectedRoute>
                        <SettingsPage />
                    </ProtectedRoute>
                ),
            },
        ],
    },

    // ── Student ───────────────────────────────────────────────────
    {
        path: "/student",
        element: (
            <RoleGuard roles={["STUDENT"]}>
                <StudentLayout />
            </RoleGuard>
        ),
        children: [
            { index: true, element: <StudentDashboard /> },
            { path: "feedback", element: <StudentFeedbackPage /> },
            { path: "enrollment", element: <StudentEnrollmentPage /> },
            {
                path: "settings",
                element: (
                    <ProtectedRoute>
                        <SettingsPage />
                    </ProtectedRoute>
                ),
            },
        ],
    },

    // ── 404 ───────────────────────────────────────────────────────
    {
        path: "*",
        element: <Navigate to="/" replace />,
    },
]);