import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3333";

const OwnerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setErro("");

    if (!email || !password) {
      setErro("Preencha email e senha");
      return;
    }

    setCarregando(true);
    try {
      const response = await fetch(`${API_URL}/owner-portal/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.error || "Erro ao fazer login");
        return;
      }

      localStorage.setItem("ownerToken", data.token);
      localStorage.setItem("owner", JSON.stringify(data.owner));

      if (data.precisaTrocarSenha) {
        navigate("/portal-proprietario/trocar-senha");
      } else {
        navigate("/portal-proprietario/dashboard");
      }
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-lightPrimary dark:bg-navy-900">
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-xl dark:bg-navy-800">
        <h1 className="mb-2 text-2xl font-bold text-navy-700 dark:text-white">
          Portal do Proprietário
        </h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          Acesse para ver seus imóveis, repasses e vistorias.
        </p>

        <div className="mb-3">
          <label className="text-sm font-medium text-navy-700 dark:text-white">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
          />
        </div>

        <div className="mb-3">
          <label className="text-sm font-medium text-navy-700 dark:text-white">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
          />
        </div>

        {erro && <p className="mb-3 text-sm text-red-500">{erro}</p>}

        <button
          onClick={handleLogin}
          disabled={carregando}
          className="w-full rounded-xl bg-brand-500 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
};

export default OwnerLogin;
