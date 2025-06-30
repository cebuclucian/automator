import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'npm:docx@^8.5.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

// Helper function to update job progress
async function updateJobProgress(
  supabase: any,
  jobId: string,
  progress: number,
  status: string,
  statusMessage: string,
  currentStep?: number,
  stepName?: string
) {
  const updateData: any = {
    progressPercent: progress,
    status,
    statusMessage,
    updatedAt: new Date().toISOString(),
  };

  if (currentStep !== undefined) {
    updateData.currentStep = currentStep;
    updateData.totalSteps = 7;
  }

  if (stepName) {
    updateData.stepName = stepName;
  }

  if (status === 'completed') {
    updateData.completedAt = new Date().toISOString();
  }

  const { error } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', jobId);

  if (error) {
    console.error('Error updating job progress:', error);
  }
}

// Helper function to convert JSON structure to DOCX
function createDocxFromStructure(structure: any[]): Document {
  const children: any[] = [];

  structure.forEach(item => {
    switch (item.type) {
      case 'heading1':
        children.push(
          new Paragraph({
            text: item.text,
            heading: HeadingLevel.HEADING_1,
          })
        );
        break;
      case 'heading2':
        children.push(
          new Paragraph({
            text: item.text,
            heading: HeadingLevel.HEADING_2,
          })
        );
        break;
      case 'paragraph':
        children.push(
          new Paragraph({
            children: [new TextRun(item.text)],
          })
        );
        break;
      case 'bullet':
        children.push(
          new Paragraph({
            children: [new TextRun(item.text)],
            bullet: {
              level: 0,
            },
          })
        );
        break;
      default:
        children.push(
          new Paragraph({
            children: [new TextRun(item.text || '')],
          })
        );
    }
  });

  return new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });
}

// Helper function to create and upload DOCX file to Supabase Storage
async function createAndUploadDocx(
  supabase: any,
  structure: any[],
  fileName: string
): Promise<string | null> {
  try {
    console.log('Creating DOCX document with structure:', structure);
    
    // Create DOCX document
    const doc = createDocxFromStructure(structure);
    
    // Generate binary buffer
    console.log('Generating binary buffer...');
    const buffer = await Packer.toBuffer(doc);
    console.log('Buffer generated, size:', buffer.byteLength, 'bytes');
    
    // Generate unique file path
    const timestamp = Date.now();
    const filePath = `materials/${timestamp}/${fileName}.docx`;
    
    console.log('Uploading to storage path:', filePath);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-materials')
      .upload(filePath, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false
      });

    if (error) {
      console.error('Error uploading DOCX file:', error);
      return null;
    }

    console.log('DOCX file uploaded successfully:', filePath);
    return filePath;
  } catch (error) {
    console.error('Error creating/uploading DOCX file:', error);
    return null;
  }
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

  if (req.method !== 'POST') {
    console.error(`Method not allowed: ${req.method}`);
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return createErrorResponse('Missing Supabase configuration', 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase client initialized successfully');

    // Parse request body
    const { jobId, testStructure, ...metadata } = await req.json();
    console.log('Request data:', { jobId, testStructure, metadata });

    if (!jobId) {
      return createErrorResponse('Missing jobId parameter', 400);
    }

    // Verify job exists and get details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('Job not found:', jobError);
      return createErrorResponse('Job not found', 404);
    }

    console.log('Job found:', { id: job.id, status: job.status });

    // Update job to processing status
    await updateJobProgress(supabase, jobId, 10, 'processing', 'Începe generarea materialelor de test...', 1, 'Test DOCX');

    // Use test structure if provided, otherwise use default test
    const structure = testStructure || [{"type": "paragraph", "text": "Acesta este un test."}];
    
    console.log('Using structure for DOCX generation:', structure);

    // Create and upload DOCX file
    const storagePath = await createAndUploadDocx(
      supabase,
      structure,
      'test-document'
    );

    if (!storagePath) {
      console.error('Failed to upload test document');
      await updateJobProgress(supabase, jobId, 50, 'failed', 'Eroare la generarea documentului de test');
      return createErrorResponse('Failed to generate test document', 500);
    }

    // Create download expiry (72 hours from now)
    const downloadExpiry = new Date();
    downloadExpiry.setHours(downloadExpiry.getHours() + 72);

    // Save material to database
    const { error: materialError } = await supabase
      .from('materials')
      .insert({
        jobId: jobId,
        type: 'foundation',
        name: 'Test Document',
        content: JSON.stringify(structure),
        format: 'docx',
        stepNumber: 1,
        storage_path: storagePath,
        downloadExpiry: downloadExpiry.toISOString(),
      });

    if (materialError) {
      console.error('Error saving material to database:', materialError);
      await updateJobProgress(supabase, jobId, 75, 'failed', 'Eroare la salvarea documentului de test');
      return createErrorResponse('Failed to save test document', 500);
    }

    // Mark job as completed
    await updateJobProgress(supabase, jobId, 100, 'completed', 'Documentul de test a fost generat cu succes!');

    console.log('Test document generated successfully for job:', jobId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test document generated successfully',
        storagePath: storagePath,
        structure: structure
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Unexpected error in generate-materials function:', error);
    console.error('Error stack:', error.stack);
    
    return createErrorResponse(
      `Internal server error: ${error.message}`,
      500
    );
  }
});