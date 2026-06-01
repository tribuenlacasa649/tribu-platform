export type PhoneCountry = {
  code: string;
  label: string;
  flag: string;
};

export const phoneCountries: PhoneCountry[] = [
  { code: "+54", label: "Argentina", flag: "AR" },
  { code: "+598", label: "Uruguay", flag: "UY" },
  { code: "+56", label: "Chile", flag: "CL" },
  { code: "+55", label: "Brasil", flag: "BR" },
];

export function cleanPhoneNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function formatPhone(countryCode: string | null | undefined, phone: string | null | undefined) {
  const cleanCountry = countryCode || "+54";
  const cleanPhone = cleanPhoneNumber(phone || "");

  if (!cleanPhone) {
    return "";
  }

  return `${cleanCountry}${cleanPhone}`;
}
