import { useEffect, useState } from "react";
import { isAdmin } from "utils/auth";
import { campoVazio, validarEmail, validarCPF } from "utils/validation";

const API_URL = "http://localhost:3333/tenants";

const Tenants = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [guarantorAddress, setGuarantorAddress] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const token = localStorage.getItem("token");
  const admin = isAdmin();

  const buscarInquilinos = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setTenants(data);
    } catch (err) {
      setErro("Não foi possível carregar os inquilinos");
    }
  };

  useEffect(() => {
    buscarInquilinos();
  }, []);

  const limparFormulario = () => {
    setName("");
    setPhone("");
    setEmail("");
    setCpf("");
    setGuarantorName("");
    setGuarantorPhone("");
    setGuarantorAddress("");
    setEditingId(null);
  };

  const validarFormulario = () => {
    if (campoVazio(name)) return "Informe o nome do inquilino";
    if (campoVazio(phone)) return "Informe o telefone do inquilino";
    if (campoVazio(email)) return "Informe o email do inquilino";
    if (!validarEmail(email))
      return "Informe um email válido (ex: nome@exemplo.com)";
    if (campoVazio(cpf)) return "Informe o CPF do inquilino";
    if (!validarCPF(cpf)) return "O CPF do inquilino deve ter 11 dígitos";
    if (campoVazio(guarantorName)) return "Informe o nome do fiador";
    if (campoVazio(guarantorPhone)) return "Informe o telefone do fiador";
    if (campoVazio(guarantorAddress)) return "Informe o endereço do fiador";
    return "";
  };

  const handleSalvar = async () => {
    setErro("");
    setSucesso("");

    const mensagemValidacao = validarFormulario();
    if (mensagemValidacao) {
      setErro(mensagemValidacao);
      return;
    }

    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          cpf,
          guarantorName,
          guarantorPhone,
          guarantorAddress,
        }),
      });

      if (!response.ok) {
        setErro("Erro ao salvar inquilino");
        return;
      }

      setSucesso(
        editingId
          ? "Inquilino atualizado com sucesso!"
          : "Inquilino cadastrado com sucesso!"
      );
      limparFormulario();
      buscarInquilinos();

      setTimeout(() => setSucesso(""), 4000);
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    }
  };

  const handleEditar = (tenant: any) => {
    setSucesso("");
    setErro("");
    setEditingId(tenant.id);
    setName(tenant.name);
    setPhone(tenant.phone);
    setEmail(tenant.email);
    setCpf(tenant.cpf);
    setGuarantorName(tenant.guarantorName);
    setGuarantorPhone(tenant.guarantorPhone);
    setGuarantorAddress(tenant.guarantorAddress);
  };

  const handleExcluir = async (id: number) => {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      buscarInquilinos();
    } catch (err) {
      setErro("Não foi possível excluir o inquilino");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
        Inquilinos
      </h1>

      {/* Formulário de cadastro/edição */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          {editingId ? "Editar inquilino" : "Cadastrar novo inquilino"}
        </h2>

        <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-300">
          Dados do inquilino
        </p>
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
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
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
            onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
            maxLength={11}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
        </div>

        <p className="mb-2 mt-4 text-sm font-medium text-gray-500 dark:text-gray-300">
          Dados do fiador
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Nome do fiador"
            value={guarantorName}
            onChange={(e) => setGuarantorName(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Telefone do fiador"
            value={guarantorPhone}
            onChange={(e) =>
              setGuarantorPhone(e.target.value.replace(/\D/g, ""))
            }
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Endereço do fiador"
            value={guarantorAddress}
            onChange={(e) => setGuarantorAddress(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white md:col-span-2"
          />
        </div>

        {erro && <p className="mt-3 text-sm text-red-500">{erro}</p>}
        {sucesso && <p className="mt-3 text-sm text-green-600">{sucesso}</p>}

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

      {/* Lista de inquilinos */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Inquilinos cadastrados
        </h2>

        {tenants.length === 0 && (
          <p className="text-gray-600 dark:text-gray-300">
            Nenhum inquilino cadastrado ainda.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="flex items-center justify-between rounded-lg border p-3 dark:border-white/10"
            >
              <div>
                <p className="font-medium text-navy-700 dark:text-white">
                  {tenant.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {tenant.phone} • {tenant.email} • CPF: {tenant.cpf}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Fiador: {tenant.guarantorName} • {tenant.guarantorPhone}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditar(tenant)}
                  className="rounded-lg bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                >
                  Editar
                </button>
                {admin && (
                  <button
                    onClick={() => handleExcluir(tenant.id)}
                    className="rounded-lg bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tenants;
