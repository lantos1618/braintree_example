import { env } from "~/env.mjs";

import braintree from 'braintree';


const getBraintreeGateway = () => {
    const gateway = new braintree.BraintreeGateway({
        environment: env.NODE_ENV === 'production' ? braintree.Environment.Production : braintree.Environment.Sandbox,
        merchantId: env.BRAINTREE_MERCHANT_ID,
        publicKey: env.NEXT_PUBLIC_BRAINTREE_PUBLIC_KEY,
        privateKey: env.BRAINTREE_PRIVATE_KEY,
      })

    return gateway;
}

export { getBraintreeGateway}