"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Mail, ArrowLeft } from 'lucide-react';

const ADMIN_EMAIL = "admin@vibrantaging.com";
const ADMIN_SECRET = "123456";

export default function AdminLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [secret, setSecret] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (email === ADMIN_EMAIL && secret === ADMIN_SECRET) {
            toast({
                title: "Login Successful",
                description: "Redirecting to the admin dashboard...",
            });
            localStorage.setItem('isAdminAuthenticated', 'true');
            router.push('/admin');
        } else {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: "Invalid email or secret key. Please try again.",
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background font-body flex items-center justify-center p-4 relative">
             <Link href="/" passHref>
                <Button variant="ghost" size="sm" className="absolute top-4 left-4">
                    <ArrowLeft className="mr-2" />
                    Back to Home
                </Button>
            </Link>
            <main className="container mx-auto px-4 py-8 md:px-6 md:py-12 flex justify-center">
                <div className="w-full max-w-md">
                    <Card className="shadow-2xl">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl font-bold font-headline">Admin Login</CardTitle>
                            <CardDescription>Access the worker management dashboard.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="admin@vibrantaging.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="secret">6-Digit Secret Key</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="secret"
                                            type="password"
                                            placeholder="••••••"
                                            value={secret}
                                            onChange={(e) => setSecret(e.target.value)}
                                            required
                                            maxLength={6}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? 'Logging in...' : 'Login'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
