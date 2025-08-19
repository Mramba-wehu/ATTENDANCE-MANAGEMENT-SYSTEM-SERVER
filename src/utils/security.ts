import CryptoJS from 'crypto-js';
import dotEnv from 'dotenv';

dotEnv.config();

const SECRET_KEY = process.env.SECRET_KEY;

export const decrypt = (ciphertext: string) => {
  if(!SECRET_KEY) {
    throw new Error('KEY REQUIRED');
  }

  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decrypted);
};

export const encrypt = (data: any) => {
  if(!SECRET_KEY) {
    throw new Error('KEY REQUIRED');
  }

  const jsonString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
};