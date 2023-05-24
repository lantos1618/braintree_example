import { NextPage } from "next";
import { useCallback, useEffect, useRef, useState } from "react";
import braintree from "braintree-web-drop-in";
import { api } from "~/utils/api";
import dynamic from "next/dynamic";
import CardComponent from "~/components/CardComponent";


// const DynamicCardComponent = dynamic(() => import("~/components/CardComponent"), { ssr: false });

const PaymentPage: NextPage = () => {


    return (
        <div>
            <div className="flex flex-col justify-center items-center p-10">
                <div className="flex flex-col justify-center bg-white rounded-md">
                    <CardComponent  />
                </div>
            </div>
        </div>
    );
}

export default PaymentPage;
