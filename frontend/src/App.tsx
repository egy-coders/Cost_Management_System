import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { LoadingState } from "./components/ui/State";
import { useAuth } from "./hooks/useAuth";
import { CashInPage } from "./pages/CashInPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ExpenseDetailsPage } from "./pages/ExpenseDetailsPage";
import { ExpenseFormPage } from "./pages/ExpenseFormPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { LoginPage } from "./pages/LoginPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { ProjectDetailsPage } from "./pages/ProjectDetailsPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UsersPage } from "./pages/UsersPage";
import { VendorsPage } from "./pages/VendorsPage";
import type { Role } from "./types";

function Protected({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6"><LoadingState /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && user.role !== "ADMIN" && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Protected />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailsPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/expenses/new" element={<ExpenseFormPage />} />
        <Route path="/expenses/:id" element={<ExpenseDetailsPage />} />
        <Route path="/expenses/:id/edit" element={<ExpenseFormPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route element={<Protected roles={["ADMIN", "ACCOUNTANT"]} />}>
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/cash-in" element={<CashInPage />} />
      </Route>
      <Route element={<Protected roles={["ADMIN"]} />}>
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>
      <Route element={<Protected roles={["ADMIN", "PROJECT_MANAGER", "ACCOUNTANT", "MANAGEMENT_VIEWER"]} />}>
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}
