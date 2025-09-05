import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

class UtilityService {
  hashPassword = async (password: string) => {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  };

  validatePassword = (password: string, hashedPassword: string) => {
    return bcrypt.compare(password, hashedPassword);
  };

  getUUID() {
    return uuidv4();
  }

  generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  generateOTPExpiration = (): string => {
    return moment().add(15, 'minutes').format();
  };

  generateCookieExpiration = (): Date => {
    return moment().add(1, 'hours').toDate();
  };

  generateTokenExpiration = (): string => {
    return moment().add(1, 'hours').format();
  };

  validateOTP = async (otp: string, hashedOTP: string): Promise<boolean> => {
    return bcrypt.compare(otp, hashedOTP);
  };
}

export const UtilService = new UtilityService();
