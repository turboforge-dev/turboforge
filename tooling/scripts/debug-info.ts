import envinfo from "envinfo";

const getDebugInfo = async () => {
  const info = await envinfo.run(
    {
      System: ["OS", "CPU", "Memory", "Shell"],
      Binaries: ["Node", "Yarn", "npm", "pnpm"],
      Browsers: ["Chrome", "Edge", "Firefox", "Safari"],
      npmPackages: ["typescript", "vite", "turborepo", "biome"],
      npmGlobalPackages: ["turbo-forge-cli"], // REBRAND_TARGET
    },
    { showNotFound: true, duplicates: true, fullTree: false },
  );

  console.log("--- TURBO-FORGE DEBUG INFO ---");
  console.log(info);
  console.log("------------------------------");
};

getDebugInfo();
