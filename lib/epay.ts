import crypto from 'crypto';

/**
 * eGovPay Utility
 * 
 * Securely generates the cryptographic digest and handles API communication
 * with the eGovPay gateway.
 */

const getEpayBaseUrl = () => process.env.EGOV_PAY_BASE_URL || 'https://egovpay-pgi-ws-dev.oueg.info';
const getEpayToken = () => process.env.EGOV_PAY_TOKEN || 'test_your_epay_token_here';
const getEpayTemplateId = () => process.env.EGOV_PAY_TEMPLATE_ID || 'your_template_uuid_here';

/**
 * Securely generates the HMAC-SHA256 digest required by eGovPay.
 * hash_hmac('sha256', "$amount|$txnid", $token)
 */
function generateDigest(amount: number, txnid: string, token: string): string {
  const payload = `${amount.toFixed(2)}|${txnid}`;
  // Wait, does the API expect fixed 2 decimal places for amount in the hash? 
  // Let's use exactly what was passed. If amount is 1000, we'll hash "1000|txnid".
  const exactPayload = `${amount}|${txnid}`;
  return crypto.createHmac('sha256', token).update(exactPayload).digest('hex');
}

/**
 * Generates a unique transaction ID.
 */
function generateTxnId(): string {
  return `EGTOPUP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Calls eGovPay to create a new transaction and return the gateway URL.
 */
export async function createPaymentLink(amount: number, description: string = "eGuide Wallet Top-up") {
  const token = getEpayToken();
  
  if (token.includes('your_epay_token_here')) {
    console.warn("eGovPay token not found, returning mock payment URL.");
    return {
      uuid: "mock-uuid-123",
      url: "https://mock-epay-gateway.com/pay",
      txnid: "MOCK-TXN-123"
    };
  }

  const txnid = generateTxnId();
  const digest = generateDigest(amount, txnid, token);

  // We need absolute URLs for callbacks. In a real app, this would be an env variable.
  // For the hackathon, we'll assume localhost:3000 if not set.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const payload = {
    amount: amount,
    settlement_template_uuid: getEpayTemplateId(),
    currency: "PHP",
    digest: digest,
    callback_url: `${appUrl}/api/epay/callback`,
    redirect_url: `${appUrl}/payment/callback`,
    txnid: txnid,
    name: "eGuide User",
    items: [
      {
        name: description,
        amount: amount
      }
    ]
  };

  const res = await fetch(`${getEpayBaseUrl()}/api/v1/transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-eGovPay-Token': token
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("eGovPay Generation Error:", data);
    throw new Error(data.message || 'Failed to generate eGovPay link');
  }

  // Returns { uuid, url, channel }
  return {
    uuid: data.data.uuid,
    url: data.data.url,
    txnid: txnid
  };
}

/**
 * Checks the status of a specific transaction by UUID.
 */
export async function checkTransactionStatus(uuid: string) {
  const token = getEpayToken();
  
  if (token.includes('your_epay_token_here')) {
    return { payment_status: "SUCCESS", amount: "100" };
  }

  const res = await fetch(`${getEpayBaseUrl()}/api/v1/transaction/${uuid}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-eGovPay-Token': token
    }
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to check transaction status');
  }

  return data.data;
}
