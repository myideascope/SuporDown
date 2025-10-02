import { Suspense, useState, useEffect } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/toaster";
import Home from "./components/home";
import LoginForm from "./components/auth/LoginForm";
import AdminPanel from "./components/admin/AdminPanel";
import { useAuth } from "./contexts/AuthContext";

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
      <TempoRoutes />
    </Suspense>
  );
}

function TempoRoutes() {
  const [routes, setRoutes] = useState([]);
  const [routesLoaded, setRoutesLoaded] = useState(false);

  useEffect(() => {
    const loadRoutes = async () => {
      if (import.meta.env.VITE_TEMPO === "true") {
        try {
          // Use dynamic import with proper error handling
          const tempoRoutes = await import("tempo-routes").catch(() => ({ default: [] }));
          setRoutes(tempoRoutes.default || []);
        } catch (error) {
          console.warn("Failed to load tempo routes:", error);
          setRoutes([]);
        }
      } else {
        setRoutes([]);
      }
      setRoutesLoaded(true);
    };

    loadRoutes();
  }, []);

  const routeElements = useRoutes(routes);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
      {routesLoaded && routeElements}
    </>
  );
}

export default App;