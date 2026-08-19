import { useState } from "react";

const API_URL = "http://localhost:3333";

const Assistant = () => {
  const [question, setQuestion] = useState("");
  const [historico, setHistorico] = useState<
    { pergunta: string; resposta: string }[]
  >([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const token = localStorage.getItem("token");

  const handlePerguntar = async () => {
    if (!question.trim()) return;

    setErro("");
    setCarregando(true);

    try {
      const response = await fetch(`${API_URL}/ai/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        setErro("Erro ao consultar o assistente");
        setCarregando(false);
        return;
      }

      const data = await response.json();
      setHistorico([
        ...historico,
        { pergunta: question, resposta: data.resposta },
      ]);
      setQuestion("");
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
        Assistente ImobFlow
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        Pergunte sobre imóveis, contratos, pagamentos e manutenções.
      </p>

      {/* Histórico de conversa */}
      <div className="mt-5 flex flex-col gap-4 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        {historico.length === 0 && (
          <p className="text-gray-500 dark:text-gray-300">
            Faça uma pergunta para começar.
          </p>
        )}

        {historico.map((item, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="self-end rounded-xl bg-brand-500 px-4 py-2 text-white">
              {item.pergunta}
            </div>
            <div className="self-start rounded-xl bg-gray-100 px-4 py-2 text-navy-700 dark:bg-navy-900 dark:text-white">
              {item.resposta}
            </div>
          </div>
        ))}

        {carregando && (
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Pensando...
          </p>
        )}
      </div>

      {erro && <p className="mt-3 text-sm text-red-500">{erro}</p>}

      {/* Campo de pergunta */}
      <div className="mt-4 flex gap-3">
        <input
          type="text"
          placeholder="Digite sua pergunta..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handlePerguntar();
          }}
          className="flex-1 rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
        />
        <button
          onClick={handlePerguntar}
          disabled={carregando}
          className="rounded-xl bg-brand-500 px-5 py-2 font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

export default Assistant;
