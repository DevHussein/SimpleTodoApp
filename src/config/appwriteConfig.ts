import {
  APPWRITE_DATABASE_ID,
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_REALTIME_ENDPOINT,
  APPWRITE_TODOS_COLLECTION_ID,
} from '@env';

export type AppwriteConfig = {
  endpoint: string;
  realtimeEndpoint: string;
  projectId: string;
  databaseId: string;
  todosCollectionId: string;
};

const getRealtimeEndpoint = (endpoint: string): string => {
  if (APPWRITE_REALTIME_ENDPOINT?.length) {
    return APPWRITE_REALTIME_ENDPOINT;
  }

  if (endpoint.startsWith('https://')) {
    return endpoint.replace('https://', 'wss://');
  }

  if (endpoint.startsWith('http://')) {
    return endpoint.replace('http://', 'ws://');
  }

  return endpoint;
};

const endpoint = APPWRITE_ENDPOINT ?? 'https://fra.cloud.appwrite.io/v1';

export const appwriteConfig: AppwriteConfig = {
  endpoint,
  realtimeEndpoint: getRealtimeEndpoint(endpoint),
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
