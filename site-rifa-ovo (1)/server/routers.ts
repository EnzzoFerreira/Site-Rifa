import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createRifaReservation, getRifaReservations, getReservedNumbers, updateReservationPaymentStatus, createRifaPayment, getRifaPayments } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  rifa: router({
    // Get all reserved numbers
    getReservedNumbers: publicProcedure.query(async () => {
      return getReservedNumbers();
    }),

    // Get all reservations (for admin dashboard)
    getReservations: publicProcedure.query(async () => {
      return getRifaReservations();
    }),

    // Create a new reservation
    createReservation: publicProcedure
      .input(z.object({
        number: z.number().min(1).max(200),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        pixKey: z.string().min(1),
        paymentAmount: z.number().min(1000), // Minimo R$ 10,00 (em centavos)
      }))
      .mutation(async ({ input }) => {
        const reservation = await createRifaReservation({
          number: input.number,
          name: input.name,
          email: input.email,
          phone: input.phone,
          pixKey: input.pixKey,
          paymentStatus: "confirmed", // Mudar para confirmed para aparecer imediatamente
          paymentAmount: input.paymentAmount,
        });
        return reservation;
      }),

    // Confirm payment for a reservation (deprecated - payment is now confirmed on creation)
    confirmPayment: publicProcedure
      .input(z.object({
        reservationId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await updateReservationPaymentStatus(input.reservationId, "confirmed");
        return { success: true };
      }),

    // Get all payments (for admin dashboard)
    getPayments: publicProcedure.query(async () => {
      return getRifaPayments();
    }),
  }),
});

export type AppRouter = typeof appRouter;
