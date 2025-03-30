export function getDatePointGMT(year, month, day) {
  let startDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).getTime();

  let endDay = new Date(
    Date.UTC(year, month - 1, day, 23, 59, 59, 999)
  ).getTime();

  const startDateStr = new Date(startDay).toISOString();
  const endDateStr = new Date(endDay).toISOString();

  return {
    startDay,
    endDay,
    startDateStr,
    endDateStr,
  };
}
