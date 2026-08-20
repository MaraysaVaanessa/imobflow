import { useEffect, useState } from "react";
import Card from "components/card";

const ExpiringContracts = () => {
  const [contratos, setContratos] = useState<any[]>([]);

  useEffect(() => {
    const buscar = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(
          "http://localhost:3333/reports/expiring-contracts",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        setContratos(data.slice(0, 5));
      } catch (err) {
        console.error("Erro ao buscar contratos vencendo", err);
      }
    };
    buscar();
  }, []);

  return (
    <Card extra={"w-full h-full p-4"}>
      <p className="text-lg font-bold text-navy-700 dark:text-white">
        Contratos vencendo em breve
      </p>
      {contratos.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-300">
          Nenhum contrato vencendo nos próximos 30 dias.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {contratos.map((contrato) => (
            <div
              key={contrato.id}
              className="flex items-center justify-between rounded-lg border p-2 text-sm dark:border-white/10"
            >
              <span className="text-navy-700 dark:text-white">
                {contrato.property?.address} — {contrato.tenant?.name}
              </span>
              <span className="text-gray-500 dark:text-gray-300">
                {contrato.endDate.slice(0, 10)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ExpiringContracts;
