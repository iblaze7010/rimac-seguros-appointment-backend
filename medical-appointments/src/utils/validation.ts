export const isValidCountryISO = (countryISO: string): boolean => {
  return ["PE", "CL"].includes(countryISO);
};

export const hasRequiredFields = (body: any): boolean => {
  return body.insuredId && body.scheduleId && body.countryISO;
};
