export function getExperience(dateString: string) {
  const today = new Date();
  const from = new Date(dateString);
  let age = today.getFullYear() - from.getFullYear();
  const m = today.getMonth() - from.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < from.getDate())) {
    age--;
  }
  return age;
}
