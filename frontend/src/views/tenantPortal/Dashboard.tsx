import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3333";

const TenantDashboard = () => {
  const [tenant, setTenant] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("tenantToken");
  const headers = { Authorization: `Bearer ${token}` };

  const buscarTudo = async () => {
    setCarregando(true);
    try {
      const [meRes, contractsRes, paymentsRes, maintenancesRes] =
        await Promise.all([
          fetch(`${API_URL}/tenant-portal/me`, { headers }),
          fetch(`${API_URL}/tenant-portal/contracts`, { headers }),
          fetch(`${API_URL}/tenant-portal/payments`, { headers }),
          fetch(`${API_URL}/tenant-portal/maintenances`, { headers }),
        ]);

      if (!meRes.ok) {
        navigate("/portal-inquilino/login");
        return;
      }

      setTenant(await meRes.json());
      setContracts(await contractsRes.json());
      setPayments(await paymentsRes.json());
      setMaintenances(await maintenancesRes.json());
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
    localStorage.removeItem("tenantToken");
    localStorage.removeItem("tenant");
    navigate("/portal-inquilino/login");
  };

  const handleBaixarPdf = async (paymentId: number) => {
    try {
      const response = await fetch(
        `${API_URL}/tenant-portal/payments/${paymentId}/pdf`,
        { headers }
      );

      if (!response.ok) {
        setErro("Não foi possível gerar o PDF");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `2via-pagamento-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    }
  };

  const handleAbrirChamado = async () => {
    setErro("");
    setSucesso("");

    if (!descricao.trim()) {
      setErro("Descreva o problema");
      return;
    }

    if (contracts.length === 0) {
      setErro("Nenhum imóvel vinculado ao seu contrato");
      return;
    }

    setEnviando(true);
    try {
      const response = await fetch(`${API_URL}/tenant-portal/maintenances`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          description: descricao,
          propertyId: contracts[0].propertyId,
        }),
      });

      if (!response.ok) {
        setErro("Não foi possível abrir o chamado");
        return;
      }

      setSucesso("Chamado de manutenção aberto com sucesso!");
      setDescricao("");
      buscarTudo();

      setTimeout(() => setSucesso(""), 4000);
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    } finally {
      setEnviando(false);
    }
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
              Olá, {tenant?.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Portal do Inquilino
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Sair
          </button>
        </div>

        {/* Meu contrato */}
        <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
          <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
            Meu Contrato
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
                    Proprietário: {c.owner?.name} • Aluguel: R${" "}
                    {Number(c.rentValue).toFixed(2)} • Vencimento dia {c.dueDay}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meus pagamentos / boletos */}
        <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
          <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
            Meus Pagamentos
          </h2>
          {payments.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">
              Nenhum pagamento registrado ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border p-3 dark:border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Vencimento: {p.dueDate.slice(0, 10)}
                    </p>
                    <span
                      className={
                        p.status === "pago"
                          ? "font-medium text-green-600"
                          : "font-medium text-orange-500"
                      }
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-navy-700 dark:text-white">
                      R$ {Number(p.value).toFixed(2)}
                    </p>
                    <button
                      onClick={() => handleBaixarPdf(p.id)}
                      className="rounded-lg bg-brand-500 px-3 py-1 text-xs text-white hover:bg-brand-600"
                    >
                      Baixar 2ª via (PDF)
                    </button>
                  </div>
                  {p.diasAtraso > 0 && (
                    <p className="text-sm font-medium text-red-500">
                      Atrasado há {p.diasAtraso} dia(s) • Valor atualizado: R${" "}
                      {Number(p.valorAtualizado).toFixed(2)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Abrir chamado de manutenção */}
        <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
          <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
            Abrir Chamado de Manutenção
          </h2>
          <textarea
            placeholder="Descreva o problema..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="w-full rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />

          {erro && <p className="mt-3 text-sm text-red-500">{erro}</p>}
          {sucesso && <p className="mt-3 text-sm text-green-600">{sucesso}</p>}

          <button
            onClick={handleAbrirChamado}
            disabled={enviando}
            className="mt-3 rounded-xl bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {enviando ? "Enviando..." : "Abrir chamado"}
          </button>

          {maintenances.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                Meus chamados
              </p>
              <div className="flex flex-col gap-2">
                {maintenances.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg border p-2 text-sm dark:border-white/10"
                  >
                    <p className="text-navy-700 dark:text-white">
                      {m.description}
                    </p>
                    <span
                      className={
                        m.status === "concluida"
                          ? "font-medium text-green-600"
                          : "font-medium text-orange-500"
                      }
                    >
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;
