// Supabase Edge Function to securely download course materials from Storage
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Helper function to create error responses
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

    // Verify job ownership
    console.log('Verifying job ownership...');
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, userId, status')
      .eq('id', jobId)
      .eq('userId', user.id)
      .single();

    if (jobError) {
      console.error('Job query error:', jobError);
      return createErrorResponse(`Job query failed: ${jobError.message}`, 500);
    }

    if (!job) {
      console.error('Job not found or access denied');
      return createErrorResponse('Job not found or access denied', 404);
    }

    console.log('Job verified:', { jobId: job.id, status: job.status });

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
      hasDownloadUrl: !!material.downloadUrl,
      hasExpiry: !!material.downloadExpiry,
      storagePath: material.storage_path
    });

    // Check if download has expired
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

    // Try to use the signed URL first if available
    if (material.downloadUrl) {
      console.log('Using existing signed URL for download');
      try {
        const response = await fetch(material.downloadUrl);
        if (response.ok) {
          console.log('Signed URL fetch successful, redirecting');
          return Response.redirect(material.downloadUrl, 302);
        } else {
          console.warn('Signed URL fetch failed:', response.status, response.statusText);
        }
      } catch (fetchError) {
        console.warn('Signed URL fetch error:', fetchError);
      }
    }

    // Fallback to direct storage access
    console.log('Attempting direct storage access...');
    
    // Try different possible file paths
    const possiblePaths = [
      material.storage_path,
      `${jobId}/${material.type}_${material.id}.${material.format}`,
      `${jobId}/${material.name}.${material.format}`,
      `${jobId}/${material.id}.${material.format}`
    ].filter(Boolean);

    console.log('Trying storage paths:', possiblePaths);

    let fileData = null;
    let successfulPath = null;

    for (const filePath of possiblePaths) {
      try {
        console.log(`Attempting to download from path: ${filePath}`);
        const { data, error } = await supabaseAdmin.storage
          .from('course-materials')
          .download(filePath);

        if (!error && data) {
          fileData = data;
          successfulPath = filePath;
          console.log(`Successfully downloaded from path: ${filePath}`);
          break;
        } else if (error) {
          console.log(`Path ${filePath} failed:`, error.message);
        }
      } catch (pathError) {
        console.log(`Path ${filePath} exception:`, pathError);
      }
    }

    if (!fileData || !successfulPath) {
      console.error('File not found in any storage path');
      return createErrorResponse('File not found in storage', 404);
    }

    // Determine content type based on format
    let contentType = 'application/octet-stream';
    
    switch (material.format.toLowerCase()) {
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

    // Create filename
    const sanitizedName = material.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
    const filename = `${sanitizedName}.${material.format}`;

    console.log('Preparing file response:', {
      contentType,
      filename,
      fileSize: fileData.size
    });

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer();

    console.log('File download successful, sending response');

    // Return the file content
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Unexpected error in download-material function:', error);
    console.error('Error stack:', error.stack);
    
    return createErrorResponse(
      `Internal server error: ${error.message}`,
      500
    );
  }
});