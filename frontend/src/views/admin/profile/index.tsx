import { useState } from "react";

const ProfileOverview = () => {
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const iniciais = user?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mt-3 flex w-full flex-col gap-5">
      <div className="flex flex-col items-center rounded-xl bg-white p-8 shadow dark:bg-navy-800">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-500 text-3xl font-bold text-white">
          {iniciais || "?"}
        </div>
        <h2 className="mt-4 text-xl font-bold text-navy-700 dark:text-white">
          {user?.name || "Usuário"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          {user?.role === "operador" ? "Operador" : user?.role}
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow dark:bg-navy-800">
        <h3 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
          Dados da Conta
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
            />
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-500 dark:text-gray-300">
          A funcionalidade de salvar alterações será implementada em breve.
        </p>
      </div>
    </div>
  );
};

export default ProfileOverview;
