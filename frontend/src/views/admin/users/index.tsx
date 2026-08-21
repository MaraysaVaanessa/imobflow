import { useEffect, useState } from "react";
import { isAdmin } from "utils/auth";

const API_URL = "http://localhost:3333/users";

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [erro, setErro] = useState("");

  const token = localStorage.getItem("token");
  const admin = isAdmin();

  const buscarUsuarios = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setErro("Você não tem permissão para ver essa página");
        return;
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setErro("Não foi possível carregar os usuários");
    }
  };

  useEffect(() => {
    buscarUsuarios();
  }, []);

  const handleAlternarRole = async (id: number, roleAtual: string) => {
    const novaRole = roleAtual === "admin" ? "operador" : "admin";
    try {
      await fetch(`${API_URL}/${id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: novaRole }),
      });
      buscarUsuarios();
    } catch (err) {
      setErro("Não foi possível alterar a permissão");
    }
  };

  if (!admin) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
          Usuários
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Essa página é exclusiva para administradores.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
        Usuários do Sistema
      </h1>

      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        {erro && <p className="mb-3 text-sm text-red-500">{erro}</p>}

        {users.length === 0 && !erro && (
          <p className="text-gray-600 dark:text-gray-300">
            Nenhum usuário cadastrado ainda.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg border p-3 dark:border-white/10"
            >
              <div>
                <p className="font-medium text-navy-700 dark:text-white">
                  {user.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {user.email} •{" "}
                  <span
                    className={
                      user.role === "admin"
                        ? "font-medium text-brand-500"
                        : "font-medium text-gray-500"
                    }
                  >
                    {user.role === "admin" ? "Administrador" : "Operador"}
                  </span>
                </p>
              </div>
              <button
                onClick={() => handleAlternarRole(user.id, user.role)}
                className="rounded-lg bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
              >
                {user.role === "admin"
                  ? "Rebaixar para Operador"
                  : "Promover a Admin"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
