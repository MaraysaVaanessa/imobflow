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
  const [delinquency, setDelinquency] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<{
    taxaPercentual: number;
    proprietarios: any[];
  }>({
    taxaPercentual: 10,
    proprietarios: [],
  });
  const [erro, setErro] = useState("");
  const [exportando, setExportando] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const buscarRelatorios = async () => {
    try {
      const [financialRes, statusRes, expiringRes, delinquencyRes, payoutsRes] =
        await Promise.all([
          fetch(`${API_URL}/reports/financial`, { headers }),
          fetch(`${API_URL}/reports/properties-status`, { headers }),
          fetch(`${API_URL}/reports/expiring-contracts`, { headers }),
          fetch(`${API_URL}/reports/delinquency`, { headers }),
          fetch(`${API_URL}/reports/owner-payouts`, { headers }),
        ]);

      setFinancial(await financialRes.json());
      setPropertiesStatus(await statusRes.json());
      setExpiringContracts(await expiringRes.json());
      setDelinquency(await delinquencyRes.json());
      setPayouts(await payoutsRes.json());
    } catch (err) {
      setErro("Não foi possível carregar os relatórios");
    }
  };

  useEffect(() => {
    buscarRelatorios();
  }, []);

  const handleExportar = async (formato: "pdf" | "excel") => {
    setExportando(true);
    try {
      const response = await fetch(
        `${API_URL}/reports/financial/export/${formato}`,
        { headers }
      );

      if (!response.ok) {
        setErro("Não foi possível gerar o arquivo");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        formato === "pdf"
          ? "relatorio-financeiro.pdf"
          : "relatorio-financeiro.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
          Relatórios
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleExportar("pdf")}
            disabled={exportando}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50"
          >
            {exportando ? "Gerando..." : "Exportar PDF"}
          </button>
          <button
            onClick={() => handleExportar("excel")}
            disabled={exportando}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            {exportando ? "Gerando..." : "Exportar Excel"}
          </button>
        </div>
      </div>

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

      {/* Repasse aos Proprietários */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Repasse aos Proprietários{" "}
          <span className="text-sm font-normal text-gray-500">
            (taxa de administração: {payouts.taxaPercentual}%)
          </span>
        </h2>

        {payouts.proprietarios.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">
            Nenhum repasse a calcular ainda (é necessário haver pagamentos
            marcados como pagos).
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {payouts.proprietarios.map((item) => (
              <div
                key={item.ownerId}
                className="rounded-lg border p-3 dark:border-white/10"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-navy-700 dark:text-white">
                    {item.ownerName}
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    R$ {Number(item.valorRepasse).toFixed(2)}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Recebido: R$ {Number(item.totalRecebido).toFixed(2)} • Taxa
                  administrativa: R$ {Number(item.taxaAdministracao).toFixed(2)}{" "}
                  • {item.quantidadePagamentos} pagamento(s)
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inadimplência por Inquilino */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Inadimplência por Inquilino
        </h2>

        {delinquency.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">
            Nenhum inquilino em atraso no momento.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {delinquency.map((item) => (
              <div
                key={item.tenantId}
                className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/30 dark:bg-red-900/10"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-navy-700 dark:text-white">
                    {item.tenantName}
                  </p>
                  <p className="font-bold text-red-600">
                    R$ {Number(item.totalAtrasado).toFixed(2)}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {item.quantidadePagamentos} pagamento(s) em atraso
                </p>
              </div>
            ))}
          </div>
        )}
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
