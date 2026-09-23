export const formatCurrency = (amount: number): string => {
  if (amount === 0) return 'Miễn phí (0đ)';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString));
};

export const maskStudentCode = (code?: string): string => {
  if (!code) return '***';
  if (code.length <= 4) return '****';
  return `${code.substring(0, 2)}****${code.substring(code.length - 2)}`;
};
