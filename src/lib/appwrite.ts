import { Account, Client, Databases } from 'react-native-appwrite';
import { appwriteConfig } from '../config/appwriteConfig';

export const appwriteClient = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setEndpointRealtime(appwriteConfig.realtimeEndpoint)
  .setProject(appwriteConfig.projectId);

export const appwriteAccount = new Account(appwriteClient);
export const appwriteDatabases = new Databases(appwriteClient);
