import { Injectable } from '@nestjs/common';
import { EncryptionService, EncryptedPayload } from './encryption.interface';

/**
 * Stub encryption service.
 *
 * IMPORTANT: This implementation does NOT provide end-to-end encryption.
 * It only offers an abstraction boundary so that real crypto and key
 * management can be plugged in later without changing message APIs.
 */
@Injectable()
export class NoopEncryptionService implements EncryptionService {
  async encrypt(plaintext: string): Promise<EncryptedPayload> {
    return {
      ciphertext: plaintext,
      iv: '',
    };
  }

  async decrypt(payload: EncryptedPayload): Promise<string> {
    return payload.ciphertext;
  }
}

