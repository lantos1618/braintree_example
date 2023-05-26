import { z } from "zod";
import { env } from "~/env.mjs";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getPaypalClient } from "~/server/paypal";
import paypal from "@paypal/checkout-server-sdk";

const getAmount = (amountOfLicenses: number) => {
  // if  5 > discount = 10%
  // if 10 > discount = 20%
  const unitPrice = 5; // $5 per license
  const multiplier = 1
  const amount = amountOfLicenses * unitPrice * multiplier;

  if (amountOfLicenses >= 10) {
    return amount * 0.8;
  }
  if (amountOfLicenses >= 5) {
    return amount * 0.9;
  }
  return amount;
}



export const paypalRouter = createTRPCRouter({
  createOrder: publicProcedure
    .input(z.object({ amountOfLicenses: z.number() }))
    .mutation(async ({ input }) => {
      const { amountOfLicenses } = input;
      const paypalClient = getPaypalClient();
      const amount = getAmount(amountOfLicenses).toString();


      const request = new paypal.orders.OrdersCreateRequest();
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: "GBP",
            value: amount,
          },
        }],
        application_context: {
          shipping_preference: "NO_SHIPPING",
        }
      });
      const response = await paypalClient.execute(request)

      // we know it returns an { id }
      console.log(response);
      const result = response.result as {
        id: string;
        status: string;
        links: {
          rel: string;
          href: string;
          method: string;
        }[];
      }

      return JSON.stringify(request);

    }),
  captureOrder: publicProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input }) => {
      const { orderId } = input;
      const paypalClient = getPaypalClient();

      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({
        payment_source: {
          token: {
            id: orderId,
            type: "BILLING_AGREEMENT",
          },
        }
      });

      const response = await paypalClient.execute(request);
      console.log(response.result);

    })
});


async function get_access_token(
  client_id: string,
  client_secret: string,
  endpoint_url: string
) {
  const auth = `${client_id}:${client_secret}`
  const data = 'grant_type=client_credentials'
  const response = await fetch(endpoint_url + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`
    },
    body: data
  })
  const json = await response.json() as {
    scope: string;
    access_token: string;
    token_type: string;
  }
  return json.access_token
}
