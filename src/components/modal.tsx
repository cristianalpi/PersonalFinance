"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const CloseContext = createContext<() => void>(() => {});

/** Lets content inside a Modal close it (for example after saving). */
export const useCloseModal = () => useContext(CloseContext);

/**
 * A button that opens a modal: centred window on wide screens, bottom sheet on
 * phones. Its content is mounted fresh each time it opens.
 */
export function Modal({
  label,
  title,
  buttonClass = "btn h-12 gap-2 rounded-2xl px-5 text-base",
  children,
}: {
  label: React.ReactNode;
  title: string;
  buttonClass?: string;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [round, setRound] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => dialog.current?.close(), []);

  useEffect(() => {
    const el = dialog.current;
    const onClose = () => setIsOpen(false);
    el?.addEventListener("close", onClose);
    return () => el?.removeEventListener("close", onClose);
  }, []);

  return (
    <>
      <button
        type="button"
        className={buttonClass}
        onClick={() => {
          setRound((r) => r + 1);
          setIsOpen(true);
          dialog.current?.showModal();
        }}
      >
        {label}
      </button>
      <dialog ref={dialog} aria-label={title} className="sheet" onClick={(e) => e.target === e.currentTarget && close()}>
        <div className="flex flex-col gap-4 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="display text-2xl">{title}</h2>
            <button type="button" onClick={close} className="btn-quiet size-10 p-0 text-lg" aria-label="Cerrar">
              ✕
            </button>
          </div>
          <CloseContext.Provider value={close}>{isOpen && <div key={round}>{children}</div>}</CloseContext.Provider>
        </div>
      </dialog>
    </>
  );
}
