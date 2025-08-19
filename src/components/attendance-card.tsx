import { HandHeart, Soup, Sparkles, Briefcase, Users } from 'lucide-react';
import type { AttendanceRecord, WorkerRole } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const roleIcons: Record<WorkerRole, React.ReactElement> = {
  'Carer': <HandHeart className="size-6 text-primary" />,
  'Cook': <Soup className="size-6 text-primary" />,
  'Cleaner': <Sparkles className="size-6 text-primary" />,
  'Executive': <Briefcase className="size-6 text-primary" />,
  'Volunteer': <Users className="size-6 text-primary" />,
};

export function AttendanceCard({ record }: { record: AttendanceRecord }) {
  return (
    <Card className="w-full transition-all hover:shadow-xl dark:hover:shadow-primary/20">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5 flex-grow">
          <CardTitle className="text-xl font-headline">{record.name}</CardTitle>
          <CardDescription className="flex gap-2">
            <Badge variant="outline">{record.role}</Badge>
            <Badge variant="secondary">{record.shift}</Badge>
          </CardDescription>
        </div>
        <div className="p-3 rounded-lg bg-muted">
          {roleIcons[record.role]}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80">{record.notes}</p>
      </CardContent>
    </Card>
  );
}
