import { useEffect, useState } from "react";
import { isAdmin } from "utils/auth";
import { campoVazio } from "utils/validation";

const API_URL = "http://localhost:3333";

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [contracts, setContracts] = useState<any[]>([]);

  const [contractId, setContractId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [value, setValue] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const admin = isAdmin();

  const buscarPagamentos = async (pagina = 1) => {
    setCarregando(true);
    try {
      const response = await fetch(
        `${API_URL}/payments/paginated?pagina=${pagina}`,
        { headers }
      );
      const data = await response.json();
      setPayments(data.payments || []);
      setTotalPaginas(data.totalPaginas || 1);
      setPaginaAtual(data.paginaAtual || 1);
    } catch (err) {
      setErro("Não foi possível carregar os dados");
      setPayments([]);
    } finally {
      setCarregando(false);
    }
  };

  const buscarContratos = async () => {
    try {
      const response = await fetch(`${API_URL}/contracts`, { headers });
      setContracts(await response.json());
    } catch (err) {
      setErro("Não foi possível carregar os contratos");
    }
  };

  useEffect(() => {
    buscarPagamentos(1);
    buscarContratos();
  }, []);

  const validarFormulario = () => {
    if (campoVazio(contractId)) return "Selecione o contrato";
    if (campoVazio(dueDate)) return "Informe a data de vencimento";
    if (campoVazio(value) || Number(value) <= 0)
      return "Informe um valor válido";
    return "";
  };

  const handleCadastrar = async () => {
    setErro("");
    setSucesso("");

    const mensagemValidacao = validarFormulario();
    if (mensagemValidacao) {
      setErro(mensagemValidacao);
      return;
    }

    setSalvando(true);
    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          contractId: Number(contractId),
          dueDate,
          value: Number(value),
        }),
      });

      if (!response.ok) {
        setErro("Erro ao registrar pagamento");
        return;
      }

      setSucesso("Pagamento registrado com sucesso!");
      setContractId("");
      setDueDate("");
      setValue("");
      buscarPagamentos(paginaAtual);

      setTimeout(() => setSucesso(""), 4000);
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    } finally {
      setSalvando(false);
    }
  };

  const handleMarcarPago = async (id: number) => {
    try {
      await fetch(`${API_URL}/payments/${id}/pagar`, {
        method: "PUT",
        headers,
      });
      setSucesso("Pagamento marcado como pago!");
      buscarPagamentos(paginaAtual);
      setTimeout(() => setSucesso(""), 4000);
    } catch (err) {
      setErro("Não foi possível marcar como pago");
    }
  };

  const handleExcluir = async (id: number) => {
    try {
      await fetch(`${API_URL}/payments/${id}`, {
        method: "DELETE",
        headers,
      });
      buscarPagamentos(paginaAtual);
    } catch (err) {
      setErro("Não foi possível excluir o pagamento");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
        Financeiro
      </h1>

      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Registrar novo pagamento
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          >
            <option value="">Selecione o contrato</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.property?.address} — {c.tenant?.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />

          <input
            type="number"
            placeholder="Valor"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
        </div>

        {erro && <p className="mt-3 text-sm text-red-500">{erro}</p>}
        {sucesso && <p className="mt-3 text-sm text-green-600">{sucesso}</p>}

        <button
          onClick={handleCadastrar}
          disabled={salvando}
          className="mt-4 rounded-xl bg-brand-500 px-5 py-2 font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {salvando ? "Registrando..." : "Registrar"}
        </button>
      </div>

      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Pagamentos
        </h2>

        {carregando ? (
          <p className="text-gray-500 dark:text-gray-300">Carregando...</p>
        ) : payments.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">
            Nenhum pagamento registrado ainda.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border p-3 dark:border-white/10"
                >
                  <div>
                    <p className="font-medium text-navy-700 dark:text-white">
                      {payment.contract?.property?.address} —{" "}
                      {payment.contract?.tenant?.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Vencimento: {payment.dueDate.slice(0, 10)} • R${" "}
                      {Number(payment.value).toFixed(2)} •{" "}
                      <span
                        className={
                          payment.status === "pago"
                            ? "font-medium text-green-600"
                            : "font-medium text-orange-500"
                        }
                      >
                        {payment.status}
                      </span>
                    </p>
                    {payment.diasAtraso > 0 && (
                      <p className="text-sm font-medium text-red-500">
                        Atrasado há {payment.diasAtraso} dia(s) • Valor
                        atualizado: R${" "}
                        {Number(payment.valorAtualizado).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {payment.status === "pendente" && (
                      <button
                        onClick={() => handleMarcarPago(payment.id)}
                        className="rounded-lg bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
                      >
                        Marcar como pago
                      </button>
                    )}
                    {admin && (
                      <button
                        onClick={() => handleExcluir(payment.id)}
                        className="rounded-lg bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPaginas > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => buscarPagamentos(paginaAtual - 1)}
                  disabled={paginaAtual <= 1}
                  className="rounded-lg border px-3 py-1 text-sm font-medium text-navy-700 disabled:opacity-30 dark:text-white"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Página {paginaAtual} de {totalPaginas}
                </span>
                <button
                  onClick={() => buscarPagamentos(paginaAtual + 1)}
                  disabled={paginaAtual >= totalPaginas}
                  className="rounded-lg border px-3 py-1 text-sm font-medium text-navy-700 disabled:opacity-30 dark:text-white"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Payments;
