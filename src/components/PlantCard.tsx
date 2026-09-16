import { useState } from "react";
import { Plant, getPhotoUrl } from "../lib/supabase";

type Props = {
  plant: Plant;
  onDelete: (id: number) => void;
};

export default function PlantCard({ plant, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imgError, setImgError] = useState(false);

  const photoUrl = getPhotoUrl(plant.foto_path);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(plant.id);
    setDeleting(false);
  };

  return (
    <div
      className="group rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "0 2px 8px rgba(30,33,24,0.06)",
      }}
    >
      {/* Photo */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "4/3", background: "var(--muted)" }}
      >
        {!imgError ? (
          <img
            src={photoUrl}
            alt={plant.nama}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🪴
          </div>
        )}

        <button
          onClick={() => setConfirming(!confirming)}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all opacity-0 group-hover:opacity-100"
          style={{
            background: confirming ? "#ef4444" : "rgba(255,255,255,0.9)",
            color: confirming ? "#fff" : "#ef4444",
            backdropFilter: "blur(4px)",
          }}
          title="Hapus tanaman"
        >
          🗑
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <h3
          className="text-base font-semibold leading-snug mb-1.5"
          style={{ color: "var(--foreground)" }}
        >
          {plant.nama}
        </h3>
        <p
          className="text-sm leading-relaxed flex-1 line-clamp-3"
          style={{ color: "var(--muted-foreground)" }}
        >
          {plant.deskripsi}
        </p>

        {confirming && (
          <div
            className="mt-4 rounded-xl p-3 text-center"
            style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
          >
            <p className="text-xs font-medium mb-2.5" style={{ color: "#b91c1c" }}>
              Hapus tanaman ini dari katalog?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 text-xs py-1.5 rounded-lg font-medium"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 text-xs py-1.5 rounded-lg font-semibold disabled:opacity-60"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                {deleting ? "Menghapus…" : "Hapus"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
