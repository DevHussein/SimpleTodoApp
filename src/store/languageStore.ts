import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import i18n, { type SupportedLanguage } from "../i18n/i18n";

type LanguageStore = {
	language: SupportedLanguage;
	setLanguage: (language: SupportedLanguage) => void;
	hydrated: boolean;
	setHydrated: (hydrated: boolean) => void;
};

export const useLanguageStore = create<LanguageStore>()(
	persist(
		(set) => ({
			language: "en",
			hydrated: false,
			setHydrated: (hydrated: boolean) => set({ hydrated }),
			setLanguage: (language: SupportedLanguage) => {
				const isRTL = language === "ar";
				I18nManager.forceRTL(isRTL);
				I18nManager.allowRTL(isRTL);
				i18n.changeLanguage(language);
				set({ language });
			},
		}),
		{
			name: "language-preference",
			storage: createJSONStorage(() => AsyncStorage),
			onRehydrateStorage: () => (state) => {
				if (state) {
					const isRTL = state.language === "ar";
					I18nManager.forceRTL(isRTL);
					I18nManager.allowRTL(isRTL);
					i18n.changeLanguage(state.language);
					state.setHydrated(true);
				}
			},
		},
	),
);
