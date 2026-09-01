export const brand: {
  name: string;
  signature: string;
  logo: {
    src: string;
    width: number;
    height: number;
    crop: { x: number; y: number; width: number; height: number };
  } | null;
} = {
  name: "PethCoach",
  signature: "Mais conexão começa na rotina.",
  logo: {
    src: "/brand/pethcoach-logo.png",
    width: 1448,
    height: 1086,
    crop: { x: 106, y: 354, width: 1246, height: 325 },
  },
};
