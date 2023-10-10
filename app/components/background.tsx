import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";

export function Background() {
  return (
    <>
      <div
        className="absolute left-0 top-0 -z-10 h-full w-full overflow-hidden blur-lg"
        id="background"
      >
      </div>
      <ClientOnly>
        {() =>
          createPortal(
            <div className="flex h-full w-full items-center justify-center">
              <video
                disablePictureInPicture={true}
                onContextMenu={event => event.preventDefault()}
                className="w-full opacity-50 saturate-200"
                src="/bg.webm"
                autoPlay
                loop
                muted
              >
              </video>
            </div>,
            document.getElementById("background")!
          )}
      </ClientOnly>
    </>
  );
}
