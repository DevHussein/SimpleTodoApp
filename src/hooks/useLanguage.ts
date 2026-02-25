import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";
import type { SupportedLanguage } from "../i18n/i18n";
import { useLanguageStore } from "../store/languageStore";

type LanguageResult = {
	language: SupportedLanguage;
	isRTL: boolean;
	setLanguage: (language: SupportedLanguage) => void;
};

export const useLanguage = (): LanguageResult => {
	const language = useLanguageStore((state) => state.language);
	const setLanguage = useLanguageStore((state) => state.setLanguage);
	const isRTL = I18nManager.isRTL;

	return { language, isRTL, setLanguage };
};

export { useTranslation };
