"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Worker } from "@/lib/types";

const formSchema = z.object({
  workerId: z.string({ required_error: "Please select your name." }),
  pin: z.string().length(4, "PIN must be 4 digits.").regex(/^\d{4}$/, "PIN must be numeric."),
  notes: z.string().min(5, "Notes must be at least 5 characters.").max(500),
});

type FormValues = z.infer<typeof formSchema>;

interface AttendancePinFormProps {
    workers: Worker[];
    onSubmit: (data: FormValues) => void;
}

export function AttendancePinForm({ workers, onSubmit }: AttendancePinFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workerId: undefined,
      pin: "",
      notes: "",
    },
  });

  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Mark Attendance</CardTitle>
        <CardDescription>Select your name, enter your PIN, and leave a note.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="workerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your name" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>{worker.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>4-Digit PIN</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="e.g. 1234" maxLength={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any notes for today's session?" className="resize-none h-28" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Submit Attendance</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
