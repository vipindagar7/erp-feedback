import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSidebar } from "../../hooks/sidebarContext.jsx";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "../../lib/utils.js";

function Logo({ collapsed }) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border transition-all duration-300",
    )}>
      {collapsed &&
        <div>
          <img
            src="/favicon.ico"
            alt="ERP Logo"
          />
        </div>}
      {!collapsed && (
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Light Theme Logo */}
          <img
            src="/Black-Logo.webp"
            alt="ERP Logo"
            className=" w-60 block dark:hidden object-contain"
          />

          {/* Dark Theme Logo */}
          <img
            src="/White-Logo.webp"
            alt="ERP Logo"
            className="w-60 hidden dark:block object-contain"
          />
        </div>
      )}
    </div>
  );
}

function NavGroup({ label, collapsed }) {
  if (collapsed) {
    return (
      <div className="mx-3 my-1.5">
        <div className="h-px bg-sidebar-border" />
      </div>
    );
  }
  return (
    <p className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-muted select-none whitespace-nowrap overflow-hidden">
      {label}
    </p>
  );
}

function NavItem({ item, collapsed }) {
  const location = useLocation();
  const isActive = item.end
    ? location.pathname === item.path
    : location.pathname.startsWith(item.path);

  const Icon = item.icon;

  const inner = (
    <NavLink
      to={item.path}
      end={item.end}
      className={cn(
        "group relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover",
        isActive && "bg-sidebar-active text-sidebar-active-fg font-semibold",
        collapsed && "justify-center px-2"
      )}
    >
      {/* Active indicator bar */}
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-violet-500" />
      )}

      <Icon
        size={18}
        className={cn(
          "shrink-0 transition-colors",
          isActive
            ? "text-violet-500 dark:text-violet-400"
            : "text-sidebar-icon group-hover:text-sidebar-foreground"
        )}
      />

      {!collapsed && (
        <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
      )}

      {/* Active dot for collapsed */}
      {isActive && collapsed && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{inner}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return inner;
}

export default function Sidebar({ navItems }) {
  const { collapsed, toggle } = useSidebar();
  const { user } = useSelector((s) => s.auth);

  // Filter nav items based on permissions
  const filtered = navItems.filter((item) => {
    if (item.group) return true;
    if (!item.permission) return true;
    if (!user) return false;
    if (user.role === "SUPER_ADMIN") return true;
    return user.permissions?.includes(item.permission);
  });

  // Remove orphan group headers (group with no visible items after it)
  const visible = filtered.filter((item, idx) => {
    if (!item.group) return true;
    const next = filtered[idx + 1];
    return next && !next.group;
  });

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full shrink-0 transition-all duration-200",
        "bg-sidebar border-r border-sidebar-border",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      <Logo collapsed={collapsed} />

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5 scrollbar-thin">
        {visible.map((item) =>
          item.group ? (
            <NavGroup key={item.key} label={item.group} collapsed={collapsed} />
          ) : (
            <NavItem key={item.key} item={item} collapsed={collapsed} />
          )
        )}
      </nav>

      {/* Collapse toggle */}
      <div className={cn(
        "p-3 border-t border-sidebar-border",
        collapsed ? "flex justify-center" : "flex justify-end"
      )}>
        <button
          onClick={toggle}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover"
        >
          {collapsed
            ? <PanelLeftOpen size={16} />
            : <PanelLeftClose size={16} />
          }
        </button>
      </div>
    </aside>
  );
}