import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'validation.emailRequired')
  .email('validation.emailInvalid');

const passwordSchema = z
  .string()
  .min(1, 'validation.passwordRequired')
  .min(8, 'validation.passwordMin');

const nameSchema = z
  .string()
  .trim()
  .min(1, 'validation.nameRequired')
  .min(2, 'validation.nameMin');

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpPayloadSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = signUpPayloadSchema
  .extend({
    confirmPassword: z.string().min(1, 'validation.confirmPasswordRequired'),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'validation.confirmPasswordMismatch',
      });
    }
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpPayloadSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
