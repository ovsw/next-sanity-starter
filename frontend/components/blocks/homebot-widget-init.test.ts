import { afterEach, describe, expect, it, vi } from "vitest";
import { createHomebotWidgetInitializer } from "./homebot-widget-init";

describe("HomeBot widget initializer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes each container once, reuses a loaded script, and reports a timeout", () => {
    vi.useFakeTimers();
    const homebot = vi.fn();
    const initializer = createHomebotWidgetInitializer(() => homebot);
    const firstContainer = document.createElement("div");
    firstContainer.id = "homebot_first";
    const firstFailure = vi.fn();

    initializer.register({
      container: firstContainer,
      onFailure: firstFailure,
      timeoutMs: 100,
      token: "token",
    });
    initializer.markScriptReady();
    initializer.markScriptReady();
    initializer.register({
      container: firstContainer,
      onFailure: firstFailure,
      timeoutMs: 100,
      token: "token",
    });

    expect(homebot).toHaveBeenCalledOnce();
    expect(homebot).toHaveBeenCalledWith("#homebot_first", "token");

    const secondContainer = document.createElement("div");
    secondContainer.id = "homebot_second";
    initializer.register({
      container: secondContainer,
      onFailure: vi.fn(),
      timeoutMs: 100,
      token: "token",
    });

    expect(homebot).toHaveBeenCalledTimes(2);
    expect(homebot).toHaveBeenLastCalledWith("#homebot_second", "token");

    const timeoutFailure = vi.fn();
    const waitingInitializer = createHomebotWidgetInitializer(() => homebot);
    const waitingContainer = document.createElement("div");
    waitingContainer.id = "homebot_waiting";
    waitingInitializer.register({
      container: waitingContainer,
      onFailure: timeoutFailure,
      timeoutMs: 100,
      token: "token",
    });
    vi.advanceTimersByTime(100);

    expect(timeoutFailure).toHaveBeenCalledOnce();
    expect(homebot).toHaveBeenCalledTimes(2);
  });
});
