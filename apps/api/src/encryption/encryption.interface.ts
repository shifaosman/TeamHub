export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
}

export interface EncryptionService {
  encrypt(plaintext: string, recipientId: string): Promise<EncryptedPayload>;
  decrypt(payload: EncryptedPayload, recipientId: string): Promise<string>;
}

