import { useEffect, useState } from "react";

const API_URL = "http://localhost:3333";

const Maintenances = () => {
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);

  const [propertyId, setPropertyId] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [erro, setErro] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const buscarTudo = async () => {
    try {
      const [maintenancesRes, propertiesRes] = await Promise.all([
        fetch(`${API_URL}/maintenances`, { headers }),
        fetch(`${API_URL}/properties`, { headers }),
      ]);

      setMaintenances(await maintenancesRes.json());
      setProperties(await propertiesRes.json());
    } catch (err) {
      setErro("Não foi possível carregar os dados");
    }
  };

  useEffect(() => {
    buscarTudo();
  }, []);

  const handleCadastrar = async () => {
    setErro("");
    try {
      const response = await fetch(`${API_URL}/maintenances`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          propertyId: Number(propertyId),
          description,
          estimatedCost: Number(estimatedCost),
        }),
      });

      if (!response.ok) {
        setErro("Erro ao registrar manutenção");
        return;
      }

      setPropertyId("");
      setDescription("");
      setEstimatedCost("");
      buscarTudo();
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    }
  };

  const handleConcluir = async (id: number) => {
    try {
      await fetch(`${API_URL}/maintenances/${id}/concluir`, {
        method: "PUT",
        headers,
      });
      buscarTudo();
    } catch (err) {
      setErro("Não foi possível concluir a manutenção");
    }
  };

  const handleExcluir = async (id: number) => {
    try {
      await fetch(`${API_URL}/maintenances/${id}`, {
        method: "DELETE",
        headers,
      });
      buscarTudo();
    } catch (err) {
      setErro("Não foi possível excluir a manutenção");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
        Manutenções
      </h1>

      {/* Formulário de cadastro */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Registrar nova manutenção
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          >
            <option value="">Selecione o imóvel</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Descrição do problema"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />

          <input
            type="number"
            placeholder="Custo estimado"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
        </div>

        {erro && <p className="mt-3 text-sm text-red-500">{erro}</p>}

        <button
          onClick={handleCadastrar}
          className="mt-4 rounded-xl bg-brand-500 px-5 py-2 font-medium text-white hover:bg-brand-600"
        >
          Registrar
        </button>
      </div>

      {/* Lista de manutenções */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Manutenções registradas
        </h2>

        {maintenances.length === 0 && (
          <p className="text-gray-600 dark:text-gray-300">
            Nenhuma manutenção registrada ainda.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {maintenances.map((maintenance) => (
            <div
              key={maintenance.id}
              className="flex items-center justify-between rounded-lg border p-3 dark:border-white/10"
            >
              <div>
                <p className="font-medium text-navy-700 dark:text-white">
                  {maintenance.property?.address}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {maintenance.description} • Custo estimado: R${" "}
                  {Number(maintenance.estimatedCost).toFixed(2)} •{" "}
                  <span
                    className={
                      maintenance.status === "concluida"
                        ? "font-medium text-green-600"
                        : "font-medium text-orange-500"
                    }
                  >
                    {maintenance.status}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                {maintenance.status === "pendente" && (
                  <button
                    onClick={() => handleConcluir(maintenance.id)}
                    className="rounded-lg bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
                  >
                    Concluir
                  </button>
                )}
                <button
                  onClick={() => handleExcluir(maintenance.id)}
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

export default Maintenances;
