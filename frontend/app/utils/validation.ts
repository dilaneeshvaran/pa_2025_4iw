export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[0-9\s\-()]+$/
  if (!phoneRegex.test(phone)) {
    return false
  }
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

export const isValidBirthDate = (dateStr: string): boolean => {
  if (!dateStr) return false
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return false
  }
  const now = new Date()
  const minDate = new Date(now.getFullYear() - 15, now.getMonth(), now.getDate())
  const maxDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate())
  return date <= minDate && date >= maxDate
}
