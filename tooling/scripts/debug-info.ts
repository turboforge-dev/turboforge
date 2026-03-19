import envinfo from "envinfo";

const getDebugInfo = async () => {
  const info = await envinfo.run(
    {
      System: ["OS", "CPU", "Memory", "Shell"],
      Binaries: ["Node", "Yarn", "npm", "pnpm"],
      Browsers: ["Chrome", "Edge", "Firefox", "Safari"],
      npmPackages: ["typescript", "vite", "turborepo", "biome"],
      // npmGlobalPackages: ["turbo-forge-cli"],
    },
    { showNotFound: true, duplicates: true, fullTree: false },
  );

  console.log("--- TURBOFORGE DEBUG INFO ---");
  console.log(info);
  console.log("------------------------------");
};

getDebugInfo();
