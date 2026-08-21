import { useEffect, useState } from "react";
import PhotoUpload from "components/photoUpload/PhotoUpload";

const API_URL = "http://localhost:3333/me/profile";

const ProfileOverview = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const token = localStorage.getItem("token");

  const iniciais = name
    ?.split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const buscarPerfil = async () => {
    setCarregando(true);
    try {
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setName(data.name);
      setEmail(data.email);
      setRole(data.role);
      setPhotoUrl(data.photoUrl || "");
    } catch (err) {
      setErro("Não foi possível carregar o perfil");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarPerfil();
  }, []);

  const handleSalvar = async () => {
    setErro("");
    setSucesso("");

    if (!name.trim()) {
      setErro("Informe o nome");
      return;
    }

    setSalvando(true);
    try {
      const response = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, photoUrl }),
      });

      if (!response.ok) {
        setErro("Erro ao salvar perfil");
        return;
      }

      const data = await response.json();

      // Atualiza o localStorage também, para refletir no Navbar imediatamente
      const userString = localStorage.getItem("user");
      const userAtual = userString ? JSON.parse(userString) : {};
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...userAtual,
          name: data.name,
          photoUrl: data.photoUrl,
        })
      );

      setSucesso("Perfil atualizado com sucesso!");
      setTimeout(() => setSucesso(""), 4000);
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="mt-3">
        <p className="text-gray-500 dark:text-gray-300">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="mt-3 flex w-full flex-col gap-5">
      <div className="flex flex-col items-center rounded-xl bg-white p-8 shadow dark:bg-navy-800">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-500 text-3xl font-bold text-white">
            {iniciais || "?"}
          </div>
        )}
        <h2 className="mt-4 text-xl font-bold text-navy-700 dark:text-white">
          {name || "Usuário"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          {role === "admin" ? "Administrador" : "Operador"}
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow dark:bg-navy-800">
        <h3 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
          Dados da Conta
        </h3>

        <div className="mb-4">
          <PhotoUpload
            photoUrl={photoUrl}
            onUploaded={(url) => setPhotoUrl(url)}
          />
        </div>

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
              disabled
              className="mt-1 w-full rounded-lg border bg-gray-100 p-2 text-gray-500 dark:bg-navy-900/50 dark:text-gray-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              O email não pode ser alterado por aqui.
            </p>
          </div>
        </div>

        {erro && <p className="mt-3 text-sm text-red-500">{erro}</p>}
        {sucesso && <p className="mt-3 text-sm text-green-600">{sucesso}</p>}

        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="mt-4 rounded-xl bg-brand-500 px-5 py-2 font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
};

export default ProfileOverview;
