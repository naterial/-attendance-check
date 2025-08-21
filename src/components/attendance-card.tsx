import { HandHeart, Soup, Sparkles, Briefcase, Users, Clock, Hourglass, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { AttendanceRecord, WorkerRole, AttendanceStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const roleIcons: Record<WorkerRole, React.ReactElement> = {
  'Carer': <HandHeart className="size-6 text-primary" />,
  'Cook': <Soup className="size-6 text-primary" />,
  'Cleaner': <Sparkles className="size-6 text-primary" />,
  'Executive': <Briefcase className="size-6 text-primary" />,
  'Volunteer': <Users className="size-6 text-primary" />,
};

const statusConfig: Record<AttendanceStatus, { icon: React.ReactElement, text: string, className: string }> = {
    pending: {
        icon: <Hourglass className="size-4" />,
        text: 'Pending',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800'
    },
    approved: {
        icon: <ThumbsUp className="size-4" />,
        text: 'Approved',
        className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800'
    },
    rejected: {
        icon: <ThumbsDown className="size-4" />,
        text: 'Rejected',
        className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800'
    }
}

export function AttendanceCard({ record }: { record: AttendanceRecord }) {
  const currentStatus = statusConfig[record.status];

  return (
    <Card className="w-full transition-all hover:shadow-xl dark:hover:shadow-primary/20">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5 flex-grow">
          <CardTitle className="text-xl font-headline">{record.name}</CardTitle>
          <CardDescription className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline">{record.role}</Badge>
            <Badge variant="secondary">{record.shift}</Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                {format(record.timestamp, "PPP p")}
            </span>
          </CardDescription>
        </div>
        <div className="p-3 rounded-lg bg-muted">
          {roleIcons[record.role]}
        </div>
      </CardHeader>
      <CardContent className="flex justify-between items-center">
        <p className="text-sm text-foreground/80 flex-grow">{record.notes || <span className="text-muted-foreground italic">No notes provided.</span>}</p>
        {currentStatus && (
            <Badge className={cn("flex items-center gap-2", currentStatus.className)}>
                {currentStatus.icon}
                <span>{currentStatus.text}</span>
            </Badge>
        )}
      </CardContent>
    </Card>
  );
}
