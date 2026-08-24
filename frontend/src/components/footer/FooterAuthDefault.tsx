import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <div className="z-[5] mx-auto flex w-full max-w-screen-sm flex-col items-center justify-between px-[20px] pb-4 lg:mb-6 lg:max-w-[100%] lg:flex-row xl:mb-2 xl:w-[1310px] xl:pb-6">
      <p className="mb-6 text-center text-sm text-gray-600 md:text-base lg:mb-0">
        © {new Date().getFullYear()} ImobFlow. Todos os direitos reservados.
      </p>
      <ul className="flex flex-wrap items-center sm:flex-nowrap">
        <li className="mr-12">
          <Link
            to="/support"
            className="text-sm text-gray-600 hover:text-gray-600 md:text-base lg:text-white lg:hover:text-white"
          >
            Suporte
          </Link>
        </li>
        <li className="mr-12">
          <Link
            to="/terms-of-use"
            className="text-sm text-gray-600 hover:text-gray-600 md:text-base lg:text-white lg:hover:text-white"
          >
            Termos de Uso
          </Link>
        </li>
        <li>
          <Link
            to="/privacy-policy"
            className="text-sm text-gray-600 hover:text-gray-600 md:text-base lg:text-white lg:hover:text-white"
          >
            Privacidade
          </Link>
        </li>
      </ul>
    </div>
  );
}
