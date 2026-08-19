import { useState } from "react";

type Props = {
  photoUrl: string;
  onUploaded: (url: string) => void;
};

const PhotoUpload = ({ photoUrl, onUploaded }: Props) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await fetch("http://localhost:3333/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      onUploaded(data.url);
    } catch (err) {
      console.error("Erro ao enviar foto", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt="Foto"
          className="h-24 w-24 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-lightPrimary text-xs text-gray-400 dark:bg-navy-900">
          Sem foto
        </div>
      )}
      <label className="cursor-pointer rounded-lg bg-brand-500 px-3 py-1 text-sm text-white hover:bg-brand-600">
        {uploading ? "Enviando..." : "Escolher foto"}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
    </div>
  );
};

export default PhotoUpload;
