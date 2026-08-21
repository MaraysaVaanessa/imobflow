import { useEffect, useState } from "react";
import { isAdmin } from "utils/auth";
import { campoVazio } from "utils/validation";

const API_URL = "http://localhost:3333";

const Contracts = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);

  const [propertyId, setPropertyId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentValue, setRentValue] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [status, setStatus] = useState("ativo");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const admin = isAdmin();

  const buscarTudo = async () => {
    setCarregando(true);
    try {
      const [contractsRes, propertiesRes, ownersRes, tenantsRes] =
        await Promise.all([
          fetch(`${API_URL}/contracts`, { headers }),
          fetch(`${API_URL}/properties`, { headers }),
          fetch(`${API_URL}/owners`, { headers }),
          fetch(`${API_URL}/tenants`, { headers }),
        ]);

      setContracts(await contractsRes.json());
      setProperties(await propertiesRes.json());
      setOwners(await ownersRes.json());
      setTenants(await tenantsRes.json());
    } catch (err) {
      setErro("Não foi possível carregar os dados");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarTudo();
  }, []);

  const limparFormulario = () => {
    setPropertyId("");
    setOwnerId("");
    setTenantId("");
    setStartDate("");
    setEndDate("");
    setRentValue("");
    setDueDay("");
    setStatus("ativo");
    setEditingId(null);
  };

  const validarFormulario = () => {
    if (campoVazio(propertyId)) return "Selecione o imóvel";
    if (campoVazio(ownerId)) return "Selecione o proprietário";
    if (campoVazio(tenantId)) return "Selecione o inquilino";
    if (campoVazio(startDate)) return "Informe a data de início";
    if (campoVazio(endDate)) return "Informe a data de término";
    if (campoVazio(rentValue) || Number(rentValue) <= 0)
      return "Informe um valor de aluguel válido";
    if (campoVazio(dueDay) || Number(dueDay) < 1 || Number(dueDay) > 31)
      return "Informe um dia de vencimento entre 1 e 31";
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
      const url = editingId
        ? `${API_URL}/contracts/${editingId}`
        : `${API_URL}/contracts`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          propertyId: Number(propertyId),
          ownerId: Number(ownerId),
          tenantId: Number(tenantId),
          startDate,
          endDate,
          rentValue: Number(rentValue),
          dueDay: Number(dueDay),
          status,
        }),
      });

      if (!response.ok) {
        setErro("Erro ao salvar contrato");
        return;
      }

      setSucesso(
        editingId
          ? "Contrato atualizado com sucesso!"
          : "Contrato cadastrado com sucesso!"
      );
      limparFormulario();
      buscarTudo();

      setTimeout(() => setSucesso(""), 4000);
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = (contract: any) => {
    setSucesso("");
    setErro("");
    setEditingId(contract.id);
    setPropertyId(String(contract.propertyId));
    setOwnerId(String(contract.ownerId));
    setTenantId(String(contract.tenantId));
    setStartDate(contract.startDate.slice(0, 10));
    setEndDate(contract.endDate.slice(0, 10));
    setRentValue(String(contract.rentValue));
    setDueDay(String(contract.dueDay));
    setStatus(contract.status);
  };

  const handleExcluir = async (id: number) => {
    try {
      await fetch(`${API_URL}/contracts/${id}`, {
        method: "DELETE",
        headers,
      });
      buscarTudo();
    } catch (err) {
      setErro("Não foi possível excluir o contrato");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
        Contratos
      </h1>

      {/* Formulário de cadastro/edição */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          {editingId ? "Editar contrato" : "Cadastrar novo contrato"}
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          >
            <option value="">Selecione o imóvel</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}
              </option>
            ))}
          </select>

          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          >
            <option value="">Selecione o proprietário</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          >
            <option value="">Selecione o inquilino</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Valor do aluguel"
            value={rentValue}
            onChange={(e) => setRentValue(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Data de início
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Data de término
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <input
            type="number"
            placeholder="Dia de vencimento (ex: 10)"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />

          {editingId && (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
            >
              <option value="ativo">Ativo</option>
              <option value="encerrado">Encerrado</option>
            </select>
          )}
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

      {/* Lista de contratos */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Contratos cadastrados
        </h2>

        {carregando ? (
          <p className="text-gray-500 dark:text-gray-300">Carregando...</p>
        ) : contracts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">
            Nenhum contrato cadastrado ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between rounded-lg border p-3 dark:border-white/10"
              >
                <div>
                  <p className="font-medium text-navy-700 dark:text-white">
                    {contract.property?.address} — {contract.tenant?.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Proprietário: {contract.owner?.name} • R${" "}
                    {Number(contract.rentValue).toFixed(2)} • Vencimento dia{" "}
                    {contract.dueDay} • {contract.status}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {contract.startDate.slice(0, 10)} até{" "}
                    {contract.endDate.slice(0, 10)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditar(contract)}
                    className="rounded-lg bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                  >
                    Editar
                  </button>
                  {admin && (
                    <button
                      onClick={() => handleExcluir(contract.id)}
                      className="rounded-lg bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contracts;
