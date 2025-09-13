export async function generateDigest(data: string) {
  const textEncoder = new TextEncoder();
  const dataBuffer = textEncoder.encode(data); // Convert string to ArrayBuffer

  const digestBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  // Convert ArrayBuffer to a hexadecimal string for display
  const digestArray = Array.from(new Uint8Array(digestBuffer));
  const hexDigest = digestArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hexDigest;
}
