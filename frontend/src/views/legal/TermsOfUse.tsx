import { Link } from "react-router-dom";

const TermsOfUse = () => {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <Link
        to="/admin"
        className="mb-4 inline-block text-sm font-medium text-brand-500 hover:text-brand-600"
      >
        ← Voltar
      </Link>

      <h1 className="mb-6 text-3xl font-bold text-navy-700 dark:text-white">
        Termos de Uso
      </h1>

      <div className="flex flex-col gap-4 text-gray-700 dark:text-gray-300">
        <p>
          Bem-vindo ao ImobFlow, um sistema de gestão imobiliária. Ao utilizar
          esta plataforma, você concorda com os termos descritos abaixo.
        </p>

        <h2 className="mt-4 text-xl font-bold text-navy-700 dark:text-white">
          1. Sobre o sistema
        </h2>
        <p>
          O ImobFlow é uma ferramenta destinada à gestão de imóveis,
          proprietários, inquilinos, contratos, pagamentos e demais processos
          relacionados à administração imobiliária.
        </p>

        <h2 className="mt-4 text-xl font-bold text-navy-700 dark:text-white">
          2. Uso autorizado
        </h2>
        <p>
          O acesso ao sistema é restrito a usuários autorizados (operadores e
          administradores). Cada usuário é responsável por manter a
          confidencialidade de suas credenciais de acesso e por todas as ações
          realizadas em sua conta.
        </p>

        <h2 className="mt-4 text-xl font-bold text-navy-700 dark:text-white">
          3. Responsabilidades do usuário
        </h2>
        <p>
          O usuário compromete-se a inserir informações verdadeiras e
          atualizadas no sistema, e a utilizar a plataforma de forma ética e
          dentro dos limites legais aplicáveis à atividade imobiliária.
        </p>

        <h2 className="mt-4 text-xl font-bold text-navy-700 dark:text-white">
          4. Disponibilidade e limitações
        </h2>
        <p>
          O ImobFlow está em desenvolvimento contínuo e pode passar por
          atualizações, manutenções ou instabilidades temporárias. Não nos
          responsabilizamos por eventuais perdas decorrentes de
          indisponibilidade do sistema.
        </p>

        <h2 className="mt-4 text-xl font-bold text-navy-700 dark:text-white">
          5. Alterações nos termos
        </h2>
        <p>
          Estes termos podem ser atualizados periodicamente. Recomendamos a
          revisão frequente desta página.
        </p>
      </div>
    </div>
  );
};

export default TermsOfUse;
