import { AppwriteException, ID } from 'react-native-appwrite';
import type { Models } from 'react-native-appwrite';
import { isAppwriteConfigured } from '../config/appwriteConfig';
import { appwriteAccount, appwriteClient } from '../lib/appwrite';
import {
  signInSchema,
  signUpPayloadSchema,
  type SignInInput,
  type SignUpInput,
} from '../schemas/authSchemas';

export type AppwriteUser = Models.User<Models.Preferences>;
export type UpdateProfileInput = {
  name: string;
};

type RealtimeUnsubscribe = () => void;

const assertAppwriteConfigured = () => {
  if (!isAppwriteConfigured()) {
    throw new Error(
      'Appwrite config is missing. Update .env with your real APPWRITE_* values.'
    );
  }
};

export const authService = {
  async signUp(payload: SignUpInput): Promise<AppwriteUser> {
    assertAppwriteConfigured();
    const { name, email, password } = signUpPayloadSchema.parse(payload);

    await appwriteAccount.create(ID.unique(), email, password, name);
    await appwriteAccount.createEmailPasswordSession(email, password);
    const user = await appwriteAccount.get();
    return user as AppwriteUser;
  },

  async signIn(payload: SignInInput): Promise<AppwriteUser> {
    assertAppwriteConfigured();
    const { email, password } = signInSchema.parse(payload);

    await appwriteAccount.createEmailPasswordSession(email, password);
    const user = await appwriteAccount.get();
    return user as AppwriteUser;
  },

  async getCurrentUser(): Promise<AppwriteUser | null> {
    assertAppwriteConfigured();

    try {
      const user = await appwriteAccount.get();
      return user as AppwriteUser;
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 401) {
        return null;
      }

      throw error;
    }
  },

  subscribeToCurrentUser(onChange: () => void): RealtimeUnsubscribe {
    if (!isAppwriteConfigured()) {
      return () => {};
    }

    return appwriteClient.subscribe('account', () => {
      onChange();
    });
  },

  async updateProfile(payload: UpdateProfileInput): Promise<AppwriteUser> {
    assertAppwriteConfigured();

    const name = payload.name.trim();
    if (!name) {
      throw new Error('Name is required.');
    }

    const user = await appwriteAccount.updateName(name);
    return user as AppwriteUser;
  },

  async signOut(): Promise<void> {
    assertAppwriteConfigured();
    await appwriteAccount.deleteSession('current');
  },
};
