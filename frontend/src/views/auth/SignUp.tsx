import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { campoVazio, validarEmail } from "utils/validation";

const API_URL = "http://localhost:3333/signup";

const SignUp = () => {
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const validarFormulario = () => {
    if (campoVazio(companyName)) return "Informe o nome da empresa";
    if (campoVazio(name)) return "Informe seu nome";
    if (campoVazio(email)) return "Informe seu email";
    if (!validarEmail(email)) return "Informe um email válido";
    if (campoVazio(password) || password.length < 6)
      return "A senha deve ter pelo menos 6 caracteres";
    return "";
  };

  const handleCadastrar = async () => {
    setErro("");

    const mensagemValidacao = validarFormulario();
    if (mensagemValidacao) {
      setErro(mensagemValidacao);
      return;
    }

    setCarregando(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, name, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setErro(data.error || "Erro ao cadastrar");
        return;
      }

      navigate("/auth/sign-in");
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="mb-16 mt-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      <div className="mt-[10vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
        <h4 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">
          Cadastre sua empresa
        </h4>
        <p className="mb-9 ml-1 text-base text-gray-600">
          Crie sua conta e comece a gerenciar seus imóveis.
        </p>

        <div className="mb-3">
          <label className="ml-1.5 text-sm font-medium text-navy-700 dark:text-white">
            Nome da empresa
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Ex: Imobiliária Exemplo"
            className="mt-2 flex h-12 w-full items-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:!border-white/10 dark:text-white"
          />
        </div>

        <div className="mb-3">
          <label className="ml-1.5 text-sm font-medium text-navy-700 dark:text-white">
            Seu nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
            className="mt-2 flex h-12 w-full items-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:!border-white/10 dark:text-white"
          />
        </div>

        <div className="mb-3">
          <label className="ml-1.5 text-sm font-medium text-navy-700 dark:text-white">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="mail@exemplo.com"
            className="mt-2 flex h-12 w-full items-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:!border-white/10 dark:text-white"
          />
        </div>

        <div className="mb-3">
          <label className="ml-1.5 text-sm font-medium text-navy-700 dark:text-white">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mín. 6 caracteres"
            className="mt-2 flex h-12 w-full items-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:!border-white/10 dark:text-white"
          />
        </div>

        {erro && <p className="mb-3 text-sm text-red-500">{erro}</p>}

        <button
          onClick={handleCadastrar}
          disabled={carregando}
          className="linear mt-2 w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 disabled:opacity-50"
        >
          {carregando ? "Cadastrando..." : "Criar minha empresa"}
        </button>

        <div className="mt-4">
          <span className="text-sm font-medium text-navy-700 dark:text-gray-600">
            Já tem uma conta?
          </span>
          <Link
            to="/auth/sign-in"
            className="ml-1 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-white"
          >
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
