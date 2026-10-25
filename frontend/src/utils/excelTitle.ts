/**
 * Calculates current week number of the month (Korean corporate standard: Monday-first).
 * Dynamically formats: "N주차_매출현황.xlsx - MOSAIC Team docs"
 */
export const getExcelWeekTitle = (date: Date = new Date()): string => {
  const currentDate = date.getDate();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayWeekday = (firstDay.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const weekNum = Math.floor((currentDate + firstDayWeekday - 1) / 7) + 1;
  return `${weekNum}주차_매출현황.xlsx - MOSAIC Team docs`;
};
