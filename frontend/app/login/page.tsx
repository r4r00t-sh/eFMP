'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { toast } from 'sonner';
import { LogIn, Lock, User, FileText, Shield, Zap, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      setAuth(response.data.user, response.data.access_token);
      toast.success('Welcome back!', {
        description: `Logged in as ${response.data.user.name}`,
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast.error('Login failed', {
        description: error.response?.data?.message || 'Invalid username or password',
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { 
      icon: FileText, 
      title: 'Digital File Management',
      description: 'Organize and track all your files digitally'
    },
    { 
      icon: Shield, 
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security for your data'
    },
    { 
      icon: Zap, 
      title: 'Real-time Tracking',
      description: 'Track file status and location instantly'
    },
  ];

  const testAccounts = [
    { role: 'Super Admin', username: 'admin', password: 'admin123', name: 'Super Administrator', dept: 'All Departments', color: 'bg-red-500' },
    { role: 'Dept Admin', username: 'finadmin', password: 'password123', name: 'Finance Admin', dept: 'Finance Department', color: 'bg-purple-500' },
    { role: 'Approval Auth', username: 'approver.fin', password: 'password123', name: 'Finance Approver', dept: 'Finance Department', color: 'bg-amber-500' },
    { role: 'Section Officer', username: 'john.budget', password: 'password123', name: 'John Smith', dept: 'Finance > Budget Section', color: 'bg-blue-500' },
    { role: 'Section Officer', username: 'jane.accounts', password: 'password123', name: 'Jane Doe', dept: 'Finance > Accounts Section', color: 'bg-blue-500' },
    { role: 'Section Officer', username: 'mike.audit', password: 'password123', name: 'Mike Johnson', dept: 'Finance > Audit Section', color: 'bg-blue-500' },
    { role: 'Inward Desk', username: 'inward.fin', password: 'password123', name: 'Finance Inward Desk', dept: 'Finance Department', color: 'bg-green-500' },
    { role: 'Dispatcher', username: 'dispatch.fin', password: 'password123', name: 'Finance Dispatcher', dept: 'Finance Department', color: 'bg-cyan-500' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-12 xl:p-16 flex-col justify-between text-primary-foreground relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden">
              <img
                src="/logo.png"
                alt="EFMP"
                className="h-14 w-14 object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">EFMP</h1>
            </div>
          </div>
        </div>
        
        <div className="relative space-y-8">
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
            Streamline Your<br />Document Workflow
          </h2>
          <p className="text-xl opacity-90 max-w-lg">
            Manage, track, and process files efficiently with our enterprise-grade e-filing solution designed for government organizations.
          </p>
          
          <div className="space-y-4 pt-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-4 bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm opacity-80">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm opacity-60 relative">
          © 2026 EFMP. All rights reserved.
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center overflow-hidden">
              <img
                src="/logo.png"
                alt="EFMP"
                className="h-14 w-14 object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">EFMP</h1>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2 text-lg">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-base font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="Enter your username"
                  className="pl-12 h-14 text-base"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="pl-12 h-14 text-base"
                  disabled={loading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-base font-semibold" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <Separator className="my-8" />

          {/* Test Accounts */}
          <Card className="border-dashed">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Test Accounts
              </CardTitle>
              <CardDescription>Click any account below to auto-fill login credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[360px] overflow-y-auto pr-2 scrollbar-thin">
              {testAccounts.map((account, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/50 cursor-pointer transition-all duration-200 group hover:shadow-sm"
                  onClick={() => {
                    setUsername(account.username);
                    setPassword(account.password);
                    toast.info(`Selected: ${account.name}`, { description: 'Credentials filled. Click Sign In to continue.' });
                  }}
                >
                  <div className={`h-10 w-10 rounded-full ${account.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {account.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{account.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-medium text-muted-foreground">
                        {account.role}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{account.dept}</p>
                    <p className="text-xs font-mono text-primary mt-1">
                      {account.username} / {account.password}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
