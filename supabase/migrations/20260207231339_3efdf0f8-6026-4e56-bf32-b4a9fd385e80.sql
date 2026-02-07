-- Drop existing UPDATE policy if it exists (to recreate with proper WITH CHECK)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate UPDATE policy with both USING and WITH CHECK clauses
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify INSERT policy exists (should already exist, but ensure it's correct)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);