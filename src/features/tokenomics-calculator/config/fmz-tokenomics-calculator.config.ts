const readPublicEnv = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};

export const fmzTokenomicsCalculatorConfig = {
  calculatePath: readPublicEnv('NEXT_PUBLIC_FMZ_TOKENOMICS_CALCULATE_PATH', '/tokenomics/calculate'),
  pagePath: readPublicEnv('NEXT_PUBLIC_FMZ_TOKENOMICS_CALCULATOR_PATH', '/connected/invoicesAdmin/tokenomicsCalculator'),
} as const;
