import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <Link
        to="/admin"
        className="mb-4 inline-block text-sm font-medium text-brand-500 hover:text-brand-600"
      >
        ← Voltar
      </Link>

      <h1 className="mb-6 text-3xl font-bold text-navy-700 dark:text-white">
        Política de Privacidade
      </h1>

      <div className="flex flex-col gap-4 text-gray-700 dark:text-gray-300">
        <p>
          Esta política descreve como o ImobFlow coleta, utiliza e protege as
          informações inseridas na plataforma.
        </p>

        <h2 className="mt-4 text-xl font-bold text-navy-700 dark:text-white">
          1. Dados coletados
        </h2>
        <p>
          O sistema armazena dados de usuários cadastrados (nome, email e senha
          protegida por criptografia), além de dados de imóveis, proprietários,
          inquilinos e contratos inseridos pelos operadores, incluindo nome,
          CPF, telefone, endereço e, quando fornecidas, fotos.
        </p>

        <h2 className="mt-4 text-xl font-bold text-navy-700 dark:text-white">
          2. Finalidade do uso dos dados
        </h2>
        <p>
          As informações são utilizadas exclusivamente para o funcionamento do
          sistema de gestão imobiliária, incluindo controle de contratos,
          pagamentos, manutenções e comunicações internas do sistema. Não
          compartilhamos dados com terceiros para fins comerciais.
        </p>

        <h2 className="mt-4 text-xl font-bold text-navy-700 dark:text-white">
          3. Armazenamento e segurança
        </h2>
        <p>
          Os dados são armazenados em banco de dados próprio, com senhas
          protegidas por criptografia (hash) e acesso ao sistema controlado por
          autenticação e permissões de usuário (operador/administrador).
        </p>

        <h2 className="mt-4 text-xl font-bold text-navy-700 dark:text-white">
          4. Direitos dos titulares
        </h2>
        <p>
          Proprietários e inquilinos cujos dados estejam cadastrados no sistema
          podem solicitar, junto ao administrador responsável, a correção ou
          remoção de suas informações.
        </p>

        <h2 className="mt-4 text-xl font-bold text-navy-700 dark:text-white">
          5. Contato
        </h2>
        <p>
          Dúvidas relacionadas a esta política podem ser encaminhadas através do
          email de suporte do sistema.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
