export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validarCPF(cpf: string): boolean {
  const apenasNumeros = cpf.replace(/\D/g, "");
  return apenasNumeros.length === 11;
}

export function campoVazio(valor: string): boolean {
  return !valor || valor.trim() === "";
}
