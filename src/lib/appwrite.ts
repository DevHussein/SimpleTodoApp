import { Account, Client, Databases } from 'react-native-appwrite';
import { appwriteConfig } from '../config/appwriteConfig';

const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

if (appwriteConfig.realtimeEndpoint) {
  client.setEndpointRealtime(appwriteConfig.realtimeEndpoint);
}

export const appwriteClient = client;

export const appwriteAccount = new Account(appwriteClient);
export const appwriteDatabases = new Databases(appwriteClient);
