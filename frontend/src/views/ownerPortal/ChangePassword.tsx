import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3333";

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("ownerToken");

  const handleTrocar = async () => {
    setErro("");

    if (newPassword.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErro("As senhas não coincidem");
      return;
    }

    setCarregando(true);
    try {
      const response = await fetch(`${API_URL}/owner-portal/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        setErro("Não foi possível trocar a senha");
        return;
      }

      navigate("/portal-proprietario/dashboard");
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
          Defina sua nova senha
        </h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          Por segurança, você precisa trocar a senha temporária antes de
          continuar.
        </p>

        <div className="mb-3">
          <label className="text-sm font-medium text-navy-700 dark:text-white">
            Nova senha
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
          />
        </div>

        <div className="mb-3">
          <label className="text-sm font-medium text-navy-700 dark:text-white">
            Confirme a nova senha
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
          />
        </div>

        {erro && <p className="mb-3 text-sm text-red-500">{erro}</p>}

        <button
          onClick={handleTrocar}
          disabled={carregando}
          className="w-full rounded-xl bg-brand-500 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {carregando ? "Salvando..." : "Trocar senha e continuar"}
        </button>
      </div>
    </div>
  );
};

export default ChangePassword;
