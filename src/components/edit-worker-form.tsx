
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Worker } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50),
  role: z.enum(["Carer", "Cook", "Cleaner", "Executive", "Volunteer"], {
    required_error: "Please select a role.",
  }),
  shift: z.enum(["Morning", "Afternoon", "Off Day"], {
    required_error: "Please select a shift.",
  }),
  pin: z.string().length(4, "PIN must be exactly 4 digits.").regex(/^\d{4}$/, "PIN must be numeric."),
});

type FormValues = z.infer<typeof formSchema>;

interface EditWorkerFormProps {
    worker: Worker;
    workers: Worker[];
    onSubmit: (data: Worker) => void;
    onCancel: () => void;
}

export function EditWorkerForm({ worker, workers, onSubmit, onCancel }: EditWorkerFormProps) {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: worker.name,
      role: worker.role,
      shift: worker.shift,
      pin: worker.pin,
    },
  });

  const handleSubmit = (data: FormValues) => {
    // Check if the PIN is taken by *another* worker
    const isPinTaken = workers.some(w => w.pin === data.pin && w.id !== worker.id);

    if (isPinTaken) {
      form.setError("pin", {
        type: "manual",
        message: "This PIN is already taken. Please choose another one.",
      });
      toast({
        variant: "destructive",
        title: "PIN Already Exists",
        description: "Another worker is already using this PIN.",
      });
      return;
    }
    onSubmit({ ...worker, ...data });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. John Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select worker role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Carer">Carer</SelectItem>
                  <SelectItem value="Cook">Cook</SelectItem>
                  <SelectItem value="Cleaner">Cleaner</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                  <SelectItem value="Volunteer">Volunteer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shift"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shift</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select worker shift" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Morning">Morning</SelectItem>
                  <SelectItem value="Afternoon">Afternoon</SelectItem>
                  <SelectItem value="Off Day">Off Day</SelectItem>
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
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Form>
  );
}
