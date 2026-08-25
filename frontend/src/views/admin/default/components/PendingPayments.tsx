import { useEffect, useState } from "react";
import Card from "components/card";

const getIniciais = (nome: string) => {
  return nome
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const getStatusVencimento = (dueDate: string) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(dueDate);
  const diffDias = Math.ceil(
    (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDias < 0) {
    return { cor: "bg-red-500", texto: "Atrasado" };
  }
  if (diffDias <= 5) {
    return { cor: "bg-orange-500", texto: "Vence em breve" };
  }
  return { cor: "bg-green-500", texto: "No prazo" };
};

const PendingPayments = () => {
  const [pagamentos, setPagamentos] = useState<any[]>([]);

  useEffect(() => {
    const buscar = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(
          "http://localhost:3333/reports/pending-payments",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        setPagamentos(data);
      } catch (err) {
        console.error("Erro ao buscar pagamentos pendentes", err);
      }
    };
    buscar();
  }, []);

  return (
    <Card extra={"w-full h-full p-4"}>
      <p className="text-lg font-bold text-navy-700 dark:text-white">
        Pagamentos pendentes
      </p>
      {pagamentos.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-300">
          Nenhum pagamento pendente.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {pagamentos.map((pagamento) => {
            const status = getStatusVencimento(pagamento.dueDate);
            const nomeInquilino = pagamento.contract?.tenant?.name || "?";

            return (
              <div
                key={pagamento.id}
                className="flex items-center justify-between rounded-lg border p-2 text-sm dark:border-white/10"
              >
                <div className="flex items-center gap-2">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                    {getIniciais(nomeInquilino)}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-navy-800 ${status.cor}`}
                      title={status.texto}
                    />
                  </div>
                  <span className="text-navy-700 dark:text-white">
                    {pagamento.contract?.property?.address} — {nomeInquilino}
                  </span>
                </div>
                <span className="text-gray-500 dark:text-gray-300">
                  R$ {Number(pagamento.value).toFixed(2)} •{" "}
                  {pagamento.dueDate.slice(0, 10)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default PendingPayments;
