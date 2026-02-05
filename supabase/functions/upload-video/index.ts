 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 Deno.serve(async (req) => {
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     // Get authorization header
     const authHeader = req.headers.get('Authorization');
     if (!authHeader) {
       throw new Error('No authorization header');
     }
 
     // Create Supabase client
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseAnonKey, {
       global: { headers: { Authorization: authHeader } },
     });
 
     // Get user
     const { data: { user }, error: userError } = await supabase.auth.getUser();
     if (userError || !user) {
       throw new Error('Unauthorized');
     }
 
     // Check admin role
     const { data: roleData } = await supabase
       .from('user_roles')
       .select('role')
       .eq('user_id', user.id)
       .eq('role', 'admin')
       .maybeSingle();
 
     if (!roleData) {
       throw new Error('Admin access required');
     }
 
     // Get request body
     const { file, filename, caption } = await req.json();
     if (!file) {
       throw new Error('No file provided');
     }
 
     // Get Cloudinary credentials
     const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
     const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
     const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
 
     if (!cloudName || !apiKey || !apiSecret) {
       throw new Error('Cloudinary not configured');
     }
 
     // Generate signature for upload
     const timestamp = Math.round(Date.now() / 1000);
     const folder = 'riehls';
     
     // Create signature string
     const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
     const encoder = new TextEncoder();
     const data = encoder.encode(signatureString);
     const hashBuffer = await crypto.subtle.digest('SHA-1', data);
     const hashArray = Array.from(new Uint8Array(hashBuffer));
     const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
 
     // Upload to Cloudinary
     const formData = new FormData();
     formData.append('file', file);
     formData.append('api_key', apiKey);
     formData.append('timestamp', timestamp.toString());
     formData.append('signature', signature);
     formData.append('folder', folder);
     formData.append('resource_type', 'video');
 
     const cloudinaryResponse = await fetch(
       `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
       {
         method: 'POST',
         body: formData,
       }
     );
 
     if (!cloudinaryResponse.ok) {
       const errorText = await cloudinaryResponse.text();
       console.error('Cloudinary error:', errorText);
       throw new Error('Failed to upload to Cloudinary');
     }
 
     const cloudinaryData = await cloudinaryResponse.json();
     const videoUrl = cloudinaryData.secure_url;
     const thumbnailUrl = videoUrl.replace(/\.[^.]+$/, '.jpg');
 
     // Save video to database
     const { data: video, error: insertError } = await supabase
       .from('videos')
       .insert({
         video_url: videoUrl,
         thumbnail_url: thumbnailUrl,
         caption: caption || null,
         creator_id: user.id,
         is_published: true,
       })
       .select()
       .single();
 
     if (insertError) {
       console.error('Database error:', insertError);
       throw new Error('Failed to save video');
     }
 
     return new Response(
       JSON.stringify({ success: true, video }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
 
   } catch (error) {
     console.error('Upload error:', error);
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     return new Response(
       JSON.stringify({ error: errorMessage }),
       { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });