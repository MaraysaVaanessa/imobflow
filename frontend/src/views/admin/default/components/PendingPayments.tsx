import { useEffect, useState } from "react";
import Card from "components/card";

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
          {pagamentos.map((pagamento) => (
            <div
              key={pagamento.id}
              className="flex items-center justify-between rounded-lg border p-2 text-sm dark:border-white/10"
            >
              <span className="text-navy-700 dark:text-white">
                {pagamento.contract?.property?.address} —{" "}
                {pagamento.contract?.tenant?.name}
              </span>
              <span className="text-gray-500 dark:text-gray-300">
                R$ {Number(pagamento.value).toFixed(2)} •{" "}
                {pagamento.dueDate.slice(0, 10)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default PendingPayments;
