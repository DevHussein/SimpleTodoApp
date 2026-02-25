import { zodResolver } from "@hookform/resolvers/zod";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
	Button,
	Card,
	FieldError,
	Input,
	Label,
	Spinner,
	TextField,
} from "heroui-native";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	View,
} from "react-native";
import { AppwriteException } from "react-native-appwrite";
import type { AuthStackParamList } from "../App";
import { useSignUpMutation } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../hooks/useTheme";
import { type SignUpFormValues, signUpSchema } from "../schemas/authSchemas";

const SignUpScreen = () => {
	const navigation =
		useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
	const { t } = useTranslation();
	const { colors } = useTheme();
	const { isRTL } = useLanguage();
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
		useState(false);

	const { control, handleSubmit, formState } = useForm<SignUpFormValues>({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		mode: "onBlur",
		resolver: zodResolver(signUpSchema),
	});

	const { mutateAsync: signUp, error, isPending } = useSignUpMutation();

	const apiError = useMemo(() => {
		if (!error) {
			return null;
		}

		if (error instanceof AppwriteException) {
			return error.message;
		}

		return t("auth.signUpError");
	}, [error, t]);

	const translateFormError = (message?: string) =>
		message ? t(message as never, { defaultValue: message }) : undefined;

	const onSubmit = async (values: SignUpFormValues) => {
		await signUp({
			name: values.name,
			email: values.email,
			password: values.password,
		});
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			className="flex-1"
			style={{ backgroundColor: colors.background }}
		>
			<ScrollView
				className="flex-1"
				style={{ direction: isRTL ? "rtl" : "ltr" }}
				contentContainerStyle={{
					flexGrow: 1,
					justifyContent: "center",
					paddingHorizontal: 20,
					paddingVertical: 32,
				}}
				keyboardShouldPersistTaps="always"
			>
				<Card
					className="w-full max-w-md self-center p-5"
					style={{
						backgroundColor: colors.surface,
						borderWidth: 1,
						borderColor: colors.cardBorder,
					}}
				>
					<Card.Header className="mb-5 gap-1">
						<Card.Title
							className={`text-2xl font-semibold self-start`}
							style={{ color: colors.textPrimary }}
						>
							{t("auth.signUpTitle")}
						</Card.Title>
						<Card.Description
							className={`self-start ${isRTL ? "text-right" : "text-left"}`}
							style={{ color: colors.textMuted }}
						>
							{t("auth.signUpSubtitle")}
						</Card.Description>
					</Card.Header>

					<Card.Body className="gap-4">
						<Controller
							control={control}
							name="name"
							render={({ field: { onBlur, onChange, value } }) => (
								<TextField
									isRequired
									isInvalid={Boolean(formState.errors.name)}
								>
									<Label className="self-start">
										<Label.Text style={{ color: colors.textPrimary }}>
											{t("auth.fullName")}
										</Label.Text>
									</Label>
									<Input
										className={`focus:border-purple-600 focus:ring-purple-500 ${isRTL ? 'text-right' : 'text-left'}`}
										value={value}
										onBlur={onBlur}
										onChangeText={onChange}
										cursorColor={colors.accent}
										selectionColor={colors.accentLight}
										autoCapitalize="words"
										autoCorrect={false}
										textContentType="name"
										placeholder={t("auth.fullNamePlaceholder")}
										placeholderTextColor={colors.textSubtle}
										returnKeyType="next"
										style={{
											color: colors.textPrimary,
											backgroundColor: colors.fieldBg,
											borderWidth: 1,
											borderColor: colors.fieldBorder,
										}}
									/>
									<FieldError
										isInvalid={Boolean(formState.errors.name)}
										classNames={{
											container: "mt-1.5 rounded-xl bg-red-50 px-3 py-2",
											text: "text-xs font-medium text-red-600",
										}}
									>
										{translateFormError(formState.errors.name?.message)}
									</FieldError>
								</TextField>
							)}
						/>

						<Controller
							control={control}
							name="email"
							render={({ field: { onBlur, onChange, value } }) => (
								<TextField
									isRequired
									isInvalid={Boolean(formState.errors.email)}
								>
									<Label className="self-start">
										<Label.Text style={{ color: colors.textPrimary }}>
											{t("common.email")}
										</Label.Text>
									</Label>
									<Input
										className={`focus:border-purple-600 focus:ring-purple-500 ${isRTL ? 'text-right' : 'text-left'}`}
										value={value}
										onBlur={onBlur}
										onChangeText={onChange}
										cursorColor={colors.accent}
										selectionColor={colors.accentLight}
										autoCapitalize="none"
										autoCorrect={false}
										keyboardType="email-address"
										textContentType="emailAddress"
										placeholder={t("auth.emailPlaceholder")}
										placeholderTextColor={colors.textSubtle}
										returnKeyType="next"
										style={{
											color: colors.textPrimary,
											backgroundColor: colors.fieldBg,
											borderWidth: 1,
											borderColor: colors.fieldBorder,
										}}
									/>
									<FieldError
										isInvalid={Boolean(formState.errors.email)}
										classNames={{
											container: "mt-1.5 rounded-xl bg-red-50 px-3 py-2",
											text: "text-xs font-medium text-red-600",
										}}
									>
										{translateFormError(formState.errors.email?.message)}
									</FieldError>
								</TextField>
							)}
						/>

						<Controller
							control={control}
							name="password"
							render={({ field: { onBlur, onChange, value } }) => (
								<TextField
									isRequired
									isInvalid={Boolean(formState.errors.password)}
								>
									<Label className="self-start">
										<Label.Text style={{ color: colors.textPrimary }}>
											{t("common.password")}
										</Label.Text>
									</Label>
									<View className="relative">
										<Input
											className={`w-full pr-12 focus:border-purple-600 focus:ring-purple-500 ${isRTL ? 'text-right' : 'text-left'}`}
											value={value}
											onBlur={onBlur}
											onChangeText={onChange}
											cursorColor={colors.accent}
											selectionColor={colors.accentLight}
											autoCapitalize="none"
											autoCorrect={false}
											secureTextEntry={!isPasswordVisible}
											textContentType="newPassword"
											placeholder={t("auth.createPasswordPlaceholder")}
											placeholderTextColor={colors.textSubtle}
											returnKeyType="next"
											style={{
												color: colors.textPrimary,
												backgroundColor: colors.fieldBg,
												borderWidth: 1,
												borderColor: colors.fieldBorder,
											}}
										/>
										<View className="absolute right-2 top-0 bottom-0 justify-center">
											<Button
												size="sm"
												variant="ghost"
												isIconOnly
												className="h-8 w-8"
												onPress={() => setIsPasswordVisible((prev) => !prev)}
												accessibilityLabel={
													isPasswordVisible
														? t("auth.hidePassword")
														: t("auth.showPassword")
												}
											>
												<FontAwesome6
													iconStyle="solid"
													name={isPasswordVisible ? "eye-slash" : "eye"}
													size={15}
													color={colors.passwordToggleIcon}
												/>
											</Button>
										</View>
									</View>
									<FieldError
										isInvalid={Boolean(formState.errors.password)}
										classNames={{
											container: "mt-1.5 rounded-xl bg-red-50 px-3 py-2",
											text: "text-xs font-medium text-red-600",
										}}
									>
										{translateFormError(formState.errors.password?.message)}
									</FieldError>
								</TextField>
							)}
						/>

						<Controller
							control={control}
							name="confirmPassword"
							render={({ field: { onBlur, onChange, value } }) => (
								<TextField
									isRequired
									isInvalid={Boolean(formState.errors.confirmPassword)}
								>
									<Label className="self-start">
										<Label.Text style={{ color: colors.textPrimary }}>
											{t("auth.confirmPassword")}
										</Label.Text>
									</Label>
									<View className="relative">
										<Input
											className={`w-full pr-12 focus:border-purple-600 focus:ring-purple-500 ${isRTL ? 'text-right' : 'text-left'}`}
											value={value}
											onBlur={onBlur}
											onChangeText={onChange}
											cursorColor={colors.accent}
											selectionColor={colors.accentLight}
											autoCapitalize="none"
											autoCorrect={false}
											secureTextEntry={!isConfirmPasswordVisible}
											textContentType="newPassword"
											placeholder={t("auth.confirmPasswordPlaceholder")}
											placeholderTextColor={colors.textSubtle}
											returnKeyType="done"
											style={{
												color: colors.textPrimary,
												backgroundColor: colors.fieldBg,
												borderWidth: 1,
												borderColor: colors.fieldBorder,
											}}
										/>
										<View className="absolute right-2 top-0 bottom-0 justify-center">
											<Button
												size="sm"
												variant="ghost"
												isIconOnly
												className="h-8 w-8"
												onPress={() =>
													setIsConfirmPasswordVisible((prev) => !prev)
												}
												accessibilityLabel={
													isConfirmPasswordVisible
														? t("auth.hideConfirmPassword")
														: t("auth.showConfirmPassword")
												}
											>
												<FontAwesome6
													iconStyle="solid"
													name={isConfirmPasswordVisible ? "eye-slash" : "eye"}
													size={15}
													color={colors.passwordToggleIcon}
												/>
											</Button>
										</View>
									</View>
									<FieldError
										isInvalid={Boolean(formState.errors.confirmPassword)}
										classNames={{
											container: "mt-1.5 rounded-xl bg-red-50 px-3 py-2",
											text: "text-xs font-medium text-red-600",
										}}
									>
										{translateFormError(
											formState.errors.confirmPassword?.message,
										)}
									</FieldError>
								</TextField>
							)}
						/>

						{apiError ? (
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
										{apiError}
									</Text>
								</View>
							</View>
						) : null}
					</Card.Body>

					<Card.Footer className="gap-3" style={{ marginTop: 24 }}>
						<Button
							onPress={handleSubmit(onSubmit)}
							isDisabled={isPending}
							style={{ backgroundColor: colors.accent }}
						>
							{isPending && !isRTL ? (
								<Spinner size="sm" style={{ marginEnd: 8 }} />
							) : null}
							<Button.Label style={{ color: colors.accentForeground }}>
								{isPending ? t("auth.signingUp") : t("auth.signUp")}
							</Button.Label>
							{isPending && isRTL ? (
								<Spinner size="sm" style={{ marginStart: 8 }} />
							) : null}
						</Button>

						<Button
							variant="ghost"
							onPress={() => {
								Keyboard.dismiss();
								navigation.navigate("SignIn");
							}}
							isDisabled={isPending}
						>
							<Button.Label style={{ color: colors.accent }}>
								{t("auth.alreadyHaveAccount")}
							</Button.Label>
						</Button>
					</Card.Footer>
				</Card>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

export default SignUpScreen;
