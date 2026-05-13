export function limparCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

export function formatarCNPJ(cnpj: string): string {
  const cleaned = limparCNPJ(cnpj).slice(0, 14)
  if (cleaned.length <= 2) return cleaned
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`
  if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`
}

export function validarCNPJ(cnpj: string): boolean {
  const cleaned = limparCNPJ(cnpj)
  if (cleaned.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cleaned)) return false

  // Primeiro dígito verificador
  let sum = 0
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  for (let i = 0; i < 12; i++) sum += parseInt(cleaned[i]) * pesos1[i]
  let rest = sum % 11
  if (rest < 2) rest = 0
  else rest = 11 - rest
  if (rest !== parseInt(cleaned[12])) return false

  // Segundo dígito verificador
  sum = 0
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  for (let i = 0; i < 13; i++) sum += parseInt(cleaned[i]) * pesos2[i]
  rest = sum % 11
  if (rest < 2) rest = 0
  else rest = 11 - rest
  if (rest !== parseInt(cleaned[13])) return false

  return true
}

export async function buscarCNPJReceitaWS(cnpj: string): Promise<{ nome: string; error?: string } | null> {
  const cleaned = limparCNPJ(cnpj)
  if (cleaned.length !== 14) return null
  try {
    const res = await fetch(`https://receitaws.com.br/v1/cnpj/${cleaned}`)
    const data = await res.json()
    if (data.status === 'ERROR') return null
    return { nome: data.nome ?? '' }
  } catch {
    return null
  }
}
