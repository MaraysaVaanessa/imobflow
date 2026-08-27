import { Link } from "react-router-dom";
import { MdBusinessCenter, MdHome, MdPerson } from "react-icons/md";

const AccessHub = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-lightPrimary p-6 dark:bg-navy-900">
      <div className="w-full max-w-2xl text-center">
        <h1 className="mb-2 text-3xl font-bold text-navy-700 dark:text-white">
          ImobFlow
        </h1>
        <p className="mb-10 text-gray-600 dark:text-gray-300">
          Selecione como você deseja acessar o sistema
        </p>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Link
            to="/auth/sign-in"
            className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 shadow-lg transition hover:shadow-xl dark:bg-navy-800"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white">
              <MdBusinessCenter className="h-8 w-8" />
            </div>
            <p className="text-lg font-bold text-navy-700 dark:text-white">
              Administrador / Operador
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Gerencio imóveis, contratos e a operação
            </p>
          </Link>

          <Link
            to="/portal-proprietario/login"
            className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 shadow-lg transition hover:shadow-xl dark:bg-navy-800"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white">
              <MdHome className="h-8 w-8" />
            </div>
            <p className="text-lg font-bold text-navy-700 dark:text-white">
              Sou Proprietário
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Vejo meus imóveis, repasses e vistorias
            </p>
          </Link>

          <Link
            to="/portal-inquilino/login"
            className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 shadow-lg transition hover:shadow-xl dark:bg-navy-800"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white">
              <MdPerson className="h-8 w-8" />
            </div>
            <p className="text-lg font-bold text-navy-700 dark:text-white">
              Sou Inquilino
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Vejo meu contrato, pagamentos e chamados
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessHub;
