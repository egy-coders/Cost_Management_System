import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  Tags,
  Users,
  X
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { isCurrentRtl } from "../../i18n/format";
import type { Role } from "../../types";
import { Button } from "../ui/Button";
import { BrandLogo } from "../branding/BrandLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface NavItem {
  labelKey: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const items: NavItem[] = [
  { labelKey: "nav.dashboard", path: "/", icon: LayoutDashboard, roles: ["ADMIN", "SITE_ENGINEER", "PROJECT_MANAGER", "ACCOUNTANT", "MANAGEMENT_VIEWER"] },
  { labelKey: "nav.projects", path: "/projects", icon: FolderKanban, roles: ["ADMIN", "SITE_ENGINEER", "PROJECT_MANAGER", "ACCOUNTANT", "MANAGEMENT_VIEWER"] },
  { labelKey: "nav.expenses", path: "/expenses", icon: Receipt, roles: ["ADMIN", "SITE_ENGINEER", "PROJECT_MANAGER", "ACCOUNTANT"] },
  { labelKey: "nav.payments", path: "/payments", icon: CreditCard, roles: ["ADMIN", "ACCOUNTANT"] },
  { labelKey: "nav.cash_in", path: "/cash-in", icon: CircleDollarSign, roles: ["ADMIN", "ACCOUNTANT"] },
  { labelKey: "nav.vendors", path: "/vendors", icon: Building2, roles: ["ADMIN", "SITE_ENGINEER", "PROJECT_MANAGER", "ACCOUNTANT"] },
  { labelKey: "nav.categories", path: "/categories", icon: Tags, roles: ["ADMIN"] },
  { labelKey: "nav.reports", path: "/reports", icon: BarChart3, roles: ["ADMIN", "PROJECT_MANAGER", "ACCOUNTANT", "MANAGEMENT_VIEWER"] },
  { labelKey: "nav.users", path: "/users", icon: Users, roles: ["ADMIN"] },
  { labelKey: "nav.settings", path: "/settings", icon: Settings, roles: ["ADMIN", "SITE_ENGINEER", "PROJECT_MANAGER", "ACCOUNTANT", "MANAGEMENT_VIEWER"] }
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const isRtl = isCurrentRtl();
  const visibleItems = items.filter((item) => user && (user.role === "ADMIN" || item.roles.includes(user.role)));
  const CollapseIcon = collapsed ? (isRtl ? ChevronsLeft : ChevronsRight) : (isRtl ? ChevronsRight : ChevronsLeft);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className={clsx("min-h-screen bg-gray-100 lg:grid", collapsed ? "lg:grid-cols-[88px_1fr]" : "lg:grid-cols-[280px_1fr]")}>
      <aside
        className={clsx(
          "fixed inset-y-0 z-40 w-72 border-gray-200 bg-white transition lg:static lg:w-auto lg:translate-x-0",
          isRtl ? "right-0 translate-x-full border-l" : "left-0 -translate-x-full border-r",
          open && "translate-x-0"
        )}
      >
        <div className={clsx("flex h-16 items-center justify-between gap-2 border-b border-gray-200 px-4", collapsed && "lg:justify-center lg:px-3")}>
          <div className={clsx("min-w-0", collapsed && "lg:hidden")}>
            <BrandLogo imageClassName="h-10 w-10" />
          </div>
          <div className={clsx("hidden items-center gap-1", collapsed && "lg:flex")}>
            <BrandLogo compact imageClassName="h-11 w-11" />
            <button
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-site"
              onClick={() => setCollapsed(false)}
              aria-label={t("actions.open_menu")}
              title={t("actions.open_menu")}
            >
              <CollapseIcon size={16} />
            </button>
          </div>
          <div className={clsx("flex items-center gap-1", collapsed && "lg:hidden")}>
            <button
              className="hidden rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-site lg:inline-flex"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? t("actions.open_menu") : t("actions.close_menu")}
              title={collapsed ? t("actions.open_menu") : t("actions.close_menu")}
            >
              <CollapseIcon size={18} />
            </button>
            <button className="rounded-md p-2 hover:bg-gray-100 lg:hidden" onClick={() => setOpen(false)} aria-label={t("actions.close_menu")}>
              <X size={20} />
            </button>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition",
                    collapsed && "lg:justify-center lg:px-2",
                    isActive ? "bg-red-50 text-site" : "text-gray-700 hover:bg-gray-100"
                  )
                }
                title={collapsed ? t(item.labelKey) : undefined}
              >
                <Icon size={18} />
                <span className={clsx("truncate", collapsed && "lg:hidden")}>{t(item.labelKey)}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-md p-2 hover:bg-gray-100 lg:hidden" onClick={() => setOpen(true)} aria-label={t("actions.open_menu")}>
              <Menu size={20} />
            </button>
            <BrandLogo compact className="lg:hidden" imageClassName="h-8 w-8" />
            <div>
              <p className="text-sm font-semibold text-ink">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role ? t(`roles.${user.role}`) : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" onClick={handleLogout} className="px-3">
              <LogOut size={18} />
              <span className="hidden sm:inline">{t("actions.logout")}</span>
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
