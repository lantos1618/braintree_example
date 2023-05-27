import { z } from "zod";
import nodemailer from "nodemailer";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";
import { env } from "process";


const getEmailHtml = (licenses: string[]) => {
  const licenseRows = licenses.map((license) => `<tr><td>${license}</td></tr>`).join('');

  return `
    <div style="background-color: #1d4ed8; padding: 2rem;">
        <div style="background-color: white; padding: 2rem; margin: auto; width: 50%;">
            <h1 style="text-align: center; font-size: 2rem; margin-bottom: 1rem;">Your Licenses</h1>
            <table style="width: 100%;">
                <tbody>
                    ${licenseRows}
                </tbody>
            </table>
        </div>
    </div>
  `;
}
export const licenseRouter = createTRPCRouter({
  requestLicense: publicProcedure.input(z.object({
    email: z.string().email(),
  })).query(async ({ input }) => {
    // 1. get the license from the database
    // 2. send an email to the user with the license key
    // 2.1 create email sender
    // 2.2 generate template
    // 2.3 send email

    const licenses = await prisma.license.findMany({
      where: {
        email: input.email,
      },
    });

    const {
      EMAIL_HOST,
      EMAIL_PASSWORD,
      EMAIL_USER,
    } = env;

    if (!EMAIL_HOST || !EMAIL_PASSWORD || !EMAIL_USER) {
      throw new Error('Email configuration is missing');
    }

    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER, // generated ethereal user
        pass: EMAIL_PASSWORD, // generated ethereal password
      },
    });

    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"License Team" <${EMAIL_HOST}>`, // sender address
      to: input.email, // list of receivers
      subject: "Your License Keys", // Subject line
      html: getEmailHtml(licenses.map(license => license.licenseKey)), // html body
    });

    console.log("Message sent: %s", info.messageId);
  }),
});
