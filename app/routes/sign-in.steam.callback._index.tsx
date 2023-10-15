import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/auth.server";

export function loader({ request }: LoaderFunctionArgs) {
  return authenticator.authenticate("steam", request, {
    successRedirect: "/",
    failureRedirect: "/"
  });
}
