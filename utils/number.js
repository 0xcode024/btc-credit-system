export const formatNumber = (num) => {
  // Limit to 3 decimal places
  let formatted = num.toFixed(3);

  // Remove trailing zeros
  formatted = formatted.replace(/(\.\d*?)0+$/, "$1");

  // If the decimal point is left with no digits, remove it
  if (formatted.endsWith(".")) {
    formatted = formatted.slice(0, -1);
  }

  return formatted;
};
