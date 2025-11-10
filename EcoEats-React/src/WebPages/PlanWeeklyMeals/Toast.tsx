import React, { createContext, useContext, useMemo, useState } from "react";

type Toast = { id: number; kind: "success" | "error" | "info"; text: string };
type Ctx = {
  push: (t: string, kind?: Toast["kind"]) => void;
  success: (t: string) => void;
  error: (t: string) => void;
  info: (t: string) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export const NotifierProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (text: string, kind: Toast["kind"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, text, kind }]);
    // auto remove after 3.5s
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 3500);
  };
  const api = useMemo<Ctx>(
    () => ({
      push,
      success: (t) => push(t, "success"),
      error: (t) => push(t, "error"),
      info: (t) => push(t, "info"),
    }),
    []
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.kind}`}
            role={t.kind === "error" ? "alert" : "status"}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

export const useNotify = () => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useNotify must be used inside <NotifierProvider>");
  return ctx;
};
