import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { userInputSchema, UserInput } from '@/lib/utils/validation';
import { useAgentStore } from '@/store/agentStore';
import { cn } from '@/lib/utils/cn';

interface ChatInputProps {
  disabled?: boolean;
}

export function ChatInput({ disabled }: ChatInputProps) {
  const { sendMessage } = useAgentStore();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserInput>({
    resolver: zodResolver(userInputSchema),
  });

  const onSubmit = async (data: UserInput) => {
    await sendMessage(data.message);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <input
            {...register('message')}
            type="text"
            placeholder="Ask me anything..."
            disabled={disabled}
            className={cn(
              'w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5',
              'text-gray-900 placeholder-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400'
            )}
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            'bg-blue-500 text-white transition-all',
            'hover:bg-blue-600 active:scale-95',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'dark:bg-blue-600 dark:hover:bg-blue-700'
          )}
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
}
