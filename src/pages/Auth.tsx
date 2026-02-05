 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useAuth } from '@/hooks/useAuth';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { useToast } from '@/hooks/use-toast';
 
 export default function Auth() {
   const [isLogin, setIsLogin] = useState(true);
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const { signIn, signUp } = useAuth();
   const { toast } = useToast();
   const navigate = useNavigate();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
 
     if (isLogin) {
       const { error } = await signIn(email, password);
       if (error) {
         toast({
           title: "Sign in failed",
           description: error.message,
           variant: "destructive",
         });
       } else {
         navigate('/');
       }
     } else {
       const { error } = await signUp(email, password);
       if (error) {
         toast({
           title: "Sign up failed",
           description: error.message,
           variant: "destructive",
         });
       } else {
         toast({
           title: "Check your email",
           description: "We sent you a confirmation link to verify your account.",
         });
       }
     }
 
     setLoading(false);
   };
 
   return (
     <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
       <div className="w-full max-w-sm space-y-8">
         {/* Logo */}
         <div className="text-center">
           <h1 className="text-3xl font-bold tracking-wide">riehls</h1>
           <p className="mt-2 text-muted-foreground">
             {isLogin ? 'Welcome back' : 'Create your account'}
           </p>
         </div>
 
         {/* Form */}
         <form onSubmit={handleSubmit} className="space-y-6">
           <div className="space-y-2">
             <Label htmlFor="email">Email</Label>
             <Input
               id="email"
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               placeholder="you@example.com"
               required
               className="bg-secondary"
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="password">Password</Label>
             <Input
               id="password"
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               placeholder="••••••••"
               required
               minLength={6}
               className="bg-secondary"
             />
           </div>
 
           <Button type="submit" className="w-full" disabled={loading}>
             {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
           </Button>
         </form>
 
         {/* Toggle */}
         <div className="text-center">
           <button
             type="button"
             onClick={() => setIsLogin(!isLogin)}
             className="text-sm text-muted-foreground hover:text-foreground"
           >
             {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
           </button>
         </div>
       </div>
     </div>
   );
 }