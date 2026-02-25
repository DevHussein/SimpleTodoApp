import { ID, Query } from 'react-native-appwrite';
import type { Models } from 'react-native-appwrite';
import { appwriteConfig, isAppwriteConfigured } from '../config/appwriteConfig';
import { appwriteClient, appwriteDatabases } from '../lib/appwrite';
import type { Todo } from '../types/todo';

type TodoDocument = Models.Document & {
  text?: string;
  completed?: boolean;
  due_date?: string;
};

export type CreateTodoInput = {
  text: string;
  dueDate: Date;
  completed: boolean;
};

export type UpdateTodoInput = {
  id: string;
  text?: string;
  completed?: boolean;
  dueDate?: Date;
};

export type ListTodosPageInput = {
  limit: number;
  cursor: string | null;
};

export type ListTodosPageResult = {
  todos: Todo[];
  nextCursor: string | null;
};

type RealtimeUnsubscribe = () => void;
const shouldLogTodoApi = __DEV__;

const assertAppwriteConfigured = () => {
  if (!isAppwriteConfigured()) {
    throw new Error(
      'Appwrite config is missing. Update .env with your real APPWRITE_* values.'
    );
  }
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

const logTodoApi = (
  message: string,
  payload?: Record<string, unknown>,
): void => {
  if (!shouldLogTodoApi) {
    return;
  }

  if (payload) {
    console.log(`[todoService] ${message}`, payload);
    return;
  }

  console.log(`[todoService] ${message}`);
};
let listTodosPageRequestCounter = 0;

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseDate = (value: string): Date => {
  const normalizedValue = value.trim();

  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(normalizedValue);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);

    const normalizedDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (!Number.isNaN(normalizedDate.getTime())) {
      return normalizedDate;
    }
  }

  const parsed = new Date(normalizedValue);

  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
};

const mapDocumentToTodo = (doc: TodoDocument): Todo => {
  const dueDateSource =
    typeof doc.due_date === 'string' ? doc.due_date : doc.$createdAt;

  return {
    id: doc.$id,
    text: typeof doc.text === 'string' ? doc.text : '',
    completed: Boolean(doc.completed),
    dueDate: parseDate(dueDateSource),
    createdAt: parseDate(doc.$createdAt),
  };
};

const getTodosRealtimeChannel = (): string => {
  return `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.todosCollectionId}.documents`;
};

export const todoService = {
  subscribeToTodos(onChange: () => void): RealtimeUnsubscribe {
    if (!isAppwriteConfigured()) {
      return () => {};
    }

    logTodoApi('subscribeToTodos subscribed', {
      channel: getTodosRealtimeChannel(),
    });

    return appwriteClient.subscribe([getTodosRealtimeChannel()], () => {
      logTodoApi('subscribeToTodos event received');
      onChange();
    });
  },

  async listTodosPage(input: ListTodosPageInput): Promise<ListTodosPageResult> {
    assertAppwriteConfigured();
    const requestId = ++listTodosPageRequestCounter;
    const startedAt = Date.now();
    logTodoApi('listTodosPage request', {
      requestId,
      limit: input.limit,
      cursor: input.cursor,
    });

    const limitWithProbe = input.limit + 1;
    const queries = [
      Query.orderDesc('$createdAt'),
      Query.limit(limitWithProbe),
      ...(input.cursor ? [Query.cursorAfter(input.cursor)] : []),
    ];

    try {
      const response = await appwriteDatabases.listDocuments<TodoDocument>(
        appwriteConfig.databaseId,
        appwriteConfig.todosCollectionId,
        queries,
      );

      // Request one extra document to determine if there is another page.
      const hasMore = response.documents.length > input.limit;
      const pageDocuments = hasMore
        ? response.documents.slice(0, input.limit)
        : response.documents;
      const todos = pageDocuments.map(mapDocumentToTodo);
      const nextCursor =
        hasMore && pageDocuments.length > 0
          ? pageDocuments[pageDocuments.length - 1].$id
          : null;

      logTodoApi('listTodosPage success', {
        requestId,
        limit: input.limit,
        cursor: input.cursor,
        fetchedDocuments: response.documents.length,
        returnedTodos: todos.length,
        totalDocuments: response.total,
        nextCursor,
        durationMs: Date.now() - startedAt,
      });

      return {
        todos,
        nextCursor,
      };
    } catch (error) {
      logTodoApi('listTodosPage error', {
        requestId,
        limit: input.limit,
        cursor: input.cursor,
        durationMs: Date.now() - startedAt,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  async listTodos(): Promise<Todo[]> {
    assertAppwriteConfigured();
    const startedAt = Date.now();
    logTodoApi('listTodos request');
    const pageSize = 100;
    const todos: Todo[] = [];
    let cursor: string | null = null;

    for (;;) {
      const page = await this.listTodosPage({
        limit: pageSize,
        cursor,
      });

      todos.push(...page.todos);

      if (page.nextCursor === null) {
        break;
      }

      cursor = page.nextCursor;
    }
    const sortedTodos = todos.sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
    );
    logTodoApi('listTodos success', {
      totalTodos: sortedTodos.length,
      durationMs: Date.now() - startedAt,
    });
    return sortedTodos;
  },

  async createTodo(input: CreateTodoInput): Promise<Todo> {
    assertAppwriteConfigured();
    const startedAt = Date.now();
    logTodoApi('createTodo request', {
      textLength: input.text.trim().length,
      completed: input.completed,
      dueDate: input.dueDate.toISOString(),
    });

    const text = input.text.trim();
    if (!text) {
      throw new Error('Todo text is required.');
    }

    try {
      const doc = await appwriteDatabases.createDocument<TodoDocument>(
        appwriteConfig.databaseId,
        appwriteConfig.todosCollectionId,
        ID.unique(),
        {
          text,
          completed: input.completed,
          due_date: input.dueDate.toISOString(),
        },
      );
      logTodoApi('createTodo success', {
        id: doc.$id,
        durationMs: Date.now() - startedAt,
      });
      return mapDocumentToTodo(doc);
    } catch (error) {
      logTodoApi('createTodo error', {
        durationMs: Date.now() - startedAt,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  async updateTodo(input: UpdateTodoInput): Promise<Todo> {
    assertAppwriteConfigured();
    const startedAt = Date.now();
    logTodoApi('updateTodo request', {
      id: input.id,
      hasText: input.text !== undefined,
      hasCompleted: input.completed !== undefined,
      hasDueDate: input.dueDate !== undefined,
    });

    const data: Record<string, unknown> = {};
    if (input.completed !== undefined) {
      data.completed = input.completed;
    }
    if (input.text !== undefined) {
      const text = input.text.trim();
      if (!text) {
        throw new Error('Todo text is required.');
      }
      data.text = text;
    }
    if (input.dueDate !== undefined) {
      data.due_date = input.dueDate.toISOString();
    }

    try {
      const doc = await appwriteDatabases.updateDocument<TodoDocument>(
        appwriteConfig.databaseId,
        appwriteConfig.todosCollectionId,
        input.id,
        data,
      );

      logTodoApi('updateTodo success', {
        id: doc.$id,
        durationMs: Date.now() - startedAt,
      });
      return mapDocumentToTodo(doc);
    } catch (error) {
      logTodoApi('updateTodo error', {
        id: input.id,
        durationMs: Date.now() - startedAt,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  async deleteTodo(id: string): Promise<void> {
    assertAppwriteConfigured();
    const startedAt = Date.now();
    logTodoApi('deleteTodo request', { id });

    try {
      await appwriteDatabases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.todosCollectionId,
        id,
      );
      logTodoApi('deleteTodo success', {
        id,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      logTodoApi('deleteTodo error', {
        id,
        durationMs: Date.now() - startedAt,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },
};
