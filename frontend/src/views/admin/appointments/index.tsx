import { useEffect, useState } from "react";
import { isAdmin } from "utils/auth";
import { campoVazio } from "utils/validation";

const API_URL = "http://localhost:3333";

const Appointments = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [propertyId, setPropertyId] = useState("");
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
      const [appointmentsRes, propertiesRes] = await Promise.all([
        fetch(`${API_URL}/appointments`, { headers }),
        fetch(`${API_URL}/properties`, { headers }),
      ]);

      setAppointments(await appointmentsRes.json());
      setProperties(await propertiesRes.json());
    } catch (err) {
      setErro("Não foi possível carregar os dados");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarTudo();
  }, []);

  const validarFormulario = () => {
    if (campoVazio(title)) return "Informe o título do compromisso";
    if (campoVazio(date)) return "Informe a data e hora";
    return "";
  };

  const handleCadastrar = async () => {
    setErro("");
    setSucesso("");

    const mensagemValidacao = validarFormulario();
    if (mensagemValidacao) {
      setErro(mensagemValidacao);
      return;
    }

    setSalvando(true);
    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          title,
          description,
          date,
          propertyId: propertyId || null,
        }),
      });

      if (!response.ok) {
        setErro("Erro ao registrar compromisso");
        return;
      }

      setSucesso("Compromisso registrado com sucesso!");
      setTitle("");
      setDescription("");
      setDate("");
      setPropertyId("");
      buscarTudo();

      setTimeout(() => setSucesso(""), 4000);
    } catch (err) {
      setErro("Não foi possível conectar ao servidor");
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: number) => {
    try {
      await fetch(`${API_URL}/appointments/${id}`, {
        method: "DELETE",
        headers,
      });
      buscarTudo();
    } catch (err) {
      setErro("Não foi possível excluir o compromisso");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
        Agenda
      </h1>

      {/* Formulário de cadastro */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Novo compromisso
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />

          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />

          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          >
            <option value="">Sem imóvel vinculado</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border p-2 dark:bg-navy-900 dark:text-white"
          />
        </div>

        {erro && <p className="mt-3 text-sm text-red-500">{erro}</p>}
        {sucesso && <p className="mt-3 text-sm text-green-600">{sucesso}</p>}

        <button
          onClick={handleCadastrar}
          disabled={salvando}
          className="mt-4 rounded-xl bg-brand-500 px-5 py-2 font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {salvando ? "Registrando..." : "Registrar"}
        </button>
      </div>

      {/* Lista de compromissos */}
      <div className="mt-5 rounded-xl bg-white p-5 shadow dark:bg-navy-800">
        <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Compromissos
        </h2>

        {carregando ? (
          <p className="text-gray-500 dark:text-gray-300">Carregando...</p>
        ) : appointments.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">
            Nenhum compromisso registrado ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between rounded-lg border p-3 dark:border-white/10"
              >
                <div>
                  <p className="font-medium text-navy-700 dark:text-white">
                    {appointment.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(appointment.date).toLocaleString("pt-BR")}
                    {appointment.property &&
                      ` • ${appointment.property.address}`}
                  </p>
                  {appointment.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {appointment.description}
                    </p>
                  )}
                </div>
                {admin && (
                  <button
                    onClick={() => handleExcluir(appointment.id)}
                    className="rounded-lg bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                  >
                    Excluir
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
