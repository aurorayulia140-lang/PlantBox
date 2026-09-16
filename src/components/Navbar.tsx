type NavbarProps = {
  onGoHome: () => void;
  onGoAdd: () => void;
  view: "catalog" | "add";
};

export default function Navbar({ onGoHome, onGoAdd, view }: NavbarProps) {
  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(248,245,240,0.93)",
        backdropFilter: "blur(14px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <button onClick={onGoHome} className="flex items-center gap-2.5">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: "var(--primary)", color: "#fff" }}
          >
            🌿
          </span>
          <span
            className="text-xl tracking-tight"
            style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}
          >
            PlantBox
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onGoHome}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors hidden sm:block"
            style={{
              color: view === "catalog" ? "var(--primary)" : "var(--muted-foreground)",
              background: view === "catalog" ? "var(--muted)" : "transparent",
            }}
          >
            Katalog
          </button>
          <button
            onClick={onGoAdd}
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95"
            style={{ background: "var(--primary)", color: "#fff" }}
          >
            + Tambah
          </button>
        </div>
      </div>
    </nav>
  );
}
