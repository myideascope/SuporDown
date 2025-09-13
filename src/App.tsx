import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/toaster";
import Home from "./components/home";
import LoginForm from "./components/auth/LoginForm";
import AdminPanel from "./components/admin/AdminPanel";
import { useAuth } from "./contexts/AuthContext";

// Import routes conditionally for Tempo
let routes: any = [];
if (import.meta.env.VITE_TEMPO === "true") {
  try {
    const tempoRoutes = await import("tempo-routes");
    routes = tempoRoutes.default;
  } catch (error) {
    console.warn("Tempo routes not available:", error);
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && routes && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;