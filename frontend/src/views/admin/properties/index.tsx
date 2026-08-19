import { useEffect, useState } from "react";
import PhotoUpload from "components/photoUpload/PhotoUpload";

const API_URL = "http://localhost:3333/properties";

const Properties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [address, setAddress] = useState("");
  const [type, setType] = useState("");
  const [rentValue, setRentValue] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [status, setStatus] = useState("disponivel");
  const [photoUrl, setPhotoUrl] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  const token = localStorage.getItem("token");

  const buscarImoveis = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setProperties(data);
    } catch (err) {
      setErro("Não foi possível carregar os imóveis");
    }
  };

  useEffect(() => {
    buscarImoveis();
  }, []);

  const limparFormulario = () => {
    setAddress("");
    setType("");
    setRentValue("");
    setBedrooms("");
    setBathrooms("");
    setStatus("disponivel");
    setPhotoUrl("");
    setEditingId(null);
  };

  const handleSalvar = async () => {
    setErro("");
    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address,
          type,
          rentValue: Number(rentValue),
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          status,
          photoUrl,
        }),
      });

      if (!response.ok) {
        setErro("Erro ao salvar imóvel");
        return;
      }

      limparFormulario();
      buscarImoveis();
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    }
  };

  const handleEditar = (property: any) => {
    setEditingId(property.id);
    setAddress(property.address);
    setType(property.type);
    setRentValue(String(property.rentValue));
    setBedrooms(String(property.bedrooms));
    setBathrooms(String(property.bathrooms));
    setStatus(property.status);
    setPhotoUrl(property.photoUrl || "");
  };

  const handleExcluir = async (id: number) => {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      buscarImoveis();
    } catch (err) {
      setErro("Não foi possível excluir o imóvel");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
        Imóveis
      </h1>

      {/* Formulário de cadastro/edição */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          {editingId ? "Editar imóvel" : "Cadastrar novo imóvel"}
        </h2>

        <div className="mb-4">
          <PhotoUpload
            photoUrl={photoUrl}
            onUploaded={(url) => setPhotoUrl(url)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Endereço"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Tipo (Casa, Apartamento...)"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
          <input
            type="number"
            placeholder="Valor do aluguel"
            value={rentValue}
            onChange={(e) => setRentValue(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
          <input
            type="number"
            placeholder="Quartos"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
          <input
            type="number"
            placeholder="Banheiros"
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
          {editingId && (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
            >
              <option value="disponivel">Disponível</option>
              <option value="alugado">Alugado</option>
            </select>
          )}
        </div>

        {erro && <p className="mt-3 text-sm text-red-500">{erro}</p>}

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSalvar}
            className="rounded-xl bg-brand-500 px-5 py-2 font-medium text-white hover:bg-brand-600"
          >
            {editingId ? "Salvar alterações" : "Cadastrar"}
          </button>

          {editingId && (
            <button
              onClick={limparFormulario}
              className="rounded-xl border px-5 py-2 font-medium text-navy-700 dark:text-white"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Lista de imóveis */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Imóveis cadastrados
        </h2>

        {properties.length === 0 && (
          <p className="text-gray-600 dark:text-gray-300">
            Nenhum imóvel cadastrado ainda.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {properties.map((property) => (
            <div
              key={property.id}
              className="flex items-center justify-between rounded-lg border p-3 dark:border-white/10"
            >
              <div className="flex items-center gap-3">
                {property.photoUrl && (
                  <img
                    src={property.photoUrl}
                    alt={property.address}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-navy-700 dark:text-white">
                    {property.address} — {property.type}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    R$ {Number(property.rentValue).toFixed(2)} •{" "}
                    {property.bedrooms} quartos • {property.bathrooms} banheiros
                    • {property.status}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditar(property)}
                  className="rounded-lg bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleExcluir(property.id)}
                  className="rounded-lg bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Properties;
