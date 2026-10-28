"use client";

import React from "react";

type ConnectivityType = {
  isOnline: boolean;
  simulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
};
const ConnectivityContext = React.createContext<ConnectivityType | null>(null);

export function ConnectivityProvider(props: { children: React.ReactNode }) {
  const [browserOnline, setBrowserOnline] = React.useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [simulatedOffline, setSimulatedOffline] = React.useState(false);

  React.useEffect(() => {
    function onOnline() {
      setBrowserOnline(true);
    }
    function onOffline() {
      setBrowserOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return function cleanup() {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  function toggleSimulatedOffline() {
    setSimulatedOffline((value) => !value);
  }

  return (
    <ConnectivityContext.Provider
      value={{
        isOnline: browserOnline && !simulatedOffline,
        simulatedOffline,
        toggleSimulatedOffline,
      }}
    >
      {props.children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  const context = React.useContext(ConnectivityContext);
  if (!context)
    throw new Error("useConnectivity must be used within ConnectivityProvider");
  return context;
}
