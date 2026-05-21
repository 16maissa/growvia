"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PdfUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select a PDF file.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();

    // ✅ compat n8n + API classique
    formData.append("data", file);
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(`Upload successful: ${data.file}`);
        setFile(null);

        // ✅ spécifique Next.js App Router
        router.refresh();
      } else {
        setMessage(data.error || data.message || "Upload failed.");
      }
    } catch (error) {
      setMessage("Unexpected error while uploading.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-card rounded-lg shadow-lg">
      <h1 className="text-2xl font-semibold mb-4">
        PDF Upload (RAG Ingestion)
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={loading}
          className="border border-border rounded p-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition"
        >
          {loading ? "Uploading..." : "Upload PDF"}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}