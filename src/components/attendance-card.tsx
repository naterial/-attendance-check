import { Code, Layers, Server } from 'lucide-react';
import type { AttendanceRecord, TeamCategory } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const categoryIcons: Record<TeamCategory, React.ReactElement> = {
  'Frontend': <Code className="size-6 text-primary" />,
  'Backend': <Server className="size-6 text-primary" />,
  'Full Stack': <Layers className="size-6 text-primary" />,
};

export function AttendanceCard({ record }: { record: AttendanceRecord }) {
  return (
    <Card className="w-full transition-all hover:shadow-xl dark:hover:shadow-primary/20">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5 flex-grow">
          <CardTitle className="text-xl font-headline">{record.name}</CardTitle>
          <CardDescription>
            <Badge variant="outline">{record.team}</Badge>
          </CardDescription>
        </div>
        <div className="p-3 rounded-lg bg-muted">
          {categoryIcons[record.team]}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80">{record.notes}</p>
      </CardContent>
    </Card>
  );
}
