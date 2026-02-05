 import { createClient } from 'npm:@supabase/supabase-js@2';
 
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
 
     // Get Cloudflare credentials
     const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
     const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
 
     if (!accountId || !apiToken) {
       throw new Error('Cloudflare Stream not configured');
     }
 
     // Convert base64 to binary for Cloudflare
     const base64Data = file.split(',')[1] || file;
     const binaryString = atob(base64Data);
     const bytes = new Uint8Array(binaryString.length);
     for (let i = 0; i < binaryString.length; i++) {
       bytes[i] = binaryString.charCodeAt(i);
     }
     const videoBlob = new Blob([bytes], { type: 'video/mp4' });
 
     // Upload to Cloudflare Stream using TUS or direct upload
     // First, request a direct upload URL
     const uploadUrlResponse = await fetch(
       `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
       {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${apiToken}`,
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           maxDurationSeconds: 300, // 5 minutes max
           meta: {
             name: filename || 'video.mp4',
           },
         }),
       }
     );
 
     if (!uploadUrlResponse.ok) {
       const errorText = await uploadUrlResponse.text();
       console.error('Cloudflare direct upload URL error:', errorText);
       throw new Error('Failed to get upload URL from Cloudflare');
     }
 
     const uploadUrlData = await uploadUrlResponse.json();
     
     if (!uploadUrlData.success) {
       console.error('Cloudflare API error:', uploadUrlData.errors);
       throw new Error('Cloudflare API error');
     }
 
     const uploadUrl = uploadUrlData.result.uploadURL;
     const streamMediaId = uploadUrlData.result.uid;
 
     // Upload the video file to the direct upload URL
     const uploadFormData = new FormData();
     uploadFormData.append('file', videoBlob, filename || 'video.mp4');
 
     const uploadResponse = await fetch(uploadUrl, {
       method: 'POST',
       body: uploadFormData,
     });
 
     if (!uploadResponse.ok) {
       const errorText = await uploadResponse.text();
       console.error('Cloudflare upload error:', errorText);
       throw new Error('Failed to upload video to Cloudflare');
     }
 
     // Cloudflare Stream URLs
     const videoUrl = `https://customer-${accountId.substring(0, 8)}.cloudflarestream.com/${streamMediaId}/manifest/video.m3u8`;
     const thumbnailUrl = `https://customer-${accountId.substring(0, 8)}.cloudflarestream.com/${streamMediaId}/thumbnails/thumbnail.jpg`;
     
     // Alternative: Use the iframe embed or watch URL
     const watchUrl = `https://watch.cloudflarestream.com/${streamMediaId}`;
 
     // Save video to database
     const { data: video, error: insertError } = await supabase
       .from('videos')
       .insert({
         video_url: watchUrl,
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
       JSON.stringify({ success: true, video, streamMediaId }),
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