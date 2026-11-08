/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  createContext,
  Fragment,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

type PresenceState = "open" | "closed";

const PresenceContext = createContext<{
  state: PresenceState;
  onExitComplete: () => void;
} | null>(null);

export function usePresenceContext() {
  return useContext(PresenceContext);
}

export function useHeldWhileClosing<T>(value: T) {
  const closing = usePresenceContext()?.state === "closed";
  const [held, setHeld] = useState(value);
  if (!closing && held !== value) {
    setHeld(value);
  }
  return closing ? held : value;
}

export function Presence({
  children,
  onExitComplete,
  present
}: {
  children: ReactNode;
  onExitComplete?: () => void;
  present: boolean;
}) {
  const [mounted, setMounted] = useState(present);
  const lastChildren = useRef(children);
  if (present) {
    lastChildren.current = children;
  }
  const [opening, setOpening] = useState(0);
  const [wasPresent, setWasPresent] = useState(present);
  if (present !== wasPresent) {
    setWasPresent(present);
    if (present) {
      setOpening(opening + 1);
    }
  }

  useEffect(() => {
    if (present) {
      setMounted(true);
      return;
    }
    const timeout = setTimeout(() => setMounted(false), 600);
    return () => clearTimeout(timeout);
  }, [present]);

  if (!present && !mounted) {
    return null;
  }

  return (
    <PresenceContext.Provider
      value={{
        state: present ? "open" : "closed",
        onExitComplete: () => {
          setMounted(false);
          onExitComplete?.();
        }
      }}
    >
      <Fragment key={opening}>
        {present ? children : lastChildren.current}
      </Fragment>
    </PresenceContext.Provider>
  );
}
