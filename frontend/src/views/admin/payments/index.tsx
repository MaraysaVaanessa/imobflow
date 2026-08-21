import { useEffect, useState } from "react";
import { isAdmin } from "utils/auth";
import { campoVazio } from "utils/validation";

const API_URL = "http://localhost:3333";

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  const [contractId, setContractId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [value, setValue] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const admin = isAdmin();

  const buscarTudo = async () => {
    try {
      const [paymentsRes, contractsRes] = await Promise.all([
        fetch(`${API_URL}/payments`, { headers }),
        fetch(`${API_URL}/contracts`, { headers }),
      ]);

      setPayments(await paymentsRes.json());
      setContracts(await contractsRes.json());
    } catch (err) {
      setErro("Não foi possível carregar os dados");
    }
  };

  useEffect(() => {
    buscarTudo();
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
      buscarTudo();

      setTimeout(() => setSucesso(""), 4000);
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    }
  };

  const handleMarcarPago = async (id: number) => {
    try {
      await fetch(`${API_URL}/payments/${id}/pagar`, {
        method: "PUT",
        headers,
      });
      setSucesso("Pagamento marcado como pago!");
      buscarTudo();
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
      buscarTudo();
    } catch (err) {
      setErro("Não foi possível excluir o pagamento");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
        Financeiro
      </h1>

      {/* Formulário de cadastro */}
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
          className="mt-4 rounded-xl bg-brand-500 px-5 py-2 font-medium text-white hover:bg-brand-600"
        >
          Registrar
        </button>
      </div>

      {/* Lista de pagamentos */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Pagamentos
        </h2>

        {payments.length === 0 && (
          <p className="text-gray-600 dark:text-gray-300">
            Nenhum pagamento registrado ainda.
          </p>
        )}

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
      </div>
    </div>
  );
};

export default Payments;
