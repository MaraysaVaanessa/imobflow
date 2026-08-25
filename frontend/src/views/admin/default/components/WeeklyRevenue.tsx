import { useEffect, useState } from "react";
import Card from "components/card";
import BarChart from "components/charts/BarChart";
import { MdBarChart, MdShowChart } from "react-icons/md";

const WeeklyRevenue = () => {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [valores, setValores] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscar = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(
          "http://localhost:3333/reports/weekly-revenue",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        setCategorias(data.categorias);
        setValores(data.valores);
      } catch (err) {
        console.error("Erro ao buscar receita semanal", err);
      } finally {
        setCarregando(false);
      }
    };
    buscar();
  }, []);

  const semDados = !carregando && valores.every((v) => v === 0);

  const chartData = [
    {
      name: "Receita",
      data: valores,
      color: "#8B5E34",
    },
  ];

  const chartOptions = {
    chart: {
      toolbar: { show: false },
    },
    tooltip: {
      style: {
        fontSize: "12px",
        fontFamily: undefined as any,
        backgroundColor: "#000000",
      },
      theme: "dark",
    },
    xaxis: {
      categories: categorias,
      show: false,
      labels: {
        show: true,
        style: {
          colors: "#A3AED0",
          fontSize: "14px",
          fontWeight: "500",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      show: false,
    },
    grid: {
      borderColor: "rgba(163, 174, 208, 0.3)",
      show: true,
      yaxis: { lines: { show: false } },
      xaxis: { lines: { show: false } },
    },
    fill: {
      type: "solid",
      colors: ["#8B5E34"],
    },
    legend: { show: false },
    colors: ["#8B5E34"],
    dataLabels: { enabled: false },
    plotOptions: {
      bar: {
        borderRadius: 10,
        columnWidth: "40px",
      },
    },
  };

  return (
    <Card extra="flex flex-col bg-white w-full rounded-3xl py-6 px-2 text-center">
      <div className="mb-auto flex items-center justify-between px-6">
        <h2 className="text-lg font-bold text-navy-700 dark:text-white">
          Receita Semanal
        </h2>
        <button className="!linear z-[1] flex items-center justify-center rounded-lg bg-lightPrimary p-2 text-brand-500 !transition !duration-200 hover:bg-gray-100 active:bg-gray-200 dark:bg-navy-700 dark:text-white dark:hover:bg-white/20 dark:active:bg-white/10">
          <MdBarChart className="h-6 w-6" />
        </button>
      </div>

      {semDados ? (
        <div className="flex h-[250px] w-full flex-col items-center justify-center gap-3 xl:h-[350px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lightPrimary dark:bg-navy-700">
            <MdShowChart className="h-8 w-8 text-brand-500" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-300">
            Nenhuma receita registrada nos últimos 7 dias
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-400">
            Marque pagamentos como pagos para ver o gráfico aqui
          </p>
        </div>
      ) : (
        <div className="md:mt-16 lg:mt-0">
          <div className="h-[250px] w-full xl:h-[350px]">
            <BarChart chartData={chartData} chartOptions={chartOptions} />
          </div>
        </div>
      )}
    </Card>
  );
};

export default WeeklyRevenue;
