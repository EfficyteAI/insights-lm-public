
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, redirecting to dashboard');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        console.log('Attempting sign up for:', email);
        
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) {
          console.error('Sign up error:', error);
          if (error.message.includes('User already registered')) {
            throw new Error('An account with this email already exists. Please sign in instead.');
          } else if (error.message.includes('Password should be at least')) {
            throw new Error('Password should be at least 6 characters long.');
          } else {
            throw error;
          }
        }
        
        console.log('Sign up successful:', data.user?.email);
        
        toast({
          title: "Account created!",
          description: "You have successfully created an account and are now signed in.",
        });
      } else {
        console.log('Attempting sign in for:', email);
      
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      
        if (error) {
          console.error('Sign in error:', error);
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please check your credentials and try again, or create a new account.');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('Please check your email and click the confirmation link before signing in.');
          } else {
            throw error;
          }
        }
      
        console.log('Sign in successful:', data.user?.email);
      
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }

      // The AuthContext will handle the redirect automatically
      
    } catch (error: any) {
      console.error('Auth form error:', error);
      toast({
        title: isSignUp ? "Sign Up Error" : "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
        <CardDescription>
          {isSignUp 
            ? 'Create a new account to get started' 
            : 'Enter your credentials to access your notebooks'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
          </Button>
          
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Create one"
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AuthForm;
