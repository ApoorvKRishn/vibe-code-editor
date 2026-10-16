import { useState, useEffect, useCallback, useRef } from "react";
import { WebContainer } from "@webcontainer/api";
import { TemplateFolder } from "@/modules/playground/lib/path-to-json";
import { transformToWebContainerFormat } from "./transformer";

// Only one WebContainer may be booted per page. Boots are chained after the
// previous teardown so navigating between playgrounds never double-boots.
let bootPromise: Promise<WebContainer> | null = null;
let teardownPromise: Promise<void> = Promise.resolve();

function acquireWebContainer(): Promise<WebContainer> {
  if (!bootPromise) {
    bootPromise = teardownPromise.then(() => WebContainer.boot());
  }
  return bootPromise;
}

function releaseWebContainer() {
  const current = bootPromise;
  bootPromise = null;
  if (current) {
    teardownPromise = current
      .then((instance) => instance.teardown())
      .catch(() => {});
  }
}

export type SetupStep =
  | "idle"
  | "mounting"
  | "installing"
  | "starting"
  | "ready"
  | "error";

interface UseWebContainerProps {
  templateData: TemplateFolder | null;
}

interface UseWebContainerReturn {
  serverUrl: string | null;
  isLoading: boolean;
  error: string | null;
  instance: WebContainer | null;
  setupStep: SetupStep;
  writeFileSync: (path: string, content: string) => Promise<void>;
  subscribeOutput: (listener: (data: string) => void) => () => void;
}

export const useWebContainer = ({
  templateData,
}: UseWebContainerProps): UseWebContainerReturn => {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [instance, setInstance] = useState<WebContainer | null>(null);
  const [setupStep, setSetupStep] = useState<SetupStep>("idle");

  // Setup output is buffered so a terminal mounted later can replay it.
  const outputRef = useRef<string[]>([]);
  const listenersRef = useRef(new Set<(data: string) => void>());
  const setupStartedRef = useRef(false);

  const appendOutput = useCallback((data: string) => {
    outputRef.current.push(data);
    listenersRef.current.forEach((listener) => listener(data));
  }, []);

  const subscribeOutput = useCallback((listener: (data: string) => void) => {
    outputRef.current.forEach((chunk) => listener(chunk));
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    acquireWebContainer()
      .then((webcontainerInstance) => {
        if (!mounted) return;
        setInstance(webcontainerInstance);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to initialize WebContainer:", err);
        if (!mounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to initialize WebContainer"
        );
        setIsLoading(false);
      });

    return () => {
      mounted = false;
      releaseWebContainer();
    };
  }, []);

  useEffect(() => {
    if (!instance) return;
    return instance.on("server-ready", (_port, url) => {
      appendOutput(`\r\n🌐 Server ready at ${url}\r\n`);
      setServerUrl(url);
      setSetupStep("ready");
    });
  }, [instance, appendOutput]);

  // Mount the project, install dependencies and start the dev server — once.
  useEffect(() => {
    if (!instance || !templateData || setupStartedRef.current) return;
    setupStartedRef.current = true;

    const pipeToOutput = () =>
      new WritableStream<string>({
        write(data) {
          appendOutput(data);
        },
      });

    (async () => {
      try {
        setSetupStep("mounting");
        appendOutput("📁 Mounting files to WebContainer...\r\n");
        await instance.mount(transformToWebContainerFormat(templateData));

        setSetupStep("installing");
        appendOutput("📦 Installing dependencies...\r\n");
        const installProcess = await instance.spawn("npm", ["install"]);
        installProcess.output.pipeTo(pipeToOutput());
        const installExitCode = await installProcess.exit;
        if (installExitCode !== 0) {
          throw new Error(
            `Failed to install dependencies (exit code ${installExitCode})`
          );
        }

        setSetupStep("starting");
        appendOutput("🚀 Starting development server...\r\n");
        const startProcess = await instance.spawn("npm", ["run", "start"]);
        startProcess.output.pipeTo(pipeToOutput());
        startProcess.exit.then((code) => {
          if (code !== 0) {
            appendOutput(`\r\n❌ Dev server exited with code ${code}\r\n`);
          }
        });
      } catch (err) {
        console.error("Error setting up container:", err);
        const message = err instanceof Error ? err.message : String(err);
        appendOutput(`\r\n❌ Error: ${message}\r\n`);
        setError(message);
        setSetupStep("error");
      }
    })();
  }, [instance, templateData, appendOutput]);

  const writeFileSync = useCallback(
    async (path: string, content: string): Promise<void> => {
      if (!instance) {
        throw new Error("WebContainer instance is not available");
      }

      const folderPath = path.split("/").slice(0, -1).join("/");
      if (folderPath) {
        await instance.fs.mkdir(folderPath, { recursive: true });
      }
      await instance.fs.writeFile(path, content);
    },
    [instance]
  );

  return {
    serverUrl,
    isLoading,
    error,
    instance,
    setupStep,
    writeFileSync,
    subscribeOutput,
  };
};
