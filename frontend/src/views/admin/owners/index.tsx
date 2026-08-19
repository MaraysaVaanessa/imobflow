import { useEffect, useState } from "react";
import PhotoUpload from "components/photoUpload/PhotoUpload";

const API_URL = "http://localhost:3333/owners";

const Owners = () => {
  const [owners, setOwners] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [address, setAddress] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  const token = localStorage.getItem("token");

  const buscarProprietarios = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setOwners(data);
    } catch (err) {
      setErro("Não foi possível carregar os proprietários");
    }
  };

  useEffect(() => {
    buscarProprietarios();
  }, []);

  const limparFormulario = () => {
    setName("");
    setPhone("");
    setEmail("");
    setCpf("");
    setAddress("");
    setPhotoUrl("");
    setEditingId(null);
  };

  const handleSalvar = async () => {
    setErro("");
    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone, email, cpf, address, photoUrl }),
      });

      if (!response.ok) {
        setErro("Erro ao salvar proprietário");
        return;
      }

      limparFormulario();
      buscarProprietarios();
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    }
  };

  const handleEditar = (owner: any) => {
    setEditingId(owner.id);
    setName(owner.name);
    setPhone(owner.phone);
    setEmail(owner.email);
    setCpf(owner.cpf);
    setAddress(owner.address);
    setPhotoUrl(owner.photoUrl || "");
  };

  const handleExcluir = async (id: number) => {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      buscarProprietarios();
    } catch (err) {
      setErro("Não foi possível excluir o proprietário");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
        Proprietários
      </h1>

      {/* Formulário de cadastro/edição */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          {editingId ? "Editar proprietário" : "Cadastrar novo proprietário"}
        </h2>

        <div className="mb-4">
          <PhotoUpload
            photoUrl={photoUrl}
            onUploaded={(url) => setPhotoUrl(url)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="CPF"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Endereço"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
        </div>

        {erro && <p className="mt-3 text-sm text-red-500">{erro}</p>}

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSalvar}
            className="rounded-xl bg-brand-500 px-5 py-2 font-medium text-white hover:bg-brand-600"
          >
            {editingId ? "Salvar alterações" : "Cadastrar"}
          </button>

          {editingId && (
            <button
              onClick={limparFormulario}
              className="rounded-xl border px-5 py-2 font-medium text-navy-700 dark:text-white"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Lista de proprietários */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Proprietários cadastrados
        </h2>

        {owners.length === 0 && (
          <p className="text-gray-600 dark:text-gray-300">
            Nenhum proprietário cadastrado ainda.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {owners.map((owner) => (
            <div
              key={owner.id}
              className="flex items-center justify-between rounded-lg border p-3 dark:border-white/10"
            >
              <div className="flex items-center gap-3">
                {owner.photoUrl && (
                  <img
                    src={owner.photoUrl}
                    alt={owner.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-navy-700 dark:text-white">
                    {owner.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {owner.phone} • {owner.email} • CPF: {owner.cpf}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {owner.address}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditar(owner)}
                  className="rounded-lg bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleExcluir(owner.id)}
                  className="rounded-lg bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Owners;
