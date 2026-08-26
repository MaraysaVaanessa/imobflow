import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3333";

const OwnerDashboard = () => {
  const [owner, setOwner] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<{
    taxaPercentual: number;
    repasses: any[];
  }>({
    taxaPercentual: 10,
    repasses: [],
  });
  const [inspections, setInspections] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("ownerToken");
  const headers = { Authorization: `Bearer ${token}` };

  const buscarTudo = async () => {
    setCarregando(true);
    try {
      const [meRes, contractsRes, payoutsRes, inspectionsRes] =
        await Promise.all([
          fetch(`${API_URL}/owner-portal/me`, { headers }),
          fetch(`${API_URL}/owner-portal/contracts`, { headers }),
          fetch(`${API_URL}/owner-portal/payouts`, { headers }),
          fetch(`${API_URL}/owner-portal/inspections`, { headers }),
        ]);

      if (!meRes.ok) {
        navigate("/portal-proprietario/login");
        return;
      }

      setOwner(await meRes.json());
      setContracts(await contractsRes.json());
      setPayouts(await payoutsRes.json());
      setInspections(await inspectionsRes.json());
    } catch (err) {
      console.error("Erro ao carregar dados do portal", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarTudo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("ownerToken");
    localStorage.removeItem("owner");
    navigate("/portal-proprietario/login");
  };

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lightPrimary p-6 dark:bg-navy-900">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
              Olá, {owner?.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Portal do Proprietário
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Sair
          </button>
        </div>

        {/* Meus imóveis / contratos */}
        <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
          <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
            Meus Contratos
          </h2>
          {contracts.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">
              Nenhum contrato vinculado ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {contracts.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border p-3 dark:border-white/10"
                >
                  <p className="font-medium text-navy-700 dark:text-white">
                    {c.property?.address}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Inquilino: {c.tenant?.name} • Aluguel: R${" "}
                    {Number(c.rentValue).toFixed(2)} • {c.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Repasses */}
        <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
          <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
            Repasses{" "}
            <span className="text-sm font-normal text-gray-500">
              (taxa de administração: {payouts.taxaPercentual}%)
            </span>
          </h2>
          {payouts.repasses.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">
              Nenhum repasse registrado ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {payouts.repasses.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border p-3 dark:border-white/10"
                >
                  <div>
                    <p className="font-medium text-navy-700 dark:text-white">
                      {r.propertyAddress}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {r.paidAt
                        ? new Date(r.paidAt).toLocaleDateString("pt-BR")
                        : ""}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    R$ {Number(r.valorRepasse).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vistorias */}
        <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
          <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
            Vistorias
          </h2>
          {inspections.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">
              Nenhuma vistoria registrada ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {inspections.map((i) => (
                <div
                  key={i.id}
                  className="rounded-lg border p-3 dark:border-white/10"
                >
                  <p className="font-medium text-navy-700 dark:text-white">
                    {i.property?.address} —{" "}
                    {i.type === "entrada" ? "Entrada" : "Saída"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(i.date).toLocaleDateString("pt-BR")} •{" "}
                    {i.items.length} cômodo(s)
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
