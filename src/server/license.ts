import { prisma } from "./db";
import { z } from "zod";

const CreateLicenseRequest = z.object({
    email: z.string().email(),
    transactionId: z.string(),
});


// create a license and add it to the database
const createLicense = async (input: z.infer<typeof CreateLicenseRequest>) => {
    // add a new entry to the database
    const { email, transactionId } = input;
    
    const license = await prisma.license.create({
        data: {
            email,
            transactionId
        }
    });
    
    return license;
    
}

