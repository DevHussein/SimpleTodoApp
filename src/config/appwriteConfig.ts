import {
  APPWRITE_DATABASE_ID,
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_REALTIME_ENDPOINT,
  APPWRITE_TODOS_COLLECTION_ID,
} from '@env';

export type AppwriteConfig = {
  endpoint: string;
  realtimeEndpoint: string | null;
  projectId: string;
  databaseId: string;
  todosCollectionId: string;
};

const endpoint = APPWRITE_ENDPOINT ?? 'https://fra.cloud.appwrite.io/v1';
const realtimeEndpoint = APPWRITE_REALTIME_ENDPOINT?.trim() || null;

export const appwriteConfig: AppwriteConfig = {
  endpoint,
  realtimeEndpoint,
  projectId: APPWRITE_PROJECT_ID ?? '',
  databaseId: APPWRITE_DATABASE_ID ?? '',
  todosCollectionId: APPWRITE_TODOS_COLLECTION_ID ?? 'todos',
};

export const isAppwriteConfigured = (): boolean => {
  return (
    appwriteConfig.endpoint.length > 0 &&
    appwriteConfig.projectId.length > 0 &&
    appwriteConfig.databaseId.length > 0 &&
    appwriteConfig.todosCollectionId.length > 0 &&
    !Object.values(appwriteConfig).some(value => value.startsWith('YOUR_'))
  );
};
