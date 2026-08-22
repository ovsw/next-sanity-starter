export type HomebotFunction = (selector: string, token: string) => void;

type WidgetRegistration = {
  container: HTMLElement;
  onFailure: () => void;
  timeoutId: ReturnType<typeof setTimeout>;
  token: string;
};

type RegisterWidgetOptions = {
  container: HTMLElement;
  onFailure: () => void;
  timeoutMs?: number;
  token: string;
};

type HomebotWidgetInitializer = {
  markScriptFailed: () => void;
  markScriptReady: () => void;
  register: (options: RegisterWidgetOptions) => () => void;
};

const DEFAULT_TIMEOUT_MS = 10_000;

export function createHomebotWidgetInitializer(
  getHomebot: () => HomebotFunction | undefined,
): HomebotWidgetInitializer {
  const initializedContainers = new WeakSet<HTMLElement>();
  const pendingRegistrations = new Map<HTMLElement, WidgetRegistration>();
  let scriptReady = false;

  const removeRegistration = (registration: WidgetRegistration) => {
    clearTimeout(registration.timeoutId);
    if (pendingRegistrations.get(registration.container) === registration) {
      pendingRegistrations.delete(registration.container);
    }
  };

  const failRegistration = (registration: WidgetRegistration) => {
    removeRegistration(registration);
    registration.onFailure();
  };

  const initializeRegistration = (registration: WidgetRegistration) => {
    if (initializedContainers.has(registration.container)) {
      removeRegistration(registration);
      return;
    }

    const homebot = getHomebot();
    if (!homebot) {
      failRegistration(registration);
      return;
    }

    try {
      homebot(`#${registration.container.id}`, registration.token);
      initializedContainers.add(registration.container);
      removeRegistration(registration);
    } catch {
      failRegistration(registration);
    }
  };

  return {
    markScriptFailed() {
      for (const registration of [...pendingRegistrations.values()]) {
        failRegistration(registration);
      }
    },
    markScriptReady() {
      scriptReady = true;
      for (const registration of [...pendingRegistrations.values()]) {
        initializeRegistration(registration);
      }
    },
    register({
      container,
      onFailure,
      timeoutMs = DEFAULT_TIMEOUT_MS,
      token,
    }) {
      if (initializedContainers.has(container)) return () => undefined;

      const previousRegistration = pendingRegistrations.get(container);
      if (previousRegistration) removeRegistration(previousRegistration);

      const registration: WidgetRegistration = {
        container,
        onFailure,
        timeoutId: setTimeout(() => {
          failRegistration(registration);
        }, timeoutMs),
        token,
      };
      pendingRegistrations.set(container, registration);

      if (scriptReady) initializeRegistration(registration);

      return () => removeRegistration(registration);
    },
  };
}

declare global {
  interface Window {
    Homebot?: HomebotFunction & { q?: [string, string][] };
    __hb_namespace?: "Homebot";
  }
}

export const homebotWidgetInitializer = createHomebotWidgetInitializer(
  () => window.Homebot,
);
