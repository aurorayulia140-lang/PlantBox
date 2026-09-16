import { useEffect, useState, useCallback } from "react";
import { supabase, Plant } from "../lib/supabase";
import PlantCard from "./PlantCard";

type DbError = { message: string; code?: string; details?: string; hint?: string };

type Props = {
  onGoAdd: () => void;
  refreshSignal: number;
};

export default function CatalogView({ onGoAdd, refreshSignal }: Props) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DbError | null>(null);

  const fetchPlants = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("tanaman")
      .select("*")
      .order("created_at", { ascending: false });

    if (err) {
      setError({ message: err.message, code: err.code, details: err.details, hint: err.hint });
    } else {
      setPlants(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants, refreshSignal]);

  const handleDelete = async (id: number) => {
    const plant = plants.find((p) => p.id === id);
    if (!plant) return;

    // Delete photo from storage
    await supabase.storage.from("plant-images").remove([plant.foto_path]);
    // Delete row from DB
    await supabase.from("tanaman").delete().eq("id", id);
    setPlants((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--primary)" }}>
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20"
          style={{ background: "#fff" }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: "var(--accent)" }}
        />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3 opacity-70" style={{ color: "#fff" }}>
              Koleksi Tanaman Rumahan
            </p>
            <h1
              className="text-4xl sm:text-5xl leading-tight mb-4"
              style={{ fontFamily: "var(--font-serif)", color: "#fff" }}
            >
              Selamat datang di<br /><em>PlantBox</em>
            </h1>
            <p className="text-base sm:text-lg max-w-md leading-relaxed opacity-85" style={{ color: "#fff" }}>
              Katalog tanaman hias dan toga. Tambahkan, jelajahi, dan rawat bersama.
            </p>
          </div>
          <div className="flex gap-4 items-center shrink-0">
            <div
              className="text-center px-5 py-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "#fff" }}>
                {loading ? "—" : plants.length}
              </div>
              <div className="text-xs opacity-75 mt-0.5" style={{ color: "#fff" }}>Tanaman</div>
            </div>
            <button
              onClick={onGoAdd}
              className="px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              + Tambah Tanaman
            </button>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {loading ? (
          <LoadingGrid />
        ) : error ? (
          <ErrorState error={error} onRetry={fetchPlants} />
        ) : plants.length === 0 ? (
          <EmptyState onGoAdd={onGoAdd} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2
                className="text-2xl sm:text-3xl"
                style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}
              >
                Semua Tanaman
              </h2>
              <span
                className="text-sm px-3 py-1 rounded-full font-medium"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
              >
                {plants.length} tanaman
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {plants.map((plant) => (
                <PlantCard key={plant.id} plant={plant} onDelete={handleDelete} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden animate-pulse"
          style={{ background: "var(--muted)", height: 280 }}
        />
      ))}
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: DbError; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-base font-semibold mb-2" style={{ color: "var(--foreground)" }}>
        Gagal memuat data dari Supabase
      </h3>
      <div
        className="mb-6 w-full max-w-lg text-left rounded-xl p-4 text-xs font-mono space-y-1"
        style={{ background: "#1e2118", color: "#e8e3d8" }}
      >
        {error.code && (
          <p><span style={{ color: "#f87171" }}>code:</span> {error.code}</p>
        )}
        <p><span style={{ color: "#f87171" }}>message:</span> {error.message}</p>
        {error.details && (
          <p><span style={{ color: "#fbbf24" }}>details:</span> {error.details}</p>
        )}
        {error.hint && (
          <p><span style={{ color: "#86efac" }}>hint:</span> {error.hint}</p>
        )}
      </div>
      <button
        onClick={onRetry}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold"
        style={{ background: "var(--primary)", color: "#fff" }}
      >
        Coba Lagi
      </button>
    </div>
  );
}

function EmptyState({ onGoAdd }: { onGoAdd: () => void }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <div
        className="w-28 h-28 rounded-3xl flex items-center justify-center text-5xl mb-6"
        style={{ background: "var(--muted)" }}
      >
        🪴
      </div>
      <h3
        className="text-2xl mb-2"
        style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}
      >
        Belum ada tanaman
      </h3>
      <p className="text-sm max-w-xs leading-relaxed mb-8" style={{ color: "var(--muted-foreground)" }}>
        Katalog masih kosong. Mulai tambahkan tanaman pertamamu!
      </p>
      <button
        onClick={onGoAdd}
        className="px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
        style={{ background: "var(--primary)", color: "#fff" }}
      >
        + Tambah Tanaman Pertama
      </button>
    </div>
  );
}
