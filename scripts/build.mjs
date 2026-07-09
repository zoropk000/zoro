import { readdir, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const viteBin = join(process.cwd(), "node_modules", "vite", "bin", "vite.js");
const code = await run(process.execPath, [viteBin, "build", "--mode", "production"], {
  ...process.env,
  NODE_ENV: "production",
  BABEL_ENV: "production",
});

if (code !== 0) process.exit(code);

await assertNoDevJsx(".vercel/output/functions/__server.func/_ssr");

function run(command, args, env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      env,
      stdio: "inherit",
      shell: false,
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      resolve(code ?? 1);
    });
  });
}

async function assertNoDevJsx(dir) {
  const files = await listFiles(dir);
  const offenders = [];

  for (const file of files) {
    if (!file.endsWith(".mjs") && !file.endsWith(".js")) continue;
    const source = await readFile(file, "utf8");
    if (source.includes("jsxDEV") || source.includes("jsx-dev-runtime")) {
      offenders.push(file);
    }
  }

  if (offenders.length) {
    throw new Error(
      [
        "Production SSR build contains React development JSX output.",
        "Remove NODE_ENV=development from the deployment environment and rebuild.",
        ...offenders.map((file) => ` - ${file}`),
      ].join("\n"),
    );
  }
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? listFiles(path) : path;
    }),
  );

  return files.flat();
}
