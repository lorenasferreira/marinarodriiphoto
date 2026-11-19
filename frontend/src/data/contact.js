// Verified existing production contact. No email address has been confirmed.
export const contact = Object.freeze({ whatsappNumber: "34654926645", email: null });
export function whatsappUrl(message) {
  return `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
