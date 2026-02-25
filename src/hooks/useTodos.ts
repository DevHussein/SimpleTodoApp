import type { InfiniteData } from "@tanstack/react-query";
import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	type CreateTodoInput,
	type ListTodosPageResult,
	todoService,
	type UpdateTodoInput,
} from "../services/todoService";
import type { Todo } from "../types/todo";

export const todoQueryKeys = {
	all: ["todos"] as const,
};

export const TODOS_PAGE_SIZE = 20;

const mapTodoPages = (
	data: InfiniteData<ListTodosPageResult> | undefined,
	mapper: (todo: Todo) => Todo,
): InfiniteData<ListTodosPageResult> | undefined => {
	if (!data) {
		return data;
	}

	return {
		...data,
		pages: data.pages.map((page) => ({
			...page,
			todos: page.todos.map(mapper),
		})),
	};
};

const filterTodoPages = (
	data: InfiniteData<ListTodosPageResult> | undefined,
	predicate: (todo: Todo) => boolean,
): InfiniteData<ListTodosPageResult> | undefined => {
	if (!data) {
		return data;
	}

	return {
		...data,
		pages: data.pages.map((page) => ({
			...page,
			todos: page.todos.filter(predicate),
		})),
	};
};

export const useTodosQuery = () => {
	return useInfiniteQuery({
		queryKey: todoQueryKeys.all,
		initialPageParam: null as string | null,
		queryFn: ({ pageParam }) =>
			todoService.listTodosPage({
				limit: TODOS_PAGE_SIZE,
				cursor: pageParam,
			}),
		getNextPageParam: (lastPage) => lastPage.nextCursor,
		staleTime: 30_000,
	});
};

export const useCreateTodoMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateTodoInput) => todoService.createTodo(input),
		onSettled: async () => {
			await queryClient.invalidateQueries({ queryKey: todoQueryKeys.all });
		},
	});
};

export const useUpdateTodoMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateTodoInput) => todoService.updateTodo(input),
		onMutate: async (input) => {
			await queryClient.cancelQueries({ queryKey: todoQueryKeys.all });

			const previousTodosData = queryClient.getQueryData<
				InfiniteData<ListTodosPageResult>
			>(todoQueryKeys.all);

			queryClient.setQueryData<InfiniteData<ListTodosPageResult>>(
				todoQueryKeys.all,
				(oldData) =>
					mapTodoPages(oldData, (todo) => {
						if (todo.id !== input.id) {
							return todo;
						}
						return {
							...todo,
							...(input.completed !== undefined && {
								completed: input.completed,
							}),
							...(input.text !== undefined && { text: input.text }),
							...(input.dueDate !== undefined && { dueDate: input.dueDate }),
						};
					}),
			);

			return { previousTodosData };
		},
		onError: (_error, _input, context) => {
			if (!context) {
				return;
			}

			queryClient.setQueryData(todoQueryKeys.all, context.previousTodosData);
		},
		onSuccess: (updatedTodo) => {
			queryClient.setQueryData<InfiniteData<ListTodosPageResult>>(
				todoQueryKeys.all,
				(oldData) =>
					mapTodoPages(oldData, (todo) =>
						todo.id === updatedTodo.id ? updatedTodo : todo,
					),
			);
		},
		onSettled: async () => {
			await queryClient.invalidateQueries({ queryKey: todoQueryKeys.all });
		},
	});
};

export const useDeleteTodoMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => todoService.deleteTodo(id),
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: todoQueryKeys.all });

			const previousTodosData = queryClient.getQueryData<
				InfiniteData<ListTodosPageResult>
			>(todoQueryKeys.all);

			queryClient.setQueryData<InfiniteData<ListTodosPageResult>>(
				todoQueryKeys.all,
				(oldData) => filterTodoPages(oldData, (todo) => todo.id !== id),
			);

			return { previousTodosData };
		},
		onError: (_error, _input, context) => {
			if (!context) {
				return;
			}

			queryClient.setQueryData(todoQueryKeys.all, context.previousTodosData);
		},
		onSettled: async () => {
			await queryClient.invalidateQueries({ queryKey: todoQueryKeys.all });
		},
	});
};
