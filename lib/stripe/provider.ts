import "server-only";
import { unavailable, type Unavailable } from "@/lib/providers";

export interface PaymentProvider {
  createCheckout(input: {
    userId: string;
    priceId: string;
  }): Promise<Unavailable>;
  createPortal(input: { userId: string }): Promise<Unavailable>;
}
// No fake checkout URL or client-generated entitlement, even when keys exist.
export const paymentProvider: PaymentProvider = {
  async createCheckout() {
    return unavailable;
  },
  async createPortal() {
    return unavailable;
  },
};
