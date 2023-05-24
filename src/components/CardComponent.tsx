import { NextPage } from "next";
import { useCallback, useEffect, useRef, useState } from "react";
import braintree from "braintree-web-drop-in";
import { api } from "~/utils/api";

// Moved the loadBrainTree function outside of the component
const loadBrainTree = async (authorization: string, amount: string, container: HTMLElement) => {
    const _dropin = await braintree.create({
        authorization,
        container,
        card: {
            cardholderName: {
                required: true
            },
        },
        // paypal: {
        //     flow: "vault",
        // },
    });
    return _dropin;
}

const CardComponent: React.FC = () => {

    const clientTokenResult = api.braintree.getClientToken.useQuery({
        amountOfLicenses: 1,
    });

    const clientToken = clientTokenResult.data?.clientToken
    const amount = clientTokenResult.data?.amount

    const createTransaction = api.braintree.createTransaction.useMutation();

    const dropInRef = useRef<HTMLDivElement>(null);
    const [dropin, setDropin] = useState<braintree.Dropin | null>(null);
    const [paid, setPaid] = useState<boolean>(false);


    useEffect(() => {
        if (amount === undefined) return;
        if (clientToken === undefined) return;
        if (dropInRef.current === null) {
            console.error("dropInRef is null");
            return;
        }

        if (dropInRef.current.children.length > 0) {
            return;
        }

        console.log("loading brain tree div");
        loadBrainTree(clientToken, amount,  dropInRef.current)
            .then(_dropin => setDropin(_dropin))
            .catch(e => { throw e; })
            // .finally(() => {
            //     console.log("finally");
            // })

    }, [dropInRef, clientToken, amount]);


    const handlePayment = async () => {

        console.log("handlePayment");
        if (dropin === null) return;

        try {
            const { nonce } = await dropin.requestPaymentMethod();

            const result = await createTransaction.mutateAsync({
                amountOfLicenses: 1,
                paymentMethodNonce: nonce
            });

            setPaid(true);
            console.log("result", result);
        } catch (error) {
            console.error("Error in handlePayment:", error);
        }
    }

    return (
        <div>
            <h1>Payment</h1>
            <div className="flex flex-col justify-center items-center">
                <div className="flex flex-col justify-center ">
                    <div className="flex flex-col min-w-[450px] min-h-[300px] bg-white rounded-md">

                        {
                            //   pay button
                            paid ?
                                <div>Payment successful</div> :
                                <div className="flex flex-col min-w-[450px] min-h-[300px]">
                                    <div className={"min-w-[450px] min-h-[300px]"} ref={dropInRef} />
                                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => { void handlePayment() }}>Pay</button>
                                </div>
                        }
                    </div>


                </div>
            </div>
        </div>
    );
}

export default CardComponent;