// Supabase Edge Function to securely download course materials from Storage
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// Initialize Supabase client with service role key for admin access
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Parse URL parameters
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    const materialId = url.searchParams.get('materialId');

    if (!jobId || !materialId) {
      return new Response(
        JSON.stringify({ error: 'Missing jobId or materialId parameters' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Verify job ownership
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, userId, status')
      .eq('id', jobId)
      .eq('userId', user.id)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found or access denied' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Check if job is completed
    if (job.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: 'Job not completed yet' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Get material data
    const { data: material, error: materialError } = await supabaseAdmin
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .eq('jobId', jobId)
      .single();

    if (materialError || !material) {
      return new Response(
        JSON.stringify({ error: 'Material not found' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Check if download has expired
    if (material.downloadExpiry) {
      const expiryDate = new Date(material.downloadExpiry);
      const now = new Date();
      
      if (now > expiryDate) {
        return new Response(
          JSON.stringify({ error: 'Download link has expired' }),
          {
            status: 410,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Get the file from Supabase Storage
    const filePath = `${jobId}/${material.type}_${material.id}.${material.format}`;
    
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('course-materials')
      .download(filePath);

    if (downloadError || !fileData) {
      // Try to get the file using the signed URL if direct download fails
      if (material.downloadUrl) {
        return Response.redirect(material.downloadUrl, 302);
      }
      
      return new Response(
        JSON.stringify({ error: 'File not found in storage' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
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

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer();

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
    console.error('Error downloading material:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});