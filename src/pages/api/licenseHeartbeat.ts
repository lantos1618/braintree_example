

// this file is used to check if the license is valid or not
// uses nextjs api routes



import { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "~/server/db";
import crypto from "crypto";
import { env } from "~/env.mjs";


const generateHash = ({ licenseKey, email, computerId, createdAt, secret }: {
    licenseKey: string,
    email: string,
    computerId: string,
    createdAt: string,
    secret: string
}) => {
    const hash = crypto.createHmac("sha256", secret)
        .update(licenseKey + email + computerId + createdAt)
        .digest("hex");
    return hash;
}

const handleLicenseHeartbeat = async (req: NextApiRequest, res: NextApiResponse) => {
    const { licenseKey, email, computerId } = req.body as { licenseKey?: string, email?: string, computerId?: string };

    if (!licenseKey) {
        return res.status(400).json({ message: "No license key" });
    }

    if (!email) {
        return res.status(400).json({ message: "No email" });
    }

    if (!computerId) {
        return res.status(400).json({ message: "No computerId" });
    }


    // check if the license is valid
    const license = await prisma.license.findUnique({
        where: {
            licenseKey: licenseKey,

        },
        include: {
            sessions: {
                orderBy: {
                    createdAt: "desc"
                },
                take: 1
            }
        }
    });

    if (!license) {
        return res.status(400).json({ message: "No license" });
    }

    if (license.email !== email) {
        return res.status(400).json({ message: "Email does not match" });
    }

    // now we need to check to see if the session is valid
    // a session is valid if the coputerId matches the computerId 
    //in the license or the most recent computerId in the license is older than grace period
    // we are only taking the first session because we are ordering by createdAt desc

    const session = license.sessions[0];

    if (!session) {
        // no session so we need to create one
        // and return the hash
        const hash = generateHash({
            licenseKey: license.licenseKey,
            email: license.email,
            computerId: computerId,
            createdAt: new Date().toISOString(),
            secret: env.LICENSE_HASH_SECRET
        });

        await prisma.licenseSession.create({
            data: {
                licenseId: license.id,
                computerId: computerId,
                hash: hash,
            }
        });

        return res.status(200).json({ message: "License is valid", hash: hash });

    }

    // if the session is older than the grace period
    // we need to create a new session and return the hash

    const gracePeriod = 1000 * 60 * 60 * 24 * 7; // 7 days
    
    const sessionCreatedAt = new Date(session.createdAt).getTime();
    const now = new Date().getTime();

    if (now - sessionCreatedAt > gracePeriod) {
        
        const hash = generateHash({
            licenseKey: license.licenseKey,
            email: license.email,
            computerId: computerId,
            createdAt: new Date().toISOString(),
            secret: env.LICENSE_HASH_SECRET
        });

        await prisma.licenseSession.create({
            data: {
                licenseId: license.id,
                computerId: computerId,
                hash: hash,
            }
        });

        return res.status(200).json({ message: "License is valid", hash: hash });
    }

    // if the session is not older than the grace period
    // we need to check if the computerId matches the session computerId
    // if it does we return the hash
    // if it does not we return an error

    if (session.computerId === computerId) {
        const hash = generateHash({
            licenseKey: license.licenseKey,
            email: license.email,
            computerId: computerId,
            createdAt: new Date().toISOString(),
            secret: env.LICENSE_HASH_SECRET
        });

        return res.status(200).json({ message: "License is valid", hash: hash });
    }

    return res.status(400).json({ message: "License is not valid" });




}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    switch (req.method) {
        // case "GET":
        //     // show the license active status
        //     return handleGet(req, res);
        case "POST":
            // update the license active status
            return handleLicenseHeartbeat(req, res);
        case "DELETE":
        // set the license active status to unused
        default:
            return res.status(405).json({ message: "Method Not Allowed" });
    }

}