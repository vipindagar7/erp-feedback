// frontend/src/components/auth/RoleGuard.jsx
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

// ── Role → home route mapping ──────────────────────────────────
export const getRoleHome = (role) => {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN": return "/admin";
    case "FACULTY": return "/faculty";
    case "STUDENT": return "/student";
    default: return "/login";
  }
};

// ── Init spinner shown while fetchMe is in-flight ──────────────
function InitSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700
          flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
          <span className="text-white font-extrabold text-lg">E</span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * PublicRoute — /login, /forgot-password, /reset-password.
 * No InitSpinner — never block unauthenticated users from seeing login.
 * If already logged in, redirect to role home.
 */
export function PublicRoute({ children }) {
  const { user } = useSelector((s) => s.auth);
  if (user) return <Navigate to={getRoleHome(user.role)} replace />;
  return children;
}

/**
 * RoleGuard — for /admin, /faculty, /student.
 * Shows InitSpinner until fetchMe resolves to prevent flash-to-login on refresh.
 * Once initialized:
 *  - no user      → /login (saves location for post-login redirect)
 *  - wrong role   → correct dashboard via getRoleHome()
 *  - correct role → renders children
 */
export function RoleGuard({ roles = [], children }) {
  const { user, initialized } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!initialized) return <InitSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }
  return children;
}

/**
 * ProtectedRoute — any authenticated user regardless of role.
 * Use for shared pages like /settings.
 */
export function ProtectedRoute({ children }) {
  const { user, initialized } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!initialized) return <InitSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default RoleGuard;