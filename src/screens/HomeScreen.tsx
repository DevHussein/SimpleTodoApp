import DateTimePicker from "@react-native-community/datetimepicker";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import {
	type BottomTabNavigationOptions,
	createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import {
	DarkTheme,
	DefaultTheme,
	NavigationContainer,
} from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, Input, Label, Spinner, TextField } from "heroui-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Animated,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	Switch,
	Text,
	View,
} from "react-native";
import { AppwriteException } from "react-native-appwrite";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authQueryKeys } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../hooks/useTheme";
import { todoQueryKeys, useCreateTodoMutation } from "../hooks/useTodos";
import { authService } from "../services/authService";
import { todoService } from "../services/todoService";
import ProfileScreen from "./ProfileScreen";
import TodoListScreen from "./TodoListScreen";

type HomeTabParamList = {
	Todos: undefined;
	Profile: undefined;
};

const Tab = createBottomTabNavigator<HomeTabParamList>();

const formatDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const HomeScreen = () => {
	const { t } = useTranslation();
	const { isDark, colors } = useTheme();
	const { isRTL } = useLanguage();
	const queryClient = useQueryClient();
	const insets = useSafeAreaInsets();
	const [isAddTodoVisible, setIsAddTodoVisible] = useState(false);
	const [todoText, setTodoText] = useState("");
	const [dueDate, setDueDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [isCompletedOnCreate, setIsCompletedOnCreate] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);

	const plusScale = useRef(new Animated.Value(1)).current;

	const {
		mutateAsync: createTodo,
		error: createTodoError,
		isPending: isCreatingTodo,
	} = useCreateTodoMutation();

	const addTodoErrorMessage = useMemo(() => {
		if (validationError) {
			return validationError;
		}

		if (!createTodoError) {
			return null;
		}

		if (createTodoError instanceof AppwriteException) {
			return createTodoError.message;
		}

		if (createTodoError instanceof Error) {
			return createTodoError.message;
		}

		return t("todoForm.createError");
	}, [createTodoError, validationError, t]);

	const navTheme = useMemo(
		() => ({
			...(isDark ? DarkTheme : DefaultTheme),
			colors: {
				...(isDark ? DarkTheme.colors : DefaultTheme.colors),
				background: colors.background,
				card: colors.tabBarBg,
				border: colors.border,
				text: colors.textPrimary,
				primary: colors.accent,
			},
		}),
		[isDark, colors],
	);

	const homeTabsScreenOptions = useMemo(
		(): ((props: {
			route: { name: keyof HomeTabParamList };
		}) => BottomTabNavigationOptions) =>
			({ route }) => ({
				headerTitleAlign: "center",
				headerStyle: { backgroundColor: colors.navHeaderBg },
				headerTintColor: colors.navHeaderText,
				tabBarActiveTintColor: colors.tabBarActive,
				tabBarInactiveTintColor: colors.tabBarInactive,
				tabBarStyle: {
					height: 72,
					paddingBottom: 12,
					paddingTop: 8,
					backgroundColor: colors.tabBarBg,
					borderTopColor: colors.border,
				},
				tabBarLabelStyle: {
					fontSize: 12,
				},
			tabBarIcon: ({ color }) => (
				<FontAwesome6
					iconStyle="solid"
					name={route.name === "Todos" ? "list-ul" : "user"}
					size={16}
					color={color}
					style={
						route.name === "Todos" && isRTL
							? { transform: [{ scaleX: -1 }] }
							: undefined
					}
				/>
			),
		}),
	[colors, isRTL],
	);

	useEffect(() => {
		const unsubscribeTodos = todoService.subscribeToTodos(() => {
			queryClient
				.invalidateQueries({ queryKey: todoQueryKeys.all })
				.catch(() => undefined);
		});
		const unsubscribeCurrentUser = authService.subscribeToCurrentUser(() => {
			queryClient
				.invalidateQueries({ queryKey: authQueryKeys.currentUser })
				.catch(() => undefined);
		});

		return () => {
			unsubscribeTodos();
			unsubscribeCurrentUser();
		};
	}, [queryClient]);

	const animatePlus = () => {
		Animated.sequence([
			Animated.timing(plusScale, {
				toValue: 0.92,
				duration: 110,
				useNativeDriver: true,
			}),
			Animated.spring(plusScale, {
				toValue: 1,
				friction: 4,
				tension: 110,
				useNativeDriver: true,
			}),
		]).start();
	};

	const openAddTodoModal = () => {
		animatePlus();
		setTodoText("");
		setDueDate(new Date());
		setShowDatePicker(false);
		setIsCompletedOnCreate(false);
		setValidationError(null);
		setIsAddTodoVisible(true);
	};

	const closeAddTodoModal = () => {
		setIsAddTodoVisible(false);
	};

	const handleDateChange = (_event: unknown, selectedDate?: Date) => {
		if (Platform.OS === "android") {
			setShowDatePicker(false);
		}
		if (selectedDate) {
			setDueDate(selectedDate);
		}
	};

	const handleAddTodo = async () => {
		const trimmedText = todoText.trim();
		if (!trimmedText) {
			setValidationError(t("todoForm.taskRequired"));
			return;
		}

		setValidationError(null);

		try {
			await createTodo({
				text: trimmedText,
				dueDate,
				completed: isCompletedOnCreate,
			});

			closeAddTodoModal();
		} catch {
			// Errors are surfaced through react-query mutation state.
		}
	};

	const handleTodosTabFocus = () => {
		queryClient
			.invalidateQueries({ queryKey: todoQueryKeys.all })
			.catch(() => undefined);
	};

	const handleProfileTabFocus = () => {
		queryClient
			.invalidateQueries({ queryKey: authQueryKeys.currentUser })
			.catch(() => undefined);
	};

	return (
		<View className="flex-1" style={{ backgroundColor: colors.background }}>
			<NavigationContainer theme={navTheme}>
				<Tab.Navigator screenOptions={homeTabsScreenOptions}>
					<Tab.Screen
						name="Todos"
						component={TodoListScreen}
						options={{ title: t("tabs.todos") }}
						listeners={{ focus: handleTodosTabFocus }}
					/>
					<Tab.Screen
						name="Profile"
						component={ProfileScreen}
						options={{ title: t("tabs.profile") }}
						listeners={{ focus: handleProfileTabFocus }}
					/>
				</Tab.Navigator>
			</NavigationContainer>

			<View
				pointerEvents="box-none"
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					alignItems: "center",
					zIndex: 50,
					elevation: 50,
					bottom: insets.bottom,
				}}
			>
				<Animated.View
					style={{
						shadowColor: "#000",
						shadowOffset: { width: 0, height: 8 },
						shadowOpacity: 0.22,
						shadowRadius: 12,
						elevation: 10,
						transform: [{ scale: plusScale }],
					}}
				>
					<Pressable
						style={{
							height: 68,
							width: 68,
							alignItems: "center",
							justifyContent: "center",
							borderRadius: 34,
							backgroundColor: colors.accent,
						}}
						onPress={openAddTodoModal}
						accessibilityRole="button"
						accessibilityLabel={t("todos.addTodo")}
						hitSlop={8}
					>
						<View
							style={{
								height: 28,
								width: 28,
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<View
								style={{
									position: "absolute",
									width: 22,
									height: 4,
									borderRadius: 2,
									backgroundColor: "#ffffff",
								}}
							/>
							<View
								style={{
									position: "absolute",
									width: 4,
									height: 22,
									borderRadius: 2,
									backgroundColor: "#ffffff",
								}}
							/>
						</View>
					</Pressable>
				</Animated.View>
			</View>

			<Modal
				animationType="fade"
				transparent
				visible={isAddTodoVisible}
				onRequestClose={closeAddTodoModal}
			>
				<KeyboardAvoidingView
					className="flex-1 justify-end bg-black/40"
					behavior={Platform.OS === "ios" ? "padding" : undefined}
				>
					<Pressable className="absolute inset-0" onPress={closeAddTodoModal} />

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
									className="text-2xl font-semibold self-start"
									style={{ color: colors.textPrimary }}
								>
									{t("todoForm.newTask")}
								</Card.Title>
								<Card.Description
									className={`self-start ${isRTL ? "text-right" : "text-left"}`}
									style={{ color: colors.textMuted }}
								>
									{t("todoForm.newTaskSubtitle")}
								</Card.Description>
							</Card.Header>

							<Card.Body className="gap-4">
								<TextField isRequired>
									<Label className={`self-start ${isRTL ? "text-right" : "text-left"}`}>
										<Label.Text style={{ color: colors.textPrimary }}>{t("todoForm.taskLabel")}</Label.Text>
									</Label>
									<Input
										className={`focus:border-purple-600 focus:ring-purple-500 ${isRTL ? "text-right" : "text-left"}`}
										value={todoText}
										onChangeText={setTodoText}
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
											value={dueDate}
											mode="date"
											display="compact"
											onChange={handleDateChange}
											accentColor={colors.accent}
											themeVariant={isDark ? "dark" : "light"}
											style={{ alignSelf: "flex-start" }}
										/>
									) : (
										<>
											<Pressable
												onPress={() => setShowDatePicker(true)}
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
													{formatDate(dueDate)}
												</Text>
											</Pressable>
											{showDatePicker && (
												<DateTimePicker
													value={dueDate}
													mode="date"
													display="default"
													onChange={handleDateChange}
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
										value={isCompletedOnCreate}
										onValueChange={setIsCompletedOnCreate}
										disabled={isCreatingTodo}
										accessibilityLabel={t("todoForm.markCompleted")}
										trackColor={{
											false: colors.switchTrackOff,
											true: colors.accentLight,
										}}
										thumbColor={
											isCompletedOnCreate
												? colors.accent
												: colors.switchThumbOff
										}
									/>
								</View>

								{addTodoErrorMessage ? (
									<View
										style={{
											flexDirection: "row",
											alignItems: "flex-start",
											gap: 10,
											backgroundColor: colors.errorBg,
											borderWidth: 1,
											borderColor: colors.errorBorder,
											borderRadius: 14,
											paddingHorizontal: 14,
											paddingVertical: 12,
										}}
									>
										<View
											style={{
												width: 28,
												height: 28,
												borderRadius: 14,
												backgroundColor: colors.errorIconCircleBg,
												alignItems: "center",
												justifyContent: "center",
												flexShrink: 0,
											}}
										>
											<FontAwesome6
												iconStyle="solid"
												name="circle-exclamation"
												size={13}
												color={colors.errorIconColor}
											/>
										</View>
										<View style={{ flex: 1, paddingTop: 4 }}>
											<Text
												style={{
													fontSize: 13,
													fontWeight: "600",
													color: colors.errorText,
													lineHeight: 18,
												}}
											>
												{addTodoErrorMessage}
											</Text>
										</View>
									</View>
								) : null}
							</Card.Body>

							<Card.Footer className="gap-3" style={{ marginTop: 24 }}>
								<Button
									variant="ghost"
									onPress={closeAddTodoModal}
									isDisabled={isCreatingTodo}
								>
									<Button.Label style={{ color: colors.accent }}>
										{t("common.cancel")}
									</Button.Label>
								</Button>

								<Button
									onPress={handleAddTodo}
									isDisabled={isCreatingTodo}
									style={{ backgroundColor: colors.accent }}
								>
									{isCreatingTodo && !isRTL ? (
										<Spinner size="sm" style={{ marginEnd: 8 }} />
									) : null}
									<Button.Label style={{ color: colors.accentForeground }}>
										{isCreatingTodo
											? t("todoForm.creatingTask")
											: t("todoForm.createTask")}
									</Button.Label>
									{isCreatingTodo && isRTL ? (
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

export default HomeScreen;
