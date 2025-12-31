import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { InsightData } from '@/types/agent';
import { cn } from '@/lib/utils/cn';

interface InsightCardProps {
  data: InsightData;
}

export function InsightCard({ data }: InsightCardProps) {
  const { title, description, severity = 'info' } = data;

  const severityConfig = {
    info: {
      icon: Info,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-l-4 border-blue-500',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-900 dark:text-blue-100',
    },
    success: {
      icon: CheckCircle,
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-l-4 border-green-500',
      iconColor: 'text-green-500',
      textColor: 'text-green-900 dark:text-green-100',
    },
    warning: {
      icon: AlertCircle,
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-l-4 border-yellow-500',
      iconColor: 'text-yellow-500',
      textColor: 'text-yellow-900 dark:text-yellow-100',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-l-4 border-red-500',
      iconColor: 'text-red-500',
      textColor: 'text-red-900 dark:text-red-100',
    },
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-lg p-4', config.bg, config.border)}>
      <div className="flex gap-3">
        <Icon className={cn('h-5 w-5 shrink-0', config.iconColor)} />
        <div>
          <h4 className={cn('text-sm font-semibold', config.textColor)}>{title}</h4>
          <p className={cn('mt-1 text-sm', config.textColor)}>{description}</p>
        </div>
      </div>
    </div>
  );
}
