import { useEffect, useState } from "react";
import WeeklyRevenue from "views/admin/default/components/WeeklyRevenue";
import ExpiringContracts from "views/admin/default/components/ExpiringContracts";
import PendingPayments from "views/admin/default/components/PendingPayments";

import { MdBarChart, MdDashboard } from "react-icons/md";

import Widget from "components/widget/Widget";

const Dashboard = () => {
  const [stats, setStats] = useState({
    imoveis: 0,
    contratosAtivos: 0,
    contratosInativos: 0,
    proprietarios: 0,
    inquilinos: 0,
    manutencoesPendentes: 0,
    receitaDoMes: 0,
  });

  useEffect(() => {
    const buscarStats = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch("http://localhost:3333/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error("Erro ao buscar estatísticas: resposta não OK");
          return;
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Erro ao buscar estatísticas", err);
      }
    };

    buscarStats();
  }, []);

  return (
    <div>
      {/* Card widget */}

      <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-6">
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Imóveis Cadastrados"}
          subtitle={String(stats.imoveis)}
        />
        <Widget
          icon={<MdDashboard className="h-6 w-6" />}
          title={"Contratos Ativos"}
          subtitle={String(stats.contratosAtivos)}
        />
        <Widget
          icon={<MdDashboard className="h-6 w-6" />}
          title={"Contratos Encerrados"}
          subtitle={String(stats.contratosInativos)}
        />
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Proprietários"}
          subtitle={String(stats.proprietarios)}
        />
        <Widget
          icon={<MdDashboard className="h-6 w-6" />}
          title={"Inquilinos"}
          subtitle={String(stats.inquilinos)}
        />
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Manutenções Pendentes"}
          subtitle={String(stats.manutencoesPendentes)}
        />
        <Widget
          icon={<MdDashboard className="h-6 w-6" />}
          title={"Receita do Mês"}
          subtitle={`R$ ${(stats.receitaDoMes ?? 0).toFixed(2)}`}
        />
      </div>

      {/* Charts */}

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <WeeklyRevenue />
      </div>

      {/* Tables */}

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <ExpiringContracts />
        <PendingPayments />
      </div>
    </div>
  );
};

export default Dashboard;
