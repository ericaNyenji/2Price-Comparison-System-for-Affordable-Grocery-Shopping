export function formatCurrency(amount) {

  const currencyCode = sessionStorage.getItem("currencyCode") || "USD";

  if (amount == null || isNaN(amount)) return "0.00";

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (e) {

    return `${currencyCode} ${Number(amount).toFixed(2)}`;
  }
}
