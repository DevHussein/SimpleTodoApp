import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { Button, Card, Input, Spinner } from "heroui-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AppwriteException } from "react-native-appwrite";
import RNRestart from "react-native-restart";
import { useSignOutMutation, useUpdateProfileMutation } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../hooks/useTheme";
import type { SupportedLanguage } from "../i18n/i18n";
import { useAuthStore } from "../store/authStore";
import { type ThemePreference, useThemeStore } from "../store/themeStore";

const ProfileScreen = () => {
	const { t } = useTranslation();
	const { colors } = useTheme();
	const { language, setLanguage, isRTL } = useLanguage();
	const user = useAuthStore((state) => state.user);
	const themePreference = useThemeStore((state) => state.preference);
	const setThemePreference = useThemeStore((state) => state.setPreference);
	const [name, setName] = useState(user?.name ?? "");

	const THEME_OPTIONS = useMemo(
		() => [
			{
				key: "light" as ThemePreference,
				label: t("appearance.light"),
				icon: "sun" as const,
			},
			{
				key: "dark" as ThemePreference,
				label: t("appearance.dark"),
				icon: "moon" as const,
			},
			{
				key: "system" as ThemePreference,
				label: t("appearance.system"),
				icon: "circle-half-stroke" as const,
			},
		],
		[t],
	);

	const LANGUAGE_OPTIONS = useMemo(
		() => [
			{
				key: "en" as SupportedLanguage,
				label: t("language.english"),
				icon: "earth-americas" as const,
			},
			{
				key: "ar" as SupportedLanguage,
				label: t("language.arabic"),
				icon: "earth-africa" as const,
			},
		],
		[t],
	);

	const {
		mutateAsync: updateProfile,
		error: updateError,
		isPending: isUpdating,
	} = useUpdateProfileMutation();
	const {
		mutateAsync: signOut,
		error: signOutError,
		isPending: isSigningOut,
	} = useSignOutMutation();

	useEffect(() => {
		setName(user?.name ?? "");
	}, [user?.name]);

	const updateErrorMessage = useMemo(() => {
		if (!updateError) {
			return null;
		}

		if (updateError instanceof AppwriteException) {
			return updateError.message;
		}

		if (updateError instanceof Error) {
			return updateError.message;
		}

		return t("profile.updateError");
	}, [updateError, t]);

	const signOutErrorMessage = useMemo(() => {
		if (!signOutError) {
			return null;
		}

		if (signOutError instanceof AppwriteException) {
			return signOutError.message;
		}

		return t("profile.signOutError");
	}, [signOutError, t]);

	const trimmedName = name.trim();
	const isSaveDisabled =
		isUpdating ||
		isSigningOut ||
		trimmedName.length === 0 ||
		trimmedName === (user?.name ?? "");
	const textDirectionStyle = isRTL
		? ({ textAlign: "right", writingDirection: "rtl" } as const)
		: ({ textAlign: "left", writingDirection: "ltr" } as const);

	const handleSaveProfile = async () => {
		await updateProfile({ name: trimmedName });
	};

	const handleLanguageChange = (lang: SupportedLanguage) => {
		const directionWillChange = (lang === "ar") !== isRTL;
		setLanguage(lang);
		if (directionWillChange) {
			setTimeout(() => RNRestart.restart(), 300);
		}
	};

	return (
		<ScrollView
			className="flex-1"
			style={{
				backgroundColor: colors.background,
				direction: isRTL ? "rtl" : "ltr",
			}}
			contentContainerStyle={{
				flexGrow: 1,
				justifyContent: "center",
				paddingHorizontal: 20,
				paddingVertical: 32,
				gap: 16,
			}}
			keyboardShouldPersistTaps="handled"
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
						{t("profile.title")}
					</Card.Title>
					<Card.Description
						className={`self-start ${isRTL ? "text-right" : "text-left"}`}
						style={{ color: colors.textMuted }}
					>
						{t("profile.subtitle")}
					</Card.Description>
				</Card.Header>

				<Card.Body className="gap-4">
					<View
						className="rounded-xl px-3 py-2"
						style={{ backgroundColor: colors.surfaceSecondary }}
					>
						<Text className={`self-start ${isRTL ? "text-right" : "text-left"}`} style={{ fontSize: 14, color: colors.textMuted }}>
							{t("common.name")}
						</Text>
						<Input
							className={`${isRTL ? "text-right" : "text-left"}`}
							value={name}
							onChangeText={setName}
							cursorColor={colors.accent}
							selectionColor={colors.accentLight}
							autoCapitalize="words"
							autoCorrect={false}
							textContentType="name"
							placeholder={t("profile.namePlaceholder")}
							placeholderTextColor={colors.textSubtle}
							returnKeyType="done"
							textAlign={isRTL ? "right" : "left"}
							style={{
								...textDirectionStyle,
								fontSize: 16,
								color: colors.textPrimary,
								backgroundColor: "transparent",
								paddingHorizontal: 0,
								paddingVertical: 2,
								borderWidth: 0,
							}}
						/>
					</View>

					<View
						className="rounded-xl px-3 py-2"
						style={{ backgroundColor: colors.surfaceSecondary }}
					>
						<Text className={`self-start ${isRTL ? "text-right" : "text-left"}`} style={{ fontSize: 14, color: colors.textMuted }}>
							{t("common.email")}
						</Text>
						<Text className={`self-start ${isRTL ? "text-right" : "text-left"}`} style={{ fontSize: 16, color: colors.textPrimary }}>
							{user?.email ?? t("profile.noEmail")}
						</Text>
					</View>

					{updateErrorMessage ? (
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
								{updateErrorMessage}
							</Text>
						</View>
					) : null}

					{signOutErrorMessage ? (
						<View
							className="rounded-xl px-3 py-2"
							style={{
								borderWidth: 1,
								borderColor: colors.errorBorder,
								backgroundColor: colors.errorBg,
							}}
						>
							<Text
								className={`self-start ${isRTL ? "text-right" : "text-left"}`}
								style={{
									fontSize: 14,
									color: colors.errorIconColor,
								}}
							>
								{signOutErrorMessage}
							</Text>
						</View>
					) : null}
				</Card.Body>

				<Card.Footer className="gap-3" style={{ marginTop: 24 }}>
					<Button
						onPress={handleSaveProfile}
						isDisabled={isSaveDisabled}
						style={{ backgroundColor: colors.accent }}
					>
						{isUpdating && !isRTL ? (
							<Spinner size="sm" style={{ marginEnd: 8 }} />
						) : null}
						<Button.Label style={{ color: colors.accentForeground }}>
							{isUpdating
								? t("profile.savingProfile")
								: t("profile.saveProfile")}
						</Button.Label>
						{isUpdating && isRTL ? (
							<Spinner size="sm" style={{ marginStart: 8 }} />
						) : null}
					</Button>

					<Button
						variant="ghost"
						onPress={() => signOut()}
						isDisabled={isSigningOut}
					>
						{isSigningOut && !isRTL ? (
							<Spinner size="sm" style={{ marginEnd: 8 }} />
						) : null}
						<Button.Label style={{ color: colors.accent }}>
							{isSigningOut ? t("profile.signingOut") : t("profile.signOut")}
						</Button.Label>
						{isSigningOut && isRTL ? (
							<Spinner size="sm" style={{ marginStart: 8 }} />
						) : null}
					</Button>
				</Card.Footer>
			</Card>

			<Card
				className="w-full max-w-md self-center p-5"
				style={{
					backgroundColor: colors.surface,
					borderWidth: 1,
					borderColor: colors.cardBorder,
				}}
			>
				<Card.Header className="mb-4 gap-1">
					<Card.Title
						className={`text-lg font-semibold self-start`}
						style={{ color: colors.textPrimary }}
					>
						{t("appearance.title")}
					</Card.Title>
					<Card.Description
						className={`self-start ${isRTL ? "text-right" : "text-left"}`}
						style={{ color: colors.textMuted }}
					>
						{t("appearance.subtitle")}
					</Card.Description>
				</Card.Header>

				<Card.Body>
					<View className="flex-row gap-3">
						{THEME_OPTIONS.map((option) => {
							const isActive = themePreference === option.key;
							return (
								<Pressable
									key={option.key}
									onPress={() => setThemePreference(option.key)}
									accessibilityRole="button"
									accessibilityState={{ selected: isActive }}
									accessibilityLabel={t("appearance.setTheme", {
										theme: option.label,
									})}
									style={{
										flex: 1,
										alignItems: "center",
										gap: 8,
										paddingVertical: 14,
										borderRadius: 14,
										borderWidth: 2,
										borderColor: isActive ? colors.accent : colors.border,
										backgroundColor: isActive
											? colors.accentSoftBg
											: colors.surfaceSecondary,
									}}
								>
									<FontAwesome6
										name={option.icon}
										iconStyle="solid"
										size={20}
										color={isActive ? colors.accent : colors.textMuted}
									/>
									<Text
										style={{
											fontSize: 13,
											fontWeight: isActive ? "700" : "500",
											color: isActive ? colors.accent : colors.textSecondary,
										}}
									>
										{option.label}
									</Text>
								</Pressable>
							);
						})}
					</View>
				</Card.Body>
			</Card>

			<Card
				className="w-full max-w-md self-center p-5"
				style={{
					backgroundColor: colors.surface,
					borderWidth: 1,
					borderColor: colors.cardBorder,
				}}
			>
				<Card.Header className="mb-4 gap-1">
					<Card.Title
						className={`text-lg font-semibold self-start`}
						style={{ color: colors.textPrimary }}
					>
						{t("language.title")}
					</Card.Title>
					<Card.Description
						className={`self-start ${isRTL ? "text-right" : "text-left"}`}
						style={{ color: colors.textMuted }}
					>
						{t("language.subtitle")}
					</Card.Description>
				</Card.Header>

				<Card.Body>
					<View className="flex-row gap-3">
						{LANGUAGE_OPTIONS.map((option) => {
							const isActive = language === option.key;
							return (
								<Pressable
									key={option.key}
									onPress={() => handleLanguageChange(option.key)}
									accessibilityRole="button"
									accessibilityState={{ selected: isActive }}
									accessibilityLabel={t("language.setLanguage", {
										language: option.label,
									})}
									style={{
										flex: 1,
										alignItems: "center",
										gap: 8,
										paddingVertical: 14,
										borderRadius: 14,
										borderWidth: 2,
										borderColor: isActive ? colors.accent : colors.border,
										backgroundColor: isActive
											? colors.accentSoftBg
											: colors.surfaceSecondary,
									}}
								>
									<FontAwesome6
										name={option.icon}
										iconStyle="solid"
										size={20}
										color={isActive ? colors.accent : colors.textMuted}
									/>
									<Text
										style={{
											fontSize: 13,
											fontWeight: isActive ? "700" : "500",
											color: isActive ? colors.accent : colors.textSecondary,
										}}
									>
										{option.label}
									</Text>
								</Pressable>
							);
						})}
					</View>
				</Card.Body>
			</Card>
		</ScrollView>
	);
};

export default ProfileScreen;
