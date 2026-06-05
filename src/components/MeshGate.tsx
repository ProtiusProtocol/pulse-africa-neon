import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

const MESH_KEY = "mesh-demo-2026";
const STORAGE_KEY = "mesh_access_granted";

export const MeshGate = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const key = params.get("key");

    // If correct key is in URL, grant access and store it
    if (key === MESH_KEY) {
      localStorage.setItem(STORAGE_KEY, "true");
      setGranted(true);
      setChecked(true);
      return;
    }

    // Otherwise check if already granted from a previous visit
    const stored = localStorage.getItem(STORAGE_KEY);
    setGranted(stored === "true");
    setChecked(true);
  }, [location.search]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Checking access…</p>
        </div>
      </div>
    );
  }

  if (!granted) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
