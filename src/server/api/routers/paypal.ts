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
    .query(async ({ input}) => {
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
      });

      const response = await paypalClient.execute(request);
      console.log(response.result);
      
    }),
    captureOrder: publicProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input}) => {
      const { orderId } = input;
      const paypalClient = getPaypalClient();

      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});

      const response = await paypalClient.execute(request);
      console.log(response.result);
      
    })
});
