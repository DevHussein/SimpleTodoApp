import DateTimePicker from "@react-native-community/datetimepicker";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { Button, Card, Input, Label, Spinner, TextField } from "heroui-native";
import type { TFunction } from "i18next";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Alert,
	Animated,
	FlatList,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	Switch,
	Text,
	View,
} from "react-native";
import { AppwriteException } from "react-native-appwrite";
import { useLanguage } from "../hooks/useLanguage";
import { type ThemeColors, useTheme } from "../hooks/useTheme";
import {
	useDeleteTodoMutation,
	useTodosQuery,
	useUpdateTodoMutation,
} from "../hooks/useTodos";
import type { Todo } from "../types/todo";


const shouldLogPagination = __DEV__;

const logPagination = (
	message: string,
	payload?: Record<string, unknown>,
): void => {
	if (!shouldLogPagination) {
		return;
	}

	if (payload) {
		console.log(`[todoPagination] ${message}`, payload);
		return;
	}

	console.log(`[todoPagination] ${message}`);
};

type FilterKey = "all" | "active" | "completed";
type FilterIconName = "layer-group" | "clock" | "circle-check";
type SortKey =
	| "date_desc"
	| "date_asc"
	| "created_desc"
	| "created_asc"
	| "text_asc"
	| "text_desc";

const getFilters = (
	t: TFunction,
): { key: FilterKey; label: string; icon: FilterIconName }[] => [
	{ key: "all", label: t("todos.filterAll"), icon: "layer-group" },
	{ key: "active", label: t("todos.filterActive"), icon: "clock" },
	{ key: "completed", label: t("todos.filterCompleted"), icon: "circle-check" },
];

const getSorts = (
	t: TFunction,
): { key: SortKey; label: string; group: string }[] => [
	{
		key: "date_desc",
		label: t("todos.sortDueLatest"),
		group: t("todos.sortDueDate"),
	},
	{
		key: "date_asc",
		label: t("todos.sortDueSoonest"),
		group: t("todos.sortDueDate"),
	},
	{
		key: "created_desc",
		label: t("todos.sortNewestFirst"),
		group: t("todos.sortCreated"),
	},
	{
		key: "created_asc",
		label: t("todos.sortOldestFirst"),
		group: t("todos.sortCreated"),
	},
	{ key: "text_asc", label: t("todos.sortAZ"), group: t("todos.sortName") },
	{ key: "text_desc", label: t("todos.sortZA"), group: t("todos.sortName") },
];

const applyFilter = (todos: Todo[], filter: FilterKey): Todo[] => {
	switch (filter) {
		case "active":
			return todos.filter((t) => !t.completed);
		case "completed":
			return todos.filter((t) => t.completed);
		default:
			return todos;
	}
};

const applySort = (todos: Todo[], sort: SortKey): Todo[] => {
	const sorted = [...todos];
	switch (sort) {
		case "date_asc":
			return sorted.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
		case "date_desc":
			return sorted.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
		case "text_asc":
			return sorted.sort((a, b) => a.text.localeCompare(b.text));
		case "text_desc":
			return sorted.sort((a, b) => b.text.localeCompare(a.text));
		case "created_asc":
			return sorted.sort(
				(a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
			);
		case "created_desc":
			return sorted.sort(
				(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
			);
	}
};

const SHORT_MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

const SHORT_MONTHS_AR = [
	"يناير",
	"فبراير",
	"مارس",
	"أبريل",
	"مايو",
	"يونيو",
	"يوليو",
	"أغسطس",
	"سبتمبر",
	"أكتوبر",
	"نوفمبر",
	"ديسمبر",
];

const formatDueDate = (dueDate: Date, isArabic: boolean): string => {
	const months = isArabic ? SHORT_MONTHS_AR : SHORT_MONTHS;
	return `${dueDate.getDate()} ${months[dueDate.getMonth()]} ${dueDate.getFullYear()}`;
};

const formatDateInput = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const getDueDateStatus = (dueDate: Date, completed: boolean) => {
	if (completed) {
		return "completed" as const;
	}
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const due = new Date(dueDate);
	due.setHours(0, 0, 0, 0);
	const diffDays = Math.ceil(
		(due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
	);

	if (diffDays < 0) {
		return "overdue" as const;
	}
	if (diffDays <= 2) {
		return "soon" as const;
	}
	return "normal" as const;
};

const getDueDateColors = (colors: ThemeColors) =>
	({
		overdue: {
			bg: colors.dueDateOverdueBg,
			text: colors.dueDateOverdueText,
			border: colors.dueDateOverdueBorder,
		},
		soon: {
			bg: colors.dueDateSoonBg,
			text: colors.dueDateSoonText,
			border: colors.dueDateSoonBorder,
		},
		normal: {
			bg: colors.dueDateNormalBg,
			text: colors.dueDateNormalText,
			border: colors.dueDateNormalBorder,
		},
		completed: {
			bg: colors.dueDateCompletedBg,
			text: colors.dueDateCompletedText,
			border: colors.dueDateCompletedBorder,
		},
	}) as const;

type TodoItemProps = {
	item: Todo;
	onToggle: (todo: Todo) => void;
	onEdit: (todo: Todo) => void;
	onDelete: (todo: Todo) => void;
	isUpdating: boolean;
	colors: ThemeColors;
	isArabic: boolean;
	isRTL: boolean;
	t: TFunction;
};

const TodoItem = ({
	item,
	onToggle,
	onEdit,
	onDelete,
	isUpdating,
	colors,
	isArabic,
	isRTL,
	t,
}: TodoItemProps) => {
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const status = getDueDateStatus(item.dueDate, item.completed);
	const dueDateColorMap = getDueDateColors(colors);
	const chipColors = dueDateColorMap[status];
	const nextStatus = item.completed
		? t("todos.statusPending")
		: t("todos.statusCompleted");

	const handlePressIn = () => {
		Animated.spring(scaleAnim, {
			toValue: 0.97,
			friction: 8,
			tension: 200,
			useNativeDriver: true,
		}).start();
	};

	const handlePressOut = () => {
		Animated.spring(scaleAnim, {
			toValue: 1,
			friction: 6,
			tension: 100,
			useNativeDriver: true,
		}).start();
	};

	return (
		<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
			<Pressable
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				style={{
					direction: isRTL ? "rtl" : "ltr",
					borderRadius: 16,
					backgroundColor: item.completed
						? colors.cardCompletedBg
						: colors.cardBg,
					borderWidth: 1,
					borderColor: item.completed
						? colors.cardCompletedBorder
						: colors.cardBorder,
					shadowColor: colors.cardShadow,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.04,
					shadowRadius: 6,
					elevation: 2,
				}}
			>
				<View className="gap-3 p-4">
					<View className="flex-row items-start gap-3">
						<Pressable
							onPress={() => onToggle(item)}
							disabled={isUpdating}
							hitSlop={8}
							accessibilityRole="checkbox"
							accessibilityState={{ checked: item.completed }}
							accessibilityLabel={t("todos.toggleTodoA11y", {
								text: item.text,
								status: nextStatus,
							})}
						>
							<View
								style={{
									width: 26,
									height: 26,
									borderRadius: 13,
									borderWidth: 2,
									borderColor: item.completed
										? colors.accent
										: colors.checkboxBorder,
									backgroundColor: item.completed
										? colors.accent
										: "transparent",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								{item.completed ? (
									<FontAwesome6
										name="check"
										iconStyle="solid"
										size={13}
										color="#fff"
									/>
								) : null}
							</View>
						</Pressable>

						<Text
							className="flex-1 text-[15px] leading-5"
							style={[
								item.completed
									? {
											textDecorationLine: "line-through",
											color: colors.textSubtle,
										}
									: { fontWeight: "500", color: colors.textPrimary },
								{
									textAlign: isArabic ? "right" : "left",
									writingDirection: isArabic ? "rtl" : "ltr",
								},
							]}
							numberOfLines={3}
						>
							{item.text}
						</Text>

						<View className="flex-row items-center gap-2">
							<Pressable
								style={{
									width: 36,
									height: 36,
									borderRadius: 10,
									alignItems: "center",
									justifyContent: "center",
									backgroundColor: colors.editBtnBg,
								}}
								onPress={() => onEdit(item)}
								hitSlop={4}
								accessibilityRole="button"
								accessibilityLabel={t("todos.editTodoA11y", {
									text: item.text,
								})}
							>
								<FontAwesome6
									name="pen"
									iconStyle="solid"
									size={14}
									color={colors.editBtnIcon}
								/>
							</Pressable>
							<Pressable
								style={{
									width: 36,
									height: 36,
									borderRadius: 10,
									alignItems: "center",
									justifyContent: "center",
									backgroundColor: colors.deleteBtnBg,
								}}
								onPress={() => onDelete(item)}
								hitSlop={4}
								accessibilityRole="button"
								accessibilityLabel={t("todos.deleteTodoA11y", {
									text: item.text,
								})}
							>
								<FontAwesome6
									name="trash"
									iconStyle="solid"
									size={14}
									color={colors.deleteBtnIcon}
								/>
							</Pressable>
						</View>
					</View>

					<View
						className="flex-row flex-wrap items-center gap-2"
						style={{ paddingStart: 38 }}
					>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: 5,
								paddingHorizontal: 10,
								paddingVertical: 4,
								borderRadius: 20,
								borderWidth: 1,
								backgroundColor: chipColors.bg,
								borderColor: chipColors.border,
							}}
						>
							<FontAwesome6
								name="calendar"
								iconStyle="regular"
								size={11}
								color={chipColors.text}
							/>
							<Text
								style={{
									fontSize: 12,
									color: chipColors.text,
									fontWeight: "500",
								}}
							>
								{formatDueDate(item.dueDate, isArabic)}
							</Text>
						</View>

						{item.completed ? (
							<View
								className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
								style={{ backgroundColor: colors.completedBadgeBg }}
							>
								<FontAwesome6
									name="circle-check"
									iconStyle="solid"
									size={10}
									color={colors.completedBadgeText}
								/>
								<Text
									style={{
										fontSize: 11,
										color: colors.completedBadgeText,
										fontWeight: "600",
									}}
								>
									{t("todos.done")}
								</Text>
							</View>
						) : null}

						{status === "overdue" ? (
							<View
								className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
								style={{ backgroundColor: colors.overdueBadgeBg }}
							>
								<FontAwesome6
									name="triangle-exclamation"
									iconStyle="solid"
									size={10}
									color={colors.overdueBadgeText}
								/>
								<Text
									style={{
										fontSize: 11,
										color: colors.overdueBadgeText,
										fontWeight: "600",
									}}
								>
									{t("todos.outdated")}
								</Text>
							</View>
						) : null}
					</View>
				</View>
			</Pressable>
		</Animated.View>
	);
};

const TodoItemSeparator = () => <View className="h-3" />;

const TodoListScreen = () => {
	const { isDark, colors } = useTheme();
	const { language, isRTL } = useLanguage();
	const { t } = useTranslation();
	const isArabic = language === "ar";

	const FILTERS = useMemo(() => getFilters(t), [t]);
	const SORTS = useMemo(() => getSorts(t), [t]);

	const {
		data,
		error,
		isPending,
		isRefetching,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		refetch,
	} = useTodosQuery();

	const { mutateAsync: updateTodo, isPending: isUpdatingTodo } =
		useUpdateTodoMutation();
	const { mutateAsync: deleteTodo, isPending: isDeletingTodo } =
		useDeleteTodoMutation();

	const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
	const [activeSort, setActiveSort] = useState<SortKey>("date_desc");
	const [isSortOpen, setIsSortOpen] = useState(false);

	const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
	const [editText, setEditText] = useState("");
	const [editDueDate, setEditDueDate] = useState(new Date());
	const [showEditDatePicker, setShowEditDatePicker] = useState(false);
	const [editCompleted, setEditCompleted] = useState(false);
	const [editValidationError, setEditValidationError] = useState<string | null>(
		null,
	);
	const [isSavingEdit, setIsSavingEdit] = useState(false);
	const hasUserScrolledRef = useRef(false);
	const onEndReachedEventRef = useRef(0);
	const scrollFetchCallRef = useRef(0);

	const handleScroll = useCallback(() => {
		if (!hasUserScrolledRef.current) {
			hasUserScrolledRef.current = true;
			logPagination("user scrolled — pagination enabled");
		}
	}, []);

	const allTodos = useMemo(() => {
		const dedupedTodos: Todo[] = [];
		const seenTodoIds = new Set<string>();

		for (const page of data?.pages ?? []) {
			for (const todo of page.todos) {
				if (seenTodoIds.has(todo.id)) {
					continue;
				}
				seenTodoIds.add(todo.id);
				dedupedTodos.push(todo);
			}
		}

		return dedupedTodos;
	}, [data]);

	const completedCount = useMemo(
		() => allTodos.filter((t) => t.completed).length,
		[allTodos],
	);

	const todos = useMemo(() => {
		return applySort(applyFilter(allTodos, activeFilter), activeSort);
	}, [allTodos, activeFilter, activeSort]);

	const activeSortLabel = SORTS.find((s) => s.key === activeSort)?.label ?? "";

	const errorMessage = useMemo(() => {
		if (!error) {
			return null;
		}
		if (error instanceof AppwriteException) {
			return error.message;
		}
		return t("todos.loadError");
	}, [error, t]);

	const handleToggleTodo = useCallback(
		async (todo: Todo) => {
			await updateTodo({ id: todo.id, completed: !todo.completed });
		},
		[updateTodo],
	);

	const handleEditPress = useCallback((todo: Todo) => {
		setEditingTodo(todo);
		setEditText(todo.text);
		setEditDueDate(new Date(todo.dueDate));
		setShowEditDatePicker(false);
		setEditCompleted(todo.completed);
		setEditValidationError(null);
	}, []);

	const handleEditDateChange = (_event: unknown, selectedDate?: Date) => {
		if (Platform.OS === "android") {
			setShowEditDatePicker(false);
		}
		if (selectedDate) {
			setEditDueDate(selectedDate);
		}
	};

	const handleDeletePress = useCallback(
		(todo: Todo) => {
			Alert.alert(
				t("deleteDialog.title"),
				t("deleteDialog.message", { text: todo.text }),
				[
					{ text: t("common.cancel"), style: "cancel" },
					{
						text: t("common.delete"),
						style: "destructive",
						onPress: () => {
							deleteTodo(todo.id);
						},
					},
				],
			);
		},
		[deleteTodo, t],
	);

	const handleSaveEdit = async () => {
		if (!editingTodo) {
			return;
		}

		const trimmedText = editText.trim();
		if (!trimmedText) {
			setEditValidationError(t("todoForm.taskRequired"));
			return;
		}

		setEditValidationError(null);
		setIsSavingEdit(true);

		try {
			await updateTodo({
				id: editingTodo.id,
				text: trimmedText,
				completed: editCompleted,
				dueDate: editDueDate,
			});
			setEditingTodo(null);
		} catch (e) {
			const msg =
				e instanceof AppwriteException ? e.message : t("todoForm.updateError");
			setEditValidationError(msg);
		} finally {
			setIsSavingEdit(false);
		}
	};

	const closeEditModal = () => {
		if (!isSavingEdit) {
			setShowEditDatePicker(false);
			setEditingTodo(null);
		}
	};

	const handleLoadMore = useCallback(
		(distanceFromEnd?: number) => {
			const endReachedEventId = ++onEndReachedEventRef.current;

			if (!hasUserScrolledRef.current) {
				logPagination("onEndReached ignored — user has not scrolled yet", {
					endReachedEventId,
				});
				return;
			}

			logPagination("onEndReached", {
				endReachedEventId,
				distanceFromEnd:
					typeof distanceFromEnd === "number"
						? Number(distanceFromEnd.toFixed(2))
						: null,
				hasNextPage: Boolean(hasNextPage),
				isFetchingNextPage,
				isRefetching,
				loadedTodos: allTodos.length,
				visibleTodos: todos.length,
			});

			if (!hasNextPage || isFetchingNextPage || isRefetching) {
				logPagination("fetchNextPage skipped", {
					endReachedEventId,
					reason: !hasNextPage
						? "no_next_page"
						: isFetchingNextPage
							? "already_fetching_next_page"
							: "is_refetching",
				});
				return;
			}

			const scrollFetchCallId = ++scrollFetchCallRef.current;
			logPagination("fetchNextPage start", {
				endReachedEventId,
				scrollFetchCallId,
			});
			fetchNextPage()
				.then((result) => {
					const pages = result.data?.pages ?? [];
					const lastPage = pages[pages.length - 1];
					logPagination("fetchNextPage success", {
						endReachedEventId,
						scrollFetchCallId,
						pagesLoaded: pages.length,
						lastPageTodos: lastPage?.todos.length ?? 0,
						nextCursor: lastPage?.nextCursor ?? null,
					});
				})
				.catch((fetchError: unknown) => {
					logPagination("fetchNextPage error", {
						endReachedEventId,
						scrollFetchCallId,
						error:
							fetchError instanceof Error
								? fetchError.message
								: String(fetchError),
					});
				});
		},
		[
			allTodos.length,
			fetchNextPage,
			hasNextPage,
			isFetchingNextPage,
			isRefetching,
			todos.length,
		],
	);

	const renderItem = useCallback(
		({ item }: { item: Todo }) => (
			<TodoItem
				item={item}
				onToggle={handleToggleTodo}
				onEdit={handleEditPress}
				onDelete={handleDeletePress}
				isUpdating={isUpdatingTodo || isDeletingTodo}
				colors={colors}
				isArabic={isArabic}
				isRTL={isRTL}
				t={t}
			/>
		),
		[
			handleToggleTodo,
			handleEditPress,
			handleDeletePress,
			isUpdatingTodo,
			isDeletingTodo,
			colors,
			isArabic,
			isRTL,
			t,
		],
	);

	if (isPending) {
		return (
			<View
				className="flex-1 items-center justify-center gap-3 px-5"
				style={{
					backgroundColor: colors.background,
					direction: isRTL ? "rtl" : "ltr",
				}}
			>
				<Spinner size="lg" />
				<Text
					style={{
						fontSize: 16,
						color: colors.textMuted,
						textAlign: "center",
						writingDirection: isRTL ? "rtl" : "ltr",
					}}
				>
					{t("todos.loadingTodos")}
				</Text>
			</View>
		);
	}

	return (
		<View
			className="flex-1 px-4 pt-4"
			style={{
				backgroundColor: colors.background,
				direction: isRTL ? "rtl" : "ltr",
			}}
		>
			<View className="mb-3 flex-row items-center justify-between">
				<View className="gap-0.5">
					<Text
						style={{
							fontSize: 24,
							fontWeight: "700",
							color: colors.textPrimary,
						}}
					>
						{t("todos.myTodos")}
					</Text>
					{allTodos.length > 0 ? (
						<Text style={{ fontSize: 12, color: colors.textMuted }}>
							{t("todos.completedCount", {
								completed: completedCount,
								total: allTodos.length,
							})}
						</Text>
					) : null}
				</View>
				<Button
					variant="ghost"
					size="sm"
					onPress={() => refetch()}
					isDisabled={isRefetching}
				>
					{isRefetching && !isRTL ? (
						<Spinner size="sm" style={{ marginEnd: 8 }} />
					) : null}
					<Button.Label style={{ color: colors.accent }}>
						{isRefetching ? t("todos.refreshing") : t("todos.refresh")}
					</Button.Label>
					{isRefetching && isRTL ? (
						<Spinner size="sm" style={{ marginStart: 8 }} />
					) : null}
				</Button>
			</View>

			{allTodos.length > 0 ? (
				<View
					className="mb-3 overflow-hidden rounded-xl"
					style={{ backgroundColor: colors.progressBarBg }}
				>
					<View
						style={{
							height: 4,
							width: `${allTodos.length > 0 ? (completedCount / allTodos.length) * 100 : 0}%`,
							backgroundColor: colors.accent,
							borderRadius: 2,
						}}
					/>
				</View>
			) : null}

			<View className="mb-3 flex-row items-center gap-2">
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ gap: 8, paddingEnd: 8 }}
					className="flex-1"
				>
					{FILTERS.map((f) => (
						<Pressable
							key={f.key}
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: 6,
								paddingHorizontal: 14,
								paddingVertical: 8,
								borderRadius: 20,
								borderWidth: 1,
								borderColor:
									activeFilter === f.key
										? colors.accent
										: colors.filterChipBorder,
								backgroundColor:
									activeFilter === f.key ? colors.accent : colors.filterChipBg,
							}}
							onPress={() => setActiveFilter(f.key)}
							accessibilityRole="button"
							accessibilityState={{ selected: activeFilter === f.key }}
						>
							<FontAwesome6
								name={f.icon}
								iconStyle="solid"
								size={12}
								color={
									activeFilter === f.key
										? "#fff"
										: colors.filterChipInactiveIcon
								}
							/>
							<Text
								style={{
									fontSize: 13,
									fontWeight: "600",
									color:
										activeFilter === f.key
											? "#fff"
											: colors.filterChipInactiveText,
								}}
							>
								{f.label}
							</Text>
						</Pressable>
					))}
				</ScrollView>

				<Pressable
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 6,
						paddingHorizontal: 12,
						paddingVertical: 7,
						borderRadius: 10,
						borderWidth: 1,
						borderColor: colors.sortButtonBorder,
						backgroundColor: colors.sortButtonBg,
					}}
					onPress={() => setIsSortOpen(true)}
					accessibilityRole="button"
					accessibilityLabel={t("todos.changeSortOrder")}
				>
					<FontAwesome6
						name="arrow-down-short-wide"
						iconStyle="solid"
						size={13}
						color={colors.textMuted}
					/>
					<Text
						style={{
							fontSize: 13,
							fontWeight: "500",
							color: colors.textSecondary,
						}}
					>
						{activeSortLabel}
					</Text>
				</Pressable>
			</View>

			{errorMessage ? (
				<View
					className="mb-4 rounded-xl px-3 py-2"
					style={{
						borderWidth: 1,
						borderColor: colors.errorBorder,
						backgroundColor: colors.errorBg,
					}}
				>
					<Text style={{ fontSize: 14, color: colors.errorIconColor }}>
						{errorMessage}
					</Text>
				</View>
			) : null}

			<FlatList
				data={todos}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ paddingBottom: 132 }}
				ItemSeparatorComponent={TodoItemSeparator}
				onScrollBeginDrag={handleScroll}
				onEndReached={(info) => handleLoadMore(info.distanceFromEnd)}
				onEndReachedThreshold={0.35}
				renderItem={renderItem}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={
					<View
						className="items-center justify-center gap-3 rounded-2xl px-6 py-14"
						style={{
							borderWidth: 1,
							borderStyle: "dashed",
							borderColor: colors.borderMedium,
						}}
					>
						<FontAwesome6
							name={activeFilter === "all" ? "clipboard-list" : "filter"}
							iconStyle="solid"
							size={40}
							color={colors.emptyIcon}
						/>
						<Text
							style={{
								textAlign: "center",
								fontSize: 16,
								color: colors.textMuted,
							}}
						>
							{activeFilter === "all"
								? t("todos.emptyAll")
								: t("todos.emptyFiltered")}
						</Text>
						{activeFilter !== "all" ? (
							<Pressable onPress={() => setActiveFilter("all")}>
								<Text
									style={{
										fontSize: 14,
										fontWeight: "600",
										color: colors.accent,
									}}
								>
									{t("todos.showAllTasks")}
								</Text>
							</Pressable>
						) : null}
					</View>
				}
				ListFooterComponent={
					isFetchingNextPage ? (
						<View className="items-center justify-center py-4">
							<Spinner size="sm" />
						</View>
					) : null
				}
			/>

			{/* Sort Modal */}
			<Modal
				animationType="fade"
				transparent
				visible={isSortOpen}
				onRequestClose={() => setIsSortOpen(false)}
			>
				<Pressable
					className="flex-1 justify-end bg-black/40"
					onPress={() => setIsSortOpen(false)}
				>
					<Pressable>
						<View
							style={{
								marginHorizontal: 16,
								marginBottom: 32,
								borderRadius: 16,
								backgroundColor: colors.sortModalBg,
								overflow: "hidden",
								borderWidth: 1,
								borderColor: colors.sortModalBorder,
								direction: isRTL ? "rtl" : "ltr",
							}}
						>
							<View className="px-4 pb-2 pt-4 self-start">
								<Text
									style={{
										fontSize: 16,
										fontWeight: "700",
										color: colors.sortHeaderText,
									}}
								>
									{t("todos.sortBy")}
								</Text>
							</View>
							{(() => {
								let lastGroup = "";
								return SORTS.map((s, i) => {
									const showGroup = s.group !== lastGroup;
									lastGroup = s.group;
									return (
										<View key={s.key}>
											{showGroup ? (
												<View className="flex-row items-center gap-2 px-4 pb-1 pt-3">
													<FontAwesome6
														name={
															s.group === t("todos.sortDueDate")
																? "calendar"
																: s.group === t("todos.sortCreated")
																	? "clock"
																	: "arrow-down-a-z"
														}
														iconStyle="solid"
														size={11}
														color={colors.sortGroupText}
													/>
													<Text
														style={{
															fontSize: 11,
															fontWeight: "600",
															color: colors.sortGroupText,
															textTransform: "uppercase",
															letterSpacing: 0.5,
														}}
													>
														{s.group}
													</Text>
												</View>
											) : null}
											<Pressable
												style={{
													paddingHorizontal: 16,
													paddingVertical: 12,
													borderBottomWidth: i === SORTS.length - 1 ? 0 : 1,
													borderBottomColor: colors.sortOptionBorder,
													backgroundColor:
														activeSort === s.key
															? colors.sortOptionActiveBg
															: "transparent",
												}}
												onPress={() => {
													setActiveSort(s.key);
													setIsSortOpen(false);
												}}
											>
												<View className="flex-row items-center justify-between">
													<Text
														style={{
															fontSize: 15,
															fontWeight: activeSort === s.key ? "600" : "400",
															color:
																activeSort === s.key
																	? colors.accent
																	: colors.sortOptionText,
														}}
													>
														{s.label}
													</Text>
													{activeSort === s.key ? (
														<FontAwesome6
															name="check"
															iconStyle="solid"
															size={14}
															color={colors.accent}
														/>
													) : null}
												</View>
											</Pressable>
										</View>
									);
								});
							})()}
						</View>
					</Pressable>
				</Pressable>
			</Modal>

			{/* Edit Modal */}
			<Modal
				animationType="fade"
				transparent
				visible={editingTodo !== null}
				onRequestClose={closeEditModal}
			>
				<KeyboardAvoidingView
					className="flex-1 justify-end bg-black/40"
					behavior={Platform.OS === "ios" ? "padding" : undefined}
				>
					<Pressable className="absolute inset-0" onPress={closeEditModal} />

					<View
						className="px-4 pb-6"
						style={{ direction: isRTL ? "rtl" : "ltr" }}
					>
						<Card
							className="w-full self-center p-5"
							style={{
								borderWidth: 1,
								borderColor: colors.modalBorder,
								borderRadius: 20,
								backgroundColor: colors.modalBg,
								shadowColor: colors.modalShadowColor,
								shadowOffset: { width: 0, height: 8 },
								shadowOpacity: isDark ? 0.4 : 0.1,
								shadowRadius: 16,
								elevation: 6,
							}}
						>
							<Card.Header className="mb-4 gap-1">
								<Card.Title
									className={`text-2xl font-semibold self-start`}
									style={{ color: colors.textPrimary }}
								>
									{t("todoForm.editTask")}
								</Card.Title>
								<Card.Description
									className="self-start"
									style={{ color: colors.textMuted, textAlign: isRTL ? "right" : "left" }}
								>
									{t("todoForm.editTaskSubtitle")}
								</Card.Description>
							</Card.Header>

							<Card.Body className="gap-4">
								<TextField isRequired>
									<Label className="self-start">
										<Label.Text style={{ color: colors.textPrimary }}>{t("todoForm.taskLabel")}</Label.Text>
									</Label>
									<Input
										className={`focus:border-purple-600 focus:ring-purple-500 ${isRTL ? "text-right" : "text-left"}`}
										value={editText}
										onChangeText={setEditText}
										cursorColor={colors.accent}
										selectionColor={colors.accentLight}
										placeholder={t("todoForm.taskPlaceholder")}
										placeholderTextColor={colors.textSubtle}
										autoCapitalize="sentences"
										autoCorrect
										returnKeyType="next"
										textAlign={isRTL ? "right" : "left"}
										style={{
											color: colors.textPrimary,
											backgroundColor: colors.fieldBg,
											borderWidth: 1,
											borderColor: colors.fieldBorder,
										}}
									/>
								</TextField>

								<View>
									<Label className="self-start mb-1.5">
										<Label.Text style={{ color: colors.textPrimary }}>{t("todoForm.dueDate")}</Label.Text>
									</Label>
									{Platform.OS === "ios" ? (
										<DateTimePicker
											value={editDueDate}
											mode="date"
											display="compact"
											onChange={handleEditDateChange}
											accentColor={colors.accent}
											themeVariant={isDark ? "dark" : "light"}
											style={{ alignSelf: "flex-start" }}
										/>
									) : (
										<>
											<Pressable
												onPress={() => setShowEditDatePicker(true)}
												style={{
													flexDirection: "row",
													alignItems: "center",
													borderRadius: 12,
													borderWidth: 1,
													borderColor: colors.fieldBorder,
													backgroundColor: colors.fieldBg,
													paddingHorizontal: 12,
													paddingVertical: 12,
												}}
												disabled={isSavingEdit}
											>
												<FontAwesome6
													iconStyle="solid"
													name="calendar"
													size={14}
													color={colors.accent}
													style={{ marginEnd: 8 }}
												/>
												<Text
													style={{
														fontSize: 14,
														color: colors.textSecondary,
													}}
												>
													{formatDateInput(editDueDate)}
												</Text>
											</Pressable>
											{showEditDatePicker && (
												<DateTimePicker
													value={editDueDate}
													mode="date"
													display="default"
													onChange={handleEditDateChange}
												/>
											)}
										</>
									)}
								</View>

								<View
									className="flex-row items-center justify-between rounded-xl px-3 py-3"
									style={{ backgroundColor: colors.surfaceSecondary }}
								>
									<Text
										style={{
											fontSize: 14,
											color: colors.textSecondary,
										}}
									>
										{t("common.completed")}
									</Text>
									<Switch
										value={editCompleted}
										onValueChange={setEditCompleted}
										disabled={isSavingEdit}
										accessibilityLabel={t("todoForm.markCompleted")}
										trackColor={{
											false: colors.switchTrackOff,
											true: colors.accentLight,
										}}
										thumbColor={
											editCompleted ? colors.accent : colors.switchThumbOff
										}
									/>
								</View>

								{editValidationError ? (
									<View
										className="rounded-xl px-3 py-2"
										style={{
											borderWidth: 1,
											borderColor: colors.errorBorder,
											backgroundColor: colors.errorBg,
										}}
									>
										<Text
											style={{
												fontSize: 14,
												color: colors.errorIconColor,
											}}
										>
											{editValidationError}
										</Text>
									</View>
								) : null}
							</Card.Body>

							<Card.Footer className="gap-3" style={{ marginTop: 24 }}>
								<Button
									variant="ghost"
									onPress={closeEditModal}
									isDisabled={isSavingEdit}
								>
									<Button.Label style={{ color: colors.accent }}>
										{t("common.cancel")}
									</Button.Label>
								</Button>

								<Button
									onPress={handleSaveEdit}
									isDisabled={isSavingEdit}
									style={{ backgroundColor: colors.accent }}
								>
									{isSavingEdit && !isRTL ? (
										<Spinner size="sm" style={{ marginEnd: 8 }} />
									) : null}
									<Button.Label style={{ color: colors.accentForeground }}>
										{isSavingEdit
											? t("todoForm.savingChanges")
											: t("todoForm.saveChanges")}
									</Button.Label>
									{isSavingEdit && isRTL ? (
										<Spinner size="sm" style={{ marginStart: 8 }} />
									) : null}
								</Button>
							</Card.Footer>
						</Card>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</View>
	);
};

export default TodoListScreen;
