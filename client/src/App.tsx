import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NavBar from './components/layout/NavBar';
import Dashboard from './pages/Dashboard';
import HabitDetailPage from './pages/HabitDetailPage';
import LoginPage from './pages/LoginPage';
import Progress from './pages/Progress';
import RegisterPage from './pages/RegisterPage';
import Settings from './pages/Settings';
import { applyTheme, useTheme } from './store/useTheme';

function AppLayout() {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  const theme = useTheme((s) => s.theme);

  // Keep the <html data-theme> in sync (the inline script handles first paint).
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/habits/:id" element={<HabitDetailPage />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
