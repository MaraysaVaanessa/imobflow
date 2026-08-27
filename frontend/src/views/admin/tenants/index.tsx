import { useEffect, useState } from "react";
import { isAdmin } from "utils/auth";
import { campoVazio, validarEmail, validarCPF } from "utils/validation";

const API_URL = "http://localhost:3333/tenants";

const Tenants = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
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
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [acessoGerado, setAcessoGerado] = useState<{
    [id: number]: { senha: string; email: string };
  }>({});

  const token = localStorage.getItem("token");
  const admin = isAdmin();

  const buscarInquilinos = async (pagina = 1) => {
    setCarregando(true);
    try {
      const response = await fetch(`${API_URL}/paginated?pagina=${pagina}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setTenants(data.tenants || []);
      setTotalPaginas(data.totalPaginas || 1);
      setPaginaAtual(data.paginaAtual || 1);
    } catch (err) {
      setErro("Não foi possível carregar os inquilinos");
      setTenants([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarInquilinos(1);
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

    setSalvando(true);
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
      buscarInquilinos(paginaAtual);

      setTimeout(() => setSucesso(""), 4000);
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    } finally {
      setSalvando(false);
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
      buscarInquilinos(paginaAtual);
    } catch (err) {
      setErro("Não foi possível excluir o inquilino");
    }
  };

  const handleGerarAcesso = async (id: number) => {
    setErro("");
    try {
      const response = await fetch(`${API_URL}/${id}/generate-access`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.error || "Não foi possível gerar o acesso");
        return;
      }

      setAcessoGerado({
        ...acessoGerado,
        [id]: { senha: data.senhaTemporaria, email: data.email },
      });
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
        Inquilinos
      </h1>

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
            disabled={salvando}
            className="rounded-xl bg-brand-500 px-5 py-2 font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {salvando
              ? "Salvando..."
              : editingId
              ? "Salvar alterações"
              : "Cadastrar"}
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

      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Inquilinos cadastrados
        </h2>

        {carregando ? (
          <p className="text-gray-500 dark:text-gray-300">Carregando...</p>
        ) : tenants.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">
            Nenhum inquilino cadastrado ainda.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex flex-col gap-2 rounded-lg border p-3 dark:border-white/10"
                >
                  <div className="flex items-center justify-between">
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

                  <div className="border-t pt-2 dark:border-white/10">
                    {admin && (
                      <button
                        onClick={() => handleGerarAcesso(tenant.id)}
                        className="rounded-lg border border-brand-500 px-3 py-1 text-xs font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-navy-700"
                      >
                        Gerar acesso ao Portal do Inquilino
                      </button>
                    )}

                    {acessoGerado[tenant.id] && (
                      <div className="mt-2 rounded-lg bg-lightPrimary p-3 text-sm dark:bg-navy-900">
                        <p className="font-medium text-navy-700 dark:text-white">
                          Repasse estas credenciais ao inquilino:
                        </p>
                        <p className="mt-1 text-gray-700 dark:text-gray-300">
                          Portal:{" "}
                          <span className="font-mono">
                            localhost:3000/portal-inquilino/login
                          </span>
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          Email:{" "}
                          <span className="font-mono">
                            {acessoGerado[tenant.id].email}
                          </span>
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          Senha temporária:{" "}
                          <span className="font-mono font-bold">
                            {acessoGerado[tenant.id].senha}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPaginas > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => buscarInquilinos(paginaAtual - 1)}
                  disabled={paginaAtual <= 1}
                  className="rounded-lg border px-3 py-1 text-sm font-medium text-navy-700 disabled:opacity-30 dark:text-white"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Página {paginaAtual} de {totalPaginas}
                </span>
                <button
                  onClick={() => buscarInquilinos(paginaAtual + 1)}
                  disabled={paginaAtual >= totalPaginas}
                  className="rounded-lg border px-3 py-1 text-sm font-medium text-navy-700 disabled:opacity-30 dark:text-white"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Tenants;
