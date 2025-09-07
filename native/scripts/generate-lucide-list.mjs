import fs from "node:fs";
import path from "node:path";

const dtsPath = path.resolve(
  process.cwd(),
  "node_modules/lucide-react-native/dist/lucide-react-native.d.ts",
);
const outPath = path.resolve(process.cwd(), "constants/lucideIconNames.json");

const dts = fs.readFileSync(dtsPath, "utf8");
const names = [...dts.matchAll(/declare const (\w+): LucideIcon;/g)].map(
  (m) => m[1],
);

fs.writeFileSync(outPath, JSON.stringify(names, null, 2));
console.log("Wrote", names.length, "icon names to", outPath);
