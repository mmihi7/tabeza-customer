// utils.js
export const placeholder = true;

export function validateMpesaPhoneNumber(phone) {
  // Basic M-Pesa phone number validation (Kenya)
  const phoneRegex = /^(?:\+254|0)?(7|1)[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function formatPhoneNumberInput(phone) {
  // Format phone number input
  return phone.replace(/\s/g, '').replace(/^\+254/, '0').replace(/^0/, '+254');
}

export function getPhoneNumberGuidance(phone) {
  if (!phone) return 'Please enter a phone number';
  if (phone.length < 10) return 'Phone number too short';
  if (!validateMpesaPhoneNumber(phone)) return 'Please enter a valid M-Pesa number';
  return '';
}

export function getNetworkProvider(phone) {
  if (phone.startsWith('07') || phone.startsWith('+2547')) return 'Safaricom';
  if (phone.startsWith('01') || phone.startsWith('+2541')) return 'Airtel';
  if (phone.startsWith('075') || phone.startsWith('+25475')) return 'Telkom';
  return 'Unknown';
}
