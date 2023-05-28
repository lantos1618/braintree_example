import { z } from "zod";
import { env } from "~/env.mjs";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getPaypalClient } from "~/server/paypal";
import paypal, { type orders } from "@paypal/checkout-server-sdk";
import { prisma } from "~/server/db";
import shortUUID from "short-uuid";
import { getCost } from "../../getCost";

const translator = shortUUID();

export const paypalRouter = createTRPCRouter({
    createOrder: publicProcedure
        .input(z.object({ amountOfLicenses: z.number() }))
        .mutation(async ({ input }) => {
            const { amountOfLicenses } = input;
            console.log("amountOfLicenses", amountOfLicenses);
            const paypalClient = getPaypalClient();
            const cost = getCost(amountOfLicenses)

            console.log("cost", cost);


            const request = new paypal.orders.OrdersCreateRequest();

            const invoiceId = translator.new();
            request.requestBody({
                intent: "CAPTURE",
                purchase_units: [{
                    invoice_id: invoiceId,
                    custom_id: cost.units,
                    // reference_id: "10",
                    amount: {
                        currency_code: "USD",
                        value: cost.amountValue,
                        breakdown: {
                            discount: {
                                currency_code: "USD",
                                value: cost.discountAmount,
                            },
                            item_total: {
                                currency_code: "USD",
                                value: cost.itemTotalValue,

                            },
                            handling: {
                                currency_code: "USD",
                                value: "0.0",
                            },
                            shipping: {
                                currency_code: "USD",
                                value: "0.0",
                            },
                            tax_total: {
                                currency_code: "USD",
                                value: "0.0",
                            },
                            insurance: {
                                currency_code: "USD",
                                value: "0.0",
                            },
                            shipping_discount: {
                                currency_code: "USD",
                                value: "0.0",
                            },
                        }
                    },
                    items: [{
                        name: "License",
                        category: "DIGITAL_GOODS",
                        unit_amount: {
                            currency_code: "USD",
                            value: cost.unitPrice,
                        },
                        quantity: cost.units,
                    }],
                }],
                application_context: {
                    shipping_preference: "NO_SHIPPING",
                }
            });
            const response = await paypalClient.execute(request)

            // we know it returns an { id }
            console.log(response);
            const result = response.result as orders.Order;

            return result;

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

            const response = await paypalClient.execute(request)

            const result = response.result as orders.Order;

            console.log("captureOrder result", JSON.stringify(result, null, 2));

     

            if (result.status !== "COMPLETED") {
                throw new Error("Order not completed");
            }

            if (!result.purchase_units || result.purchase_units.length == 0) {
                throw new Error("No purchase units");
            }
            console.log("captureOrder result.purchase_units", result.purchase_units);

            const purchaseUnit = result.purchase_units[0]
            if (!purchaseUnit) {
                throw new Error("No purchase unit");
            }


            const capture = purchaseUnit.payments.captures[0];

            if (!capture) {
                throw new Error("No capture");
            }
            const amount = capture.amount.value;
            const amountOfLicenses = parseInt(capture.custom_id);

            if(!amountOfLicenses){
                throw new Error("No amountOfLicenses");
            }

            const invoiceId = capture.invoice_id;
            if (!invoiceId) {
                throw new Error("No invoiceId");
            }


            const email = result.payer.email_address;
            if (!email) {
                throw new Error("No email");
            }

            console.log("captureOrder amount", amount);
            console.log("captureOrder amountOfLicenses", amountOfLicenses);
            console.log("captureOrder invoiceId", invoiceId);
            console.log("captureOrder email", email);

            const licenses = generateLicenses(amountOfLicenses, invoiceId);

            console.log("licenses", licenses);
            // Use Prisma's $transaction to batch add licenses
            const transactions = licenses.map((license) => {
                return prisma.license.create({
                    data: {
                        licenseKey: license.licenseKey,
                        invoiceId: license.invoiceId,
                        email: email,

                    }
                });
            });

            console.log("transactions", transactions);

            await prisma.$transaction(transactions);


        })
});

function generateLicenses(amountOfLicenses: number, invoiceId: string) {
    const licenses = [];
    for (let i = 0; i < amountOfLicenses; i++) {
        const license = {
            licenseKey: invoiceId + "-" + i.toString(),
            invoiceId,
        };
        licenses.push(license);
    }
    return licenses;
}
