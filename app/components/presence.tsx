/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  createContext,
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
      {present ? children : lastChildren.current}
    </PresenceContext.Provider>
  );
}
