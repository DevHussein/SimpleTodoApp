import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { authService } from '../services/authService';
import type { AppwriteUser, UpdateProfileInput } from '../services/authService';
import type { SignInInput, SignUpInput } from '../schemas/authSchemas';
import { useAuthStore } from '../store/authStore';

export const authQueryKeys = {
  currentUser: ['auth', 'currentUser'] as const,
};

export const useCurrentUserQuery = (): UseQueryResult<AppwriteUser | null> => {
  return useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: authService.getCurrentUser,
    staleTime: 60_000,
  });
};

export const useSignInMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SignInInput) => authService.signIn(payload),
    onSuccess: user => {
      useAuthStore.getState().setUser(user);
      queryClient.setQueryData(authQueryKeys.currentUser, user);
    },
  });
};

export const useSignUpMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SignUpInput) => authService.signUp(payload),
    onSuccess: user => {
      useAuthStore.getState().setUser(user);
      queryClient.setQueryData(authQueryKeys.currentUser, user);
    },
  });
};

export const useSignOutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.signOut,
    onSuccess: () => {
      useAuthStore.getState().resetAuth();
      queryClient.setQueryData(authQueryKeys.currentUser, null);
    },
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileInput) => authService.updateProfile(payload),
    onMutate: async payload => {
      await queryClient.cancelQueries({ queryKey: authQueryKeys.currentUser });

      const previousQueryUser = queryClient.getQueryData<AppwriteUser | null>(
        authQueryKeys.currentUser
      );
      const previousStoreUser = useAuthStore.getState().user;
      const baseUser = previousQueryUser ?? previousStoreUser;

      if (baseUser) {
        const optimisticUser = {
          ...baseUser,
          name: payload.name.trim(),
        } as AppwriteUser;

        useAuthStore.getState().setUser(optimisticUser);
        queryClient.setQueryData(authQueryKeys.currentUser, optimisticUser);
      }

      return { previousQueryUser, previousStoreUser };
    },
    onError: (_error, _payload, context) => {
      if (!context) {
        return;
      }

      useAuthStore.getState().setUser(context.previousStoreUser);

      if (context.previousQueryUser !== undefined) {
        queryClient.setQueryData(authQueryKeys.currentUser, context.previousQueryUser);
      }
    },
    onSuccess: user => {
      useAuthStore.getState().setUser(user);
      queryClient.setQueryData(authQueryKeys.currentUser, user);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser });
    },
  });
};
