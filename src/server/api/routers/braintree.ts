import { z } from "zod";
import { env } from "~/env.mjs";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getBraintreeGateway } from "~/server/braintree";

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


export const braintreeRouter = createTRPCRouter({
  getClientToken: publicProcedure
    .input(z.object({ amountOfLicenses: z.number() }))
    .query(async ({ input}) => {
      const { amountOfLicenses } = input;
      const gateway = getBraintreeGateway();
      const amount = getAmount(amountOfLicenses).toString();


      const clientToken = await gateway.clientToken.generate({});
      return {
        clientToken: clientToken.clientToken,
        amount,
      };
    }),
  createTransaction: publicProcedure.input(z.object({
    amountOfLicenses: z.number(),
    paymentMethodNonce: z.string(),
  })).mutation(async ({ input }) => {

    const { amountOfLicenses, paymentMethodNonce } = input;

    const gateway = getBraintreeGateway();

    const amount = getAmount(amountOfLicenses).toString();


    const result = await gateway.transaction.sale({
      amount,
      paymentMethodNonce,
    });

    if (!result.success) {
      throw new Error('Transaction failed');
    }

    // create a license for the user
    // update the database with the transaction
    // send an email to the user with the license key

    return {
      success: true,
      transaction: result.transaction,
    };
  })
});
