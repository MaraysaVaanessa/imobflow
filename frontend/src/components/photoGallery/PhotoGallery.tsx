import { useEffect, useState } from "react";
import PhotoUpload from "components/photoUpload/PhotoUpload";

const API_URL = "http://localhost:3333";

type Props = {
  propertyId: number;
};

const PhotoGallery = ({ propertyId }: Props) => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [novaFoto, setNovaFoto] = useState("");
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const buscarFotos = async () => {
    try {
      const response = await fetch(
        `${API_URL}/properties/${propertyId}/photos`,
        { headers }
      );
      const data = await response.json();
      setPhotos(data);
    } catch (err) {
      console.error("Erro ao buscar fotos", err);
    }
  };

  useEffect(() => {
    buscarFotos();
  }, [propertyId]);

  const handleAdicionar = async (url: string) => {
    setNovaFoto("");
    try {
      await fetch(`${API_URL}/properties/${propertyId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ url }),
      });
      buscarFotos();
    } catch (err) {
      console.error("Erro ao adicionar foto", err);
    }
  };

  const handleRemover = async (photoId: number) => {
    try {
      await fetch(`${API_URL}/properties/photos/${photoId}`, {
        method: "DELETE",
        headers,
      });
      buscarFotos();
    } catch (err) {
      console.error("Erro ao remover foto", err);
    }
  };

  return (
    <div className="mt-3">
      <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
        Galeria de fotos ({photos.length})
      </p>
      <div className="flex flex-wrap gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="relative">
            <img
              src={photo.url}
              alt="Foto do imóvel"
              className="h-20 w-20 rounded-lg object-cover"
            />
            <button
              onClick={() => handleRemover(photo.id)}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ))}
        <PhotoUpload
          photoUrl={novaFoto}
          onUploaded={(url) => handleAdicionar(url)}
        />
      </div>
    </div>
  );
};

export default PhotoGallery;
