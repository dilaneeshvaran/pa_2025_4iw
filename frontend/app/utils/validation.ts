export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[0-9\s\-()]+$/
  if (!phoneRegex.test(phone)) {
    return false
  }
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15
}

export const isValidBirthDate = (dateStr: string): boolean => {
  if (!dateStr) return false
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return false
  }
  return date < new Date()
}
