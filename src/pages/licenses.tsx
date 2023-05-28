import { type NextPage } from "next";
import { useRef, useState } from "react";
import { z } from "zod";

import { api } from "~/utils/api"

const LicensePage: NextPage = () => {
    const requestLicense = api.license.requestLicenses.useMutation();
    const [emailInput, setEmailInput] = useState<string>();
    const emailInputRef = useRef<HTMLInputElement>(null);
    const [errorMessage, setErrorMessage] = useState<string>();
    const [successMessage, setSuccessMessage] = useState<string>();

    const validateEmail = (email: string | undefined) => {
        try {
            return z.string().email().parse(email);
        } catch (err) {
            // set a warning message
            if (emailInputRef.current) {
                emailInputRef.current.setCustomValidity('Please enter a valid email address, example: "james@gmail.com"');
                emailInputRef.current.reportValidity();
            }
        }
    }


    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2 gap-5">
            <h1>License</h1>
            <p>
                this page lets you requests your licenses to be sent to your email
            </p>
            <input
                className="border border-gray-300 rounded-md p-2"
                ref={emailInputRef}
                type="email"
                onChange={(e) => setEmailInput(e.target.value)}
            />
            {
                errorMessage && <p className="text-red-500">{errorMessage}</p>
            }
            {
                successMessage && <p className="text-green-500">{successMessage}</p>
            }
            <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => {
                    const email = validateEmail(emailInput);
                    if (!email) return;
                    requestLicense.mutate({
                        email
                    }, {
                        onError: (err) => {
                            setErrorMessage(err.message);
                        },
                        onSuccess: () => {
                            setErrorMessage(undefined);
                            setSuccessMessage('Success! Check your email for your licenses');
                        }
                    })
                }}>Request Licenses</button>
        </div>
    );
};

export default LicensePage;
