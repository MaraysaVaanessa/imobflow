import WeeklyRevenue from "views/admin/default/components/WeeklyRevenue";

import { MdBarChart, MdDashboard } from "react-icons/md";

import Widget from "components/widget/Widget";
import CheckTable from "views/admin/default/components/CheckTable";

import tableDataCheck from "./variables/tableDataCheck";

const Dashboard = () => {
  return (
    <div>
      {/* Card widget */}

      <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-6">
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Imóveis Cadastrados"}
          subtitle={"0"}
        />
        <Widget
          icon={<MdDashboard className="h-6 w-6" />}
          title={"Contratos Ativos"}
          subtitle={"0"}
        />
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Proprietários"}
          subtitle={"0"}
        />
        <Widget
          icon={<MdDashboard className="h-6 w-6" />}
          title={"Inquilinos"}
          subtitle={"0"}
        />
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Manutenções Pendentes"}
          subtitle={"0"}
        />
        <Widget
          icon={<MdDashboard className="h-6 w-6" />}
          title={"Receita do Mês"}
          subtitle={"R$ 0,00"}
        />
      </div>

      {/* Charts */}

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <WeeklyRevenue />
      </div>

      {/* Tables */}

      <div className="mt-5 grid grid-cols-1 gap-5">
        <CheckTable tableData={tableDataCheck} />
      </div>
    </div>
  );
};

export default Dashboard;
