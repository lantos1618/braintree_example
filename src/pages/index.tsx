import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";

import { type PayPalNamespace, loadScript } from "@paypal/paypal-js";
import { useEffect, useRef, useState } from "react";
import { env } from "~/env.mjs";
import { type Cost, getCost } from "~/server/api/routers/getCost";

const PaypalButton: React.FC<{ amountOfLicenses: number }> = ({
  amountOfLicenses
}) => {
  const [paypal, setPaypal] = useState<PayPalNamespace | null>();
  const paypalContainerRef = useRef<HTMLDivElement>(null);

  const createOrder = api.paypal.createOrder.useMutation();
  const captureOrder = api.paypal.captureOrder.useMutation();

  const amountOfLicensesRef = useRef<number>(amountOfLicenses);
  useEffect(() => {
    amountOfLicensesRef.current = amountOfLicenses;
  }, [amountOfLicenses]);

  useEffect(() => {
    loadScript({ 'client-id': env.NEXT_PUBLIC_PAYPAL_CLIENT_ID, currency: 'USD' })
      .then((paypal) => {
        setPaypal(paypal);
      })
      .catch(err => {
        console.error('Failed to load PayPal script', err);
        // Handle failure...
      });
  }, []);



  useEffect(() => {

    if (!paypal) { return }
    if (!paypal.Buttons) { return }
    if (!paypalContainerRef.current) { return }
    if (paypalContainerRef.current.hasChildNodes()) { return }

    paypal.Buttons({
      createOrder: () => {
        console.log('amountOfLicenses', amountOfLicensesRef.current);

        const response = createOrder.mutateAsync({
          amountOfLicenses: amountOfLicensesRef.current
        });

        return new Promise<string>((resolve, reject) => {
          response.then((res) => {
            resolve(res.id);
          }).catch((err) => {
            reject(err);
          });
        });
      },
      onApprove: function (data) {
        return captureOrder.mutateAsync({
          orderId: data.orderID,
        })
      },

    }).render(paypalContainerRef.current).catch(err => {
      console.error('Failed to render PayPal buttons', err);
      // Handle failure...
    })
  }, [paypal, paypalContainerRef, createOrder, captureOrder]);


  return (paypal ? <div ref={paypalContainerRef}></div> : <div>Loading...</div>)
};


const Home: NextPage = () => {

  const [amountOfLicenses, setAmountOfLicenses] = useState<number>(1);
  const [cost, setCost] = useState<Cost>(getCost(amountOfLicenses));


  useEffect(() => {
    setCost(getCost(amountOfLicenses))
  }, [amountOfLicenses])
  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <div className="w-[500px] bg-white rounded-md p-5" >
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="grid gap-4 w-3/4 p-5">
                <h5 className="text-2xl font-bold text-center">Purchase Licenses</h5>
                <div className="flex justify-between mt-4">
                  <label htmlFor="license-count" className="font-bold">Number of licenses:</label>
                  <input id="license-count" type="number" className="w-20 border border-gray-300 rounded-md p-2" defaultValue={1} onChange={(e) => setAmountOfLicenses(parseInt(e.target.value))} />
                </div>
                <div className="flex justify-between mt-4">
                  <span className="font-bold">Total cost:</span>
                  <span>${cost.amountValue}</span>
                </div>
                <div className="flex justify-between mt-4">
                  <span className="font-bold">Discount:</span>
                  <span>({Number(cost.discountPercentage) * 100}%)</span>
                </div>
              </div>

              <PaypalButton amountOfLicenses={amountOfLicenses} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
