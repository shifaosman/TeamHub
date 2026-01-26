import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from './useToast';

export function useResendVerification() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post('/auth/resend-verification', { email });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Verification email sent',
        description: 'Please check your email for the verification link.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send email',
        description: error.response?.data?.message || 'Please try again later.',
        variant: 'error',
      });
    },
  });
}
