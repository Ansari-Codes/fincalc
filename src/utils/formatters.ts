export function formatCurrency(amount: number, currency = 'USD', decimals = 2): string {
  if (isNaN(amount) || !isFinite(amount)) {
    return '$0.00'
  }
  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`
}

export function formatPercent(percent: number, decimals = 2): string {
  if (isNaN(percent) || !isFinite(percent)) {
    return '0.00%'
  }
  return `${percent.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}%`
}

export function formatNumber(num: number, decimals = 0): string {
  if (isNaN(num) || !isFinite(num)) {
    return '0'
  }
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return successful
    }
  } catch (err) {
    console.error('Failed to copy text: ', err)
    return false
  }
}
