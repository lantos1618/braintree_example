import { env } from "~/env.mjs";

import paypal from "@paypal/checkout-server-sdk";

const getPaypalClient = () => {
  const clientId = env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_CLIENT_SECRET;

  return new paypal.core.PayPalHttpClient(
    env.NODE_ENV === "production" ?
    new paypal.core.LiveEnvironment(clientId, clientSecret) :
    new paypal.core.SandboxEnvironment(clientId, clientSecret)
  );
}

export { getPaypalClient}