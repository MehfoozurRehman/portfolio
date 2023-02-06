export const getExperience = (dateString: any) =>
  Math.floor(new Date() - new Date(dateString) / 1000 / 60 / 60 / 24 / 365);
