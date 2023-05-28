import { z } from "zod";
import nodemailer from "nodemailer";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";
import { env } from "process";
import { type License } from "~/generated/prisma/client";


const getEmailHtml = (licenses: License[]) => {
  const licenseRows = licenses.map((license) => `<tr><td>${license.invoiceId}</td><td>${license.licenseKey}</td></tr>`).join('');

  return `
    <div style="background-color: #1d4ed8; padding: 2rem;">
        <div style="background-color: white; padding: 2rem; margin: auto;">
            <h1 style="text-align: center; font-size: 2rem; margin-bottom: 1rem;">Your Licenses</h1>
            <table style="width: 100%;">
                <tbody>
                    <tr>
                        <th>Invoice ID</th>
                        <th>License Key</th>
                    </tr>
                    ${licenseRows}
                </tbody>
            </table>
        </div>
    </div>
  `;
}

// simple rate limiter
// 3 emails per 5 minutes per IP and email
// 1000 emails per day total
const rateLimitEmail = new Map<string, number>();
const rateLimitIp = new Map<string, number>();
let rateLimitTotal = Array<number>();
const rateLimit = (email: string, ip: string | null) => {
  if (!ip) {
    throw new Error('No IP');
  }

  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  console.log('rateLimitEmail', rateLimitEmail);
  console.log('rateLimitIp', rateLimitIp);

  const emailCount = rateLimitEmail.get(email) || 0;
  const ipCount = rateLimitIp.get(ip) || 0;


  if (emailCount >= 3 || ipCount >= 3) {
    throw new Error('Too many requests from this IP or email address please try again in 5 minutes');
  }

  rateLimitEmail.set(email, emailCount + 1);
  rateLimitIp.set(ip, ipCount + 1);

  rateLimitTotal.push(now);

  const total = rateLimitTotal.filter((timestamp) => timestamp > oneDayAgo).length;

  if (total >= 1000) {
    throw new Error('Server: Too many total email requests');
  }

  // filter rateLimiters to only keep last 5 minutes
  rateLimitEmail.forEach((count, email) => {
    if (count > fiveMinutesAgo) {
      rateLimitEmail.delete(email);
    }
  }

  );

  rateLimitIp.forEach((count, ip) => {
    if (count > fiveMinutesAgo) {
      rateLimitIp.delete(ip);
    }
  }

  );

  // filter rateLimitTotal to only keep last 24 hours
  rateLimitTotal = rateLimitTotal.filter((timestamp) => timestamp > oneDayAgo);

}

export const licenseRouter = createTRPCRouter({
  requestLicenses: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. get the license from the database
      // 2. send an email to the user with the license key
      // 2.1 create email sender
      // 2.2 generate template
      // 2.3 send email

      rateLimit(input.email, ctx.ip);


      const licenses = await prisma.license.findMany({
        where: {
          email: input.email,
        },
      });

      if (licenses.length === 0) {
        throw new Error(`No licenses found for ${input.email}`);
      }

      const {
        EMAIL_HOST,
        EMAIL_PASSWORD,
        EMAIL_USER,
      } = env;

      if (!EMAIL_HOST || !EMAIL_PASSWORD || !EMAIL_USER) {
        throw new Error('Server: Email configuration is missing');
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
        from: `"License Team" <${EMAIL_USER}>`, // sender address
        to: input.email, // list of receivers
        subject: "Your License Keys", // Subject line
        html: getEmailHtml(licenses), // html body
      });

      console.log("Message sent: %s", info.messageId);
    }),
});
