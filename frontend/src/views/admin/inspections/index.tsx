import { useEffect, useState } from "react";
import PhotoUpload from "components/photoUpload/PhotoUpload";
import { isAdmin } from "utils/auth";

const API_URL = "http://localhost:3333";

type RoomItem = {
  roomName: string;
  observation: string;
  photoUrl: string;
};

const Inspections = () => {
  const [inspections, setInspections] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  const [propertyId, setPropertyId] = useState("");
  const [contractId, setContractId] = useState("");
  const [type, setType] = useState("entrada");
  const [items, setItems] = useState<RoomItem[]>([
    { roomName: "", observation: "", photoUrl: "" },
  ]);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const admin = isAdmin();

  const buscarTudo = async () => {
    setCarregando(true);
    try {
      const [inspectionsRes, propertiesRes, contractsRes] = await Promise.all([
        fetch(`${API_URL}/inspections`, { headers }),
        fetch(`${API_URL}/properties`, { headers }),
        fetch(`${API_URL}/contracts`, { headers }),
      ]);

      setInspections(await inspectionsRes.json());
      setProperties(await propertiesRes.json());
      setContracts(await contractsRes.json());
    } catch (err) {
      setErro("Não foi possível carregar os dados");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarTudo();
  }, []);

  // Filtra os contratos para mostrar só os do imóvel selecionado
  const contratosDoImovel = contracts.filter(
    (c) => String(c.propertyId) === propertyId
  );

  const adicionarComodo = () => {
    setItems([...items, { roomName: "", observation: "", photoUrl: "" }]);
  };

  const removerComodo = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const atualizarComodo = (
    index: number,
    campo: keyof RoomItem,
    valor: string
  ) => {
    const novosItems = [...items];
    novosItems[index] = { ...novosItems[index], [campo]: valor };
    setItems(novosItems);
  };

  const limparFormulario = () => {
    setPropertyId("");
    setContractId("");
    setType("entrada");
    setItems([{ roomName: "", observation: "", photoUrl: "" }]);
  };

  const handleSalvar = async () => {
    setErro("");
    setSucesso("");

    if (!propertyId) {
      setErro("Selecione o imóvel");
      return;
    }

    const itemsPreenchidos = items.filter(
      (item) => item.roomName.trim() !== ""
    );
    if (itemsPreenchidos.length === 0) {
      setErro("Adicione pelo menos um cômodo com nome");
      return;
    }

    setSalvando(true);
    try {
      const response = await fetch(`${API_URL}/inspections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          type,
          propertyId: Number(propertyId),
          contractId: contractId || null,
          items: itemsPreenchidos,
        }),
      });

      if (!response.ok) {
        setErro("Erro ao registrar vistoria");
        return;
      }

      setSucesso("Vistoria registrada com sucesso!");
      limparFormulario();
      buscarTudo();

      setTimeout(() => setSucesso(""), 4000);
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: number) => {
    try {
      await fetch(`${API_URL}/inspections/${id}`, {
        method: "DELETE",
        headers,
      });
      buscarTudo();
    } catch (err) {
      setErro("Não foi possível excluir a vistoria");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
        Vistorias
      </h1>

      {/* Formulário de cadastro */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Nova vistoria
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={propertyId}
            onChange={(e) => {
              setPropertyId(e.target.value);
              setContractId("");
            }}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          >
            <option value="">Selecione o imóvel</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}
              </option>
            ))}
          </select>

          <select
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            disabled={!propertyId}
            className="rounded-lg border p-2 disabled:opacity-50 dark:bg-navy-900 dark:text-white"
          >
            <option value="">Sem contrato vinculado</option>
            {contratosDoImovel.map((c) => (
              <option key={c.id} value={c.id}>
                Contrato #{c.id} — {c.tenant?.name}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border p-4 dark:border-white/10"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium text-navy-700 dark:text-white">
                  Cômodo {index + 1}
                </p>
                {items.length > 1 && (
                  <button
                    onClick={() => removerComodo(index)}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Remover
                  </button>
                )}
              </div>

              <div className="mb-3">
                <PhotoUpload
                  photoUrl={item.photoUrl}
                  onUploaded={(url) => atualizarComodo(index, "photoUrl", url)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Nome do cômodo (ex: Sala, Cozinha)"
                  value={item.roomName}
                  onChange={(e) =>
                    atualizarComodo(index, "roomName", e.target.value)
                  }
                  className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Observações"
                  value={item.observation}
                  onChange={(e) =>
                    atualizarComodo(index, "observation", e.target.value)
                  }
                  className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
                />
              </div>
            </div>
          ))}

          <button
            onClick={adicionarComodo}
            className="w-fit rounded-lg border border-dashed px-4 py-2 text-sm font-medium text-brand-500 hover:bg-lightPrimary dark:hover:bg-navy-900"
          >
            + Adicionar cômodo
          </button>
        </div>

        {erro && <p className="mt-3 text-sm text-red-500">{erro}</p>}
        {sucesso && <p className="mt-3 text-sm text-green-600">{sucesso}</p>}

        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="mt-4 rounded-xl bg-brand-500 px-5 py-2 font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Registrar vistoria"}
        </button>
      </div>

      {/* Lista de vistorias */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Vistorias registradas
        </h2>

        {carregando ? (
          <p className="text-gray-500 dark:text-gray-300">Carregando...</p>
        ) : inspections.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">
            Nenhuma vistoria registrada ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {inspections.map((inspection) => (
              <div
                key={inspection.id}
                className="rounded-lg border p-3 dark:border-white/10"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-navy-700 dark:text-white">
                    Vistoria #{inspection.id} — {inspection.property?.address} —{" "}
                    {inspection.type === "entrada" ? "Entrada" : "Saída"}
                  </p>
                  {admin && (
                    <button
                      onClick={() => handleExcluir(inspection.id)}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Excluir
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {new Date(inspection.date).toLocaleDateString("pt-BR")} •{" "}
                  {inspection.items.length} cômodo(s) registrado(s)
                </p>
                {inspection.contract && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Contrato #{inspection.contract.id} • Proprietário:{" "}
                    {inspection.contract.owner?.name} • Inquilino:{" "}
                    {inspection.contract.tenant?.name}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {inspection.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-lg bg-lightPrimary px-2 py-1 text-xs dark:bg-navy-900"
                    >
                      {item.photoUrl && (
                        <img
                          src={item.photoUrl}
                          alt={item.roomName}
                          className="h-6 w-6 rounded object-cover"
                        />
                      )}
                      <span className="text-navy-700 dark:text-white">
                        {item.roomName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inspections;
