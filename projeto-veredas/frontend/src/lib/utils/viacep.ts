export interface ViaCEPResult {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

export function formatarCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '').slice(0, 8)
  if (cleaned.length <= 5) return cleaned
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
}

export function limparCEP(cep: string): string {
  return cep.replace(/\D/g, '')
}

export async function buscarCEP(cep: string): Promise<ViaCEPResult | null> {
  const cleaned = limparCEP(cep)
  if (cleaned.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
    const data = await res.json()
    if (data.erro) return null
    return {
      cep: data.cep,
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      uf: data.uf,
    }
  } catch {
    return null
  }
}
