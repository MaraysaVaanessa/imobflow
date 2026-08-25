import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WeeklyRevenue from "views/admin/default/components/WeeklyRevenue";
import ExpiringContracts from "views/admin/default/components/ExpiringContracts";
import PendingPayments from "views/admin/default/components/PendingPayments";

import { MdBarChart, MdDashboard } from "react-icons/md";

import Widget from "components/widget/Widget";

const Dashboard = () => {
  const navigate = useNavigate();

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
          onClick={() => navigate("/admin/properties")}
          status="default"
        />
        <Widget
          icon={<MdDashboard className="h-6 w-6" />}
          title={"Contratos Ativos"}
          subtitle={String(stats.contratosAtivos)}
          onClick={() => navigate("/admin/contracts")}
          status="success"
        />
        <Widget
          icon={<MdDashboard className="h-6 w-6" />}
          title={"Contratos Encerrados"}
          subtitle={String(stats.contratosInativos)}
          onClick={() => navigate("/admin/contracts")}
          status="default"
        />
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Proprietários"}
          subtitle={String(stats.proprietarios)}
          onClick={() => navigate("/admin/owners")}
          status="default"
        />
        <Widget
          icon={<MdDashboard className="h-6 w-6" />}
          title={"Inquilinos"}
          subtitle={String(stats.inquilinos)}
          onClick={() => navigate("/admin/tenants")}
          status="default"
        />
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Manutenções Pendentes"}
          subtitle={String(stats.manutencoesPendentes)}
          onClick={() => navigate("/admin/maintenances")}
          status={stats.manutencoesPendentes > 0 ? "danger" : "success"}
        />
      </div>

      {/* Charts */}

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <WeeklyRevenue />

        <div className="flex h-full flex-col justify-center rounded-[20px] bg-white p-6 shadow-xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lightPrimary dark:bg-navy-700">
            <MdDashboard className="h-7 w-7 text-brand-500" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-600 dark:text-white">
            Receita do Mês
          </p>
          <p className="mt-1 text-4xl font-bold text-navy-700 dark:text-white">
            R$ {(stats.receitaDoMes ?? 0).toFixed(2)}
          </p>
        </div>
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
