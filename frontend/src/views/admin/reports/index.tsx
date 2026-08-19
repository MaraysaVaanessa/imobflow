import { useEffect, useState } from "react";

const API_URL = "http://localhost:3333";

const Reports = () => {
  const [financial, setFinancial] = useState({
    totalPago: 0,
    totalPendente: 0,
  });
  const [propertiesStatus, setPropertiesStatus] = useState({
    disponiveis: 0,
    alugados: 0,
  });
  const [expiringContracts, setExpiringContracts] = useState<any[]>([]);
  const [erro, setErro] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const buscarRelatorios = async () => {
    try {
      const [financialRes, statusRes, expiringRes] = await Promise.all([
        fetch(`${API_URL}/reports/financial`, { headers }),
        fetch(`${API_URL}/reports/properties-status`, { headers }),
        fetch(`${API_URL}/reports/expiring-contracts`, { headers }),
      ]);

      setFinancial(await financialRes.json());
      setPropertiesStatus(await statusRes.json());
      setExpiringContracts(await expiringRes.json());
    } catch (err) {
      setErro("Não foi possível carregar os relatórios");
    }
  };

  useEffect(() => {
    buscarRelatorios();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
        Relatórios
      </h1>

      {erro && <p className="mt-3 text-sm text-red-500">{erro}</p>}

      {/* Resumo Financeiro */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Resumo Financeiro
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Total Recebido
            </p>
            <p className="text-2xl font-bold text-green-600">
              R$ {Number(financial.totalPago).toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Total Pendente
            </p>
            <p className="text-2xl font-bold text-orange-500">
              R$ {Number(financial.totalPendente).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Imóveis por Status */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Imóveis por Status
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Disponíveis
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {propertiesStatus.disponiveis}
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
            <p className="text-sm text-gray-600 dark:text-gray-300">Alugados</p>
            <p className="text-2xl font-bold text-purple-600">
              {propertiesStatus.alugados}
            </p>
          </div>
        </div>
      </div>

      {/* Contratos Vencendo */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Contratos Vencendo (próximos 30 dias)
        </h2>

        {expiringContracts.length === 0 && (
          <p className="text-gray-600 dark:text-gray-300">
            Nenhum contrato vencendo nos próximos 30 dias.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {expiringContracts.map((contract) => (
            <div
              key={contract.id}
              className="rounded-lg border p-3 dark:border-white/10"
            >
              <p className="font-medium text-navy-700 dark:text-white">
                {contract.property?.address} — {contract.tenant?.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Vence em: {contract.endDate.slice(0, 10)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
