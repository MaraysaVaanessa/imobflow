import { useState } from "react";
import { Link } from "react-router-dom";
import { campoVazio, validarEmail } from "utils/validation";

const API_URL = "http://localhost:3333/support";

const Support = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [enviando, setEnviando] = useState(false);

  const validarFormulario = () => {
    if (campoVazio(name)) return "Informe seu nome";
    if (campoVazio(email)) return "Informe seu email";
    if (!validarEmail(email)) return "Informe um email válido";
    if (campoVazio(message)) return "Escreva sua mensagem";
    return "";
  };

  const handleEnviar = async () => {
    setErro("");
    setSucesso("");

    const mensagemValidacao = validarFormulario();
    if (mensagemValidacao) {
      setErro(mensagemValidacao);
      return;
    }

    setEnviando(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!response.ok) {
        setErro("Não foi possível enviar sua mensagem");
        return;
      }

      setSucesso(
        "Mensagem enviada com sucesso! Entraremos em contato em breve."
      );
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link
        to="/admin"
        className="mb-4 inline-block text-sm font-medium text-brand-500 hover:text-brand-600"
      >
        ← Voltar
      </Link>

      <h1 className="mb-2 text-3xl font-bold text-navy-700 dark:text-white">
        Suporte
      </h1>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Tem alguma dúvida ou problema? Preencha o formulário abaixo e entraremos
        em contato.
      </p>

      <div className="rounded-xl bg-white p-6 shadow dark:bg-navy-800">
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
          <textarea
            placeholder="Descreva sua dúvida ou problema"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
        </div>

        {erro && <p className="mt-3 text-sm text-red-500">{erro}</p>}
        {sucesso && <p className="mt-3 text-sm text-green-600">{sucesso}</p>}

        <button
          onClick={handleEnviar}
          disabled={enviando}
          className="mt-4 rounded-xl bg-brand-500 px-5 py-2 font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Enviar mensagem"}
        </button>
      </div>
    </div>
  );
};

export default Support;
