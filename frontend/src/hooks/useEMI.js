import { useState, useMemo } from 'react'
import { calcEMI, formatINR } from '../services/loanService'

export function useEMI(initialPrincipal = 1000000, initialRate = 10.5, initialMonths = 36) {
  const [principal, setPrincipal] = useState(initialPrincipal)
  const [annualRate, setAnnualRate] = useState(initialRate)
  const [months, setMonths] = useState(initialMonths)

  const emi = useMemo(() => calcEMI(principal, annualRate, months), [principal, annualRate, months])
  const total = useMemo(() => emi * months, [emi, months])
  const interest = useMemo(() => total - principal, [total, principal])

  return {
    principal, setPrincipal,
    annualRate, setAnnualRate,
    months, setMonths,
    emi, total, interest,
    formatted: {
      emi: formatINR(emi),
      total: formatINR(total),
      interest: formatINR(interest),
      principal: formatINR(principal),
    },
  }
}
