import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

type Step = "idle" | "uploading" | "saving" | "done";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export default function AddPlantView({ onSuccess, onCancel }: Props) {
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  const saving = step === "uploading" || step === "saving";

  /* ── file picker / drag-drop ── */
  const applyFile = (f: File) => {
    setError(null);
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Format tidak valid. Gunakan JPG, PNG, atau WEBP.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Ukuran file maksimal 2 MB.");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  /* ── submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // --- validasi ---
    if (!nama.trim()) { setError("Nama tanaman wajib diisi."); return; }
    if (!deskripsi.trim()) { setError("Deskripsi wajib diisi."); return; }
    if (!file) { setError("Foto tanaman wajib diunggah."); return; }

    setError(null);

    try {
      // --- 1. upload foto ---
      setStep("uploading");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

      console.log("[PlantBox] uploading", fileName, "to plant-images…");

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("plant-images")
        .upload(fileName, file, { contentType: file.type, upsert: false });

      if (uploadErr) {
        console.error("[PlantBox] upload error", uploadErr);
        throw new Error(
          `[Storage ${uploadErr.name}] ${uploadErr.message}` +
          (uploadErr.message.toLowerCase().includes("policy")
            ? " — Tambahkan Storage Policy INSERT untuk role anon di bucket plant-images."
            : uploadErr.message.toLowerCase().includes("bucket")
            ? " — Pastikan bucket 'plant-images' sudah dibuat dan bersifat public."
            : "")
        );
      }

      const fotoPath = uploadData.path;
      console.log("[PlantBox] upload ok, path =", fotoPath);

      // --- 2. insert ke tabel tanaman ---
      setStep("saving");

      const { error: dbErr } = await supabase
        .from("tanaman")
        .insert({ nama: nama.trim(), deskripsi: deskripsi.trim(), foto_path: fotoPath });

      if (dbErr) {
        console.error("[PlantBox] insert error", dbErr);
        // rollback foto
        await supabase.storage.from("plant-images").remove([fotoPath]);
        throw new Error(
          `[DB ${dbErr.code}] ${dbErr.message}` +
          (dbErr.code === "42501"
            ? " — RLS policy INSERT belum aktif untuk tabel tanaman."
            : dbErr.code === "42P01"
            ? " — Tabel 'tanaman' tidak ditemukan di schema public."
            : dbErr.hint ? ` Hint: ${dbErr.hint}` : "")
        );
      }

      // --- 3. selesai ---
      console.log("[PlantBox] insert ok ✓");
      setStep("done");
      setTimeout(() => {
        onSuccess();
      }, 1600);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[PlantBox] submit failed:", msg);
      setError(msg);
      setStep("idle");
    }
  };

  /* ── success screen ── */
  if (step === "done") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 text-center px-5">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6"
          style={{ background: "#dcfce7" }}
        >
          ✅
        </div>
        <h2
          className="text-2xl mb-2"
          style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}
        >
          Tanaman berhasil ditambahkan!
        </h2>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Kembali ke katalog…
        </p>
      </div>
    );
  }

  /* ── form ── */
  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-5 sm:px-8 py-10 sm:py-14">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
        <button
          type="button"
          onClick={onCancel}
          className="hover:underline"
          style={{ color: "var(--primary)" }}
        >
          Katalog
        </button>
        <span>/</span>
        <span>Tambah Tanaman</span>
      </div>

      <h1
        className="text-3xl sm:text-4xl mb-2"
        style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}
      >
        Tambah Tanaman Baru
      </h1>
      <p className="text-sm mb-10" style={{ color: "var(--muted-foreground)" }}>
        Isi data tanaman lalu unggah foto agar tersimpan di Supabase.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

        {/* Error banner */}
        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}
          >
            <p className="font-semibold mb-1">Gagal menyimpan tanaman</p>
            <p className="font-mono text-xs break-all">{error}</p>
          </div>
        )}

        {/* Loading steps */}
        {saving && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: "var(--muted)", color: "var(--foreground)" }}
          >
            <Spinner />
            <span>
              {step === "uploading" ? "Mengunggah foto ke Supabase Storage…" : "Menyimpan data ke database…"}
            </span>
          </div>
        )}

        {/* Nama */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            Nama Tanaman <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Monstera Deliciosa"
            disabled={saving}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
            style={{
              background: "var(--card)",
              border: "1.5px solid var(--border)",
              color: "var(--foreground)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Deskripsi */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            Deskripsi <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Ceritakan keunikan, cara perawatan, atau manfaat tanaman ini."
            rows={4}
            disabled={saving}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none disabled:opacity-50"
            style={{
              background: "var(--card)",
              border: "1.5px solid var(--border)",
              color: "var(--foreground)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Foto */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Foto Tanaman <span style={{ color: "#ef4444" }}>*</span>
            </span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              JPG, PNG, WEBP — maks. 2 MB
            </span>
          </div>

          {/* Drop zone — using <div> not <label> to avoid nested-label issues */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Pilih foto tanaman"
            onClick={() => !saving && fileRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && !saving && fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--primary)"; }}
            onDragLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = "var(--border)";
              const f = e.dataTransfer.files?.[0];
              if (f && !saving) applyFile(f);
            }}
            className="relative flex flex-col items-center justify-center rounded-2xl overflow-hidden transition-all"
            style={{
              border: "2px dashed var(--border)",
              background: preview ? "transparent" : "var(--muted)",
              minHeight: preview ? 260 : 180,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {preview ? (
              <>
                <img
                  src={preview}
                  alt="Preview foto"
                  className="w-full object-cover"
                  style={{ maxHeight: 260 }}
                />
                {!saving && (
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(30,33,24,0.55)" }}
                  >
                    <span className="text-sm font-medium text-white">Ganti Foto</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 px-6 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: "var(--secondary)" }}
                >
                  📷
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    Klik atau seret foto ke sini
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                    JPG, PNG, WEBP — maks. 2 MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) applyFile(f);
              // reset value so same file can be re-selected
              e.target.value = "";
            }}
          />

          {file && !saving && (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              ✓ {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
            style={{
              background: "var(--muted)",
              color: "var(--muted-foreground)",
              border: "1px solid var(--border)",
            }}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "var(--primary)", color: "#fff" }}
          >
            {saving && <Spinner light />}
            {step === "uploading"
              ? "Mengunggah foto…"
              : step === "saving"
              ? "Menyimpan data…"
              : "Simpan Tanaman"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Spinner({ light }: { light?: boolean }) {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: light ? "#fff" : "var(--primary)" }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
