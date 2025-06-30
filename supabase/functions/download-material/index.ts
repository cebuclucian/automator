// Supabase Edge Function to securely download course materials from Storage
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Helper function to create error responses with consistent CORS headers
function createErrorResponse(message: string, status: number = 500) {
  console.error(`Error Response (${status}):`, message);
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

Deno.serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Request received: ${req.method} ${req.url}`);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'GET') {
    console.error(`Method not allowed: ${req.method}`);
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseServiceKey?.length || 0
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      return createErrorResponse('Missing Supabase configuration', 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase admin client initialized successfully');

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header check:', {
      hasHeader: !!authHeader,
      startsWithBearer: authHeader?.startsWith('Bearer ') || false
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('Missing or invalid authorization header', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);

    // Verify user authentication
    console.log('Verifying user authentication...');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError);
      return createErrorResponse(`Authentication failed: ${authError.message}`, 401);
    }
    
    if (!user) {
      console.error('No user found from token');
      return createErrorResponse('Invalid authentication token', 401);
    }

    console.log('User authenticated successfully:', { userId: user.id, email: user.email });

    // Parse URL parameters
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    const materialId = url.searchParams.get('materialId');

    console.log('URL parameters:', { jobId, materialId });

    if (!jobId || !materialId) {
      return createErrorResponse('Missing jobId or materialId parameters', 400);
    }

    // Verify job ownership first - explicit ownership check
    console.log('Verifying job ownership...');
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, userId, status')
      .eq('id', jobId)
      .single();

    if (jobError) {
      console.error('Job query error:', jobError);
      return createErrorResponse(`Job query failed: ${jobError.message}`, 500);
    }

    if (!job) {
      console.error('Job not found');
      return createErrorResponse('Job not found', 404);
    }

    // Explicit ownership verification
    if (job.userId !== user.id) {
      console.error('Access denied: User does not own this job', {
        jobUserId: job.userId,
        requestUserId: user.id
      });
      return createErrorResponse('Access denied: You do not have permission to access this job', 403);
    }

    console.log('Job ownership verified:', { jobId: job.id, status: job.status });

    // Check if job is completed
    if (job.status !== 'completed') {
      console.error('Job not completed:', job.status);
      return createErrorResponse('Job not completed yet', 400);
    }

    // Get material data
    console.log('Fetching material data...');
    const { data: material, error: materialError } = await supabaseAdmin
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .eq('jobId', jobId)
      .single();

    if (materialError) {
      console.error('Material query error:', materialError);
      return createErrorResponse(`Material query failed: ${materialError.message}`, 500);
    }

    if (!material) {
      console.error('Material not found');
      return createErrorResponse('Material not found', 404);
    }

    console.log('Material found:', {
      id: material.id,
      name: material.name,
      format: material.format,
      hasStoragePath: !!material.storage_path,
      storagePath: material.storage_path
    });

    // Check if storage path exists
    if (!material.storage_path) {
      console.error('No storage path available for material');
      return createErrorResponse('Material file not available', 404);
    }

    // Check if download has expired (if downloadExpiry is set)
    if (material.downloadExpiry) {
      const expiryDate = new Date(material.downloadExpiry);
      const now = new Date();
      
      console.log('Expiry check:', {
        expiryDate: expiryDate.toISOString(),
        now: now.toISOString(),
        isExpired: now > expiryDate
      });
      
      if (now > expiryDate) {
        return createErrorResponse('Download link has expired', 410);
      }
    }

    // Generate a fresh pre-signed URL from Supabase Storage
    console.log('Generating fresh pre-signed URL for storage path:', material.storage_path);
    
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('course-materials')
      .createSignedUrl(material.storage_path, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error('Error generating signed URL:', signedUrlError);
      return createErrorResponse(`Failed to generate download URL: ${signedUrlError.message}`, 500);
    }

    if (!signedUrlData?.signedUrl) {
      console.error('No signed URL returned from storage');
      return createErrorResponse('Failed to generate download URL', 500);
    }

    console.log('Fresh pre-signed URL generated successfully');

    // Return the file content directly instead of redirecting
    try {
      console.log('Fetching file content from storage...');
      const fileResponse = await fetch(signedUrlData.signedUrl);
      
      if (!fileResponse.ok) {
        console.error('Failed to fetch file from storage:', fileResponse.status, fileResponse.statusText);
        return createErrorResponse(`Failed to fetch file: ${fileResponse.statusText}`, fileResponse.status);
      }

      const fileBlob = await fileResponse.blob();
      console.log('File fetched successfully, size:', fileBlob.size, 'bytes');

      // Determine content type based on file format
      let contentType = 'application/octet-stream';
      switch (material.format?.toLowerCase()) {
        case 'docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'pptx':
          contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          break;
        case 'pdf':
          contentType = 'application/pdf';
          break;
        case 'txt':
          contentType = 'text/plain';
          break;
      }

      // Return the file with appropriate headers
      return new Response(fileBlob, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${material.name}.${material.format}"`,
          'Content-Length': fileBlob.size.toString(),
        },
      });

    } catch (fetchError) {
      console.error('Error fetching file content:', fetchError);
      return createErrorResponse(`Failed to fetch file content: ${fetchError.message}`, 500);
    }

  } catch (error) {
    console.error('Unexpected error in download-material function:', error);
    console.error('Error stack:', error.stack);
    
    return createErrorResponse(
      `Internal server error: ${error.message}`,
      500
    );
  }
});