import { useState } from "react";
import Navbar from "./components/Navbar";
import CatalogView from "./components/CatalogView";
import AddPlantView from "./components/AddPlantView";

type View = "catalog" | "add";

export default function App() {
  const [view, setView] = useState<View>("catalog");
  const [refreshSignal, setRefreshSignal] = useState(0);

  const goAdd = () => setView("add");
  const goHome = () => setView("catalog");

  const handleAddSuccess = () => {
    setRefreshSignal((n) => n + 1);
    setView("catalog");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <Navbar onGoHome={goHome} onGoAdd={goAdd} view={view} />

      {view === "catalog" ? (
        <CatalogView onGoAdd={goAdd} refreshSignal={refreshSignal} />
      ) : (
        <AddPlantView onSuccess={handleAddSuccess} onCancel={goHome} />
      )}

      <footer
        className="mt-auto border-t py-6 text-center text-sm"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
      >
        © {new Date().getFullYear()} PlantBox — Katalog Tanaman Rumahan
      </footer>
    </div>
  );
}
