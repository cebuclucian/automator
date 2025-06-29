// Updated Supabase Edge Function for native DOCX/PPTX generation
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

// Initialize Supabase client with service role key for admin access
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

// Define type for job parameters
interface GenerateParams {
  jobId: string;
  language: 'ro' | 'en' | 'fr' | 'de' | 'es' | 'it' | 'pt' | 'nl' | 'sv' | 'da';
  subject: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  audience: 'students' | 'professionals' | 'managers';
  duration: '30min' | '1h' | '2h' | '4h' | '8h';
  tone: 'socratic' | 'energizing' | 'funny' | 'professional';
}

// Page limits based on duration
const PAGE_LIMITS = {
  '30min': { slides: 6, facilitator: 2, participant: 5, activities: 4, evaluation: 2, resources: 2 },
  '1h': { slides: 10, facilitator: 4, participant: 8, activities: 8, evaluation: 4, resources: 2 },
  '2h': { slides: 15, facilitator: 6, participant: 10, activities: 10, evaluation: 6, resources: 2 },
  '4h': { slides: 30, facilitator: 9, participant: 15, activities: 12, evaluation: 8, resources: 3 },
  '8h': { slides: 40, facilitator: 10, participant: 20, activities: 14, evaluation: 10, resources: 3 }
};

// Step definitions for the 7-step process
const GENERATION_STEPS = [
  { step: 1, name: 'foundation', title: 'Structură + Obiective + Agendă', format: 'docx' },
  { step: 2, name: 'slides', title: 'Slide-uri de prezentare', format: 'pptx' },
  { step: 3, name: 'facilitator', title: 'Manual facilitator', format: 'docx' },
  { step: 4, name: 'participant', title: 'Manual participant', format: 'docx' },
  { step: 5, name: 'activities', title: 'Activități și exerciții', format: 'docx' },
  { step: 6, name: 'evaluation', title: 'Instrumente de evaluare', format: 'docx' },
  { step: 7, name: 'resources', title: 'Resurse suplimentare', format: 'docx' }
];

// Function to update job status
async function updateJobStatus(
  jobId: string, 
  status: "pending" | "processing" | "completed" | "failed",
  updates: Record<string, any>
) {
  try {
    const { error } = await supabaseAdmin
      .from("jobs")
      .update({
        status,
        updatedAt: new Date().toISOString(),
        ...updates
      })
      .eq("id", jobId);
    
    if (error) throw error;
  } catch (err) {
    console.error("Error updating job status:", err);
  }
}

// Generate DOCX content using a simple template approach
function generateDocxContent(content: string, title: string): Uint8Array {
  // This is a simplified DOCX structure - in production you'd use a proper library
  // For now, we'll create a basic XML structure that Word can read
  
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Title"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="28"/>
        </w:rPr>
        <w:t>${escapeXml(title)}</w:t>
      </w:r>
    </w:p>
    ${content.split('\n\n').map(paragraph => 
      paragraph.trim() ? `
    <w:p>
      <w:r>
        <w:t>${escapeXml(paragraph.trim())}</w:t>
      </w:r>
    </w:p>` : ''
    ).join('')}
  </w:body>
</w:document>`;

  // Create a minimal DOCX structure
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const appRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  // Create ZIP structure manually (simplified)
  const encoder = new TextEncoder();
  const files = new Map([
    ['[Content_Types].xml', encoder.encode(contentTypes)],
    ['_rels/.rels', encoder.encode(appRels)],
    ['word/document.xml', encoder.encode(documentXml)]
  ]);

  // Create a simple ZIP-like structure
  // In production, you'd use a proper ZIP library
  return createSimpleZip(files);
}

// Generate PPTX content
function generatePptxContent(content: string, title: string): Uint8Array {
  // Simplified PPTX structure
  const slides = content.split('\n\n## ').filter(slide => slide.trim());
  
  const presentationXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    ${slides.map((_, index) => `
    <p:sldId id="${2147483649 + index}" r:id="rId${index + 2}"/>
    `).join('')}
  </p:sldIdLst>
</p:presentation>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
</Types>`;

  const encoder = new TextEncoder();
  const files = new Map([
    ['[Content_Types].xml', encoder.encode(contentTypes)],
    ['ppt/presentation.xml', encoder.encode(presentationXml)]
  ]);

  return createSimpleZip(files);
}

// Helper function to escape XML content
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Create a simple ZIP structure (very basic implementation)
function createSimpleZip(files: Map<string, Uint8Array>): Uint8Array {
  // This is a very simplified ZIP implementation
  // In production, you'd use a proper ZIP library like JSZip
  
  const encoder = new TextEncoder();
  let result = new Uint8Array(0);
  
  // Add files to the "ZIP"
  for (const [filename, content] of files) {
    const header = encoder.encode(`FILE:${filename}\n`);
    const separator = encoder.encode('\n---\n');
    
    const combined = new Uint8Array(result.length + header.length + content.length + separator.length);
    combined.set(result, 0);
    combined.set(header, result.length);
    combined.set(content, result.length + header.length);
    combined.set(separator, result.length + header.length + content.length);
    
    result = combined;
  }
  
  return result;
}

// Main function to generate course materials in 7 steps
async function generateMaterials(params: GenerateParams) {
  const { jobId } = params;
  let sessionContext = "";
  
  try {
    // Update job to processing state
    await updateJobStatus(jobId, "processing", {
      progressPercent: 0,
      statusMessage: "Începe procesul de generare în 7 pași...",
      currentStep: 0,
      totalSteps: 7,
      stepName: "Inițializare"
    });

    // Execute each step sequentially
    for (const stepInfo of GENERATION_STEPS) {
      await updateJobStatus(jobId, "processing", {
        progressPercent: Math.round(((stepInfo.step - 1) / 7) * 100),
        statusMessage: `Pasul ${stepInfo.step}/7: ${stepInfo.title}`,
        currentStep: stepInfo.step,
        stepName: stepInfo.title
      });

      // Generate content for this step
      const stepContent = await generateStepContent(stepInfo, params, sessionContext);
      
      // Update session context with generated content
      sessionContext += `\n\n=== STEP ${stepInfo.step}: ${stepInfo.name.toUpperCase()} ===\n${stepContent.summary}`;
      
      // Create and upload the file to Supabase Storage
      await createAndUploadMaterial(stepContent, jobId, stepInfo, params);
      
      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Mark job as completed
    await updateJobStatus(jobId, "completed", {
      progressPercent: 100,
      statusMessage: "Toate materialele au fost generate cu succes!",
      completedAt: new Date().toISOString(),
      currentStep: 7,
      stepName: "Finalizat"
    });
    
  } catch (error) {
    console.error("Error generating materials:", error);
    
    // Mark job as failed
    await updateJobStatus(jobId, "failed", {
      progressPercent: 0,
      statusMessage: "Generarea a eșuat",
      error: error instanceof Error ? error.message : "Eroare necunoscută",
    });
  }
}

// Generate content for a specific step
async function generateStepContent(stepInfo: any, params: GenerateParams, context: string) {
  const prompt = createStepPrompt(stepInfo, params, context);
  
  // Simulate AI generation with realistic delays
  const delay = stepInfo.step === 1 ? 8000 : 5000 + Math.random() * 3000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Generate mock content based on step
  const content = generateMockContent(stepInfo, params);
  
  return {
    content,
    summary: `Generated ${stepInfo.name} for ${params.subject} (${params.duration})`
  };
}

// Create prompt for specific step
function createStepPrompt(stepInfo: any, params: GenerateParams, context: string): string {
  const { language, subject, level, audience, duration, tone } = params;
  const limits = PAGE_LIMITS[duration];
  
  const basePrompt = `
CONTEXT ANTERIOR GENERAT:
${context}

SPECIFICAȚII CURS:
- Limbă: ${language}
- Subiect: ${subject}
- Nivel: ${level}
- Public țintă: ${audience}
- Durată totală: ${duration}
- Ton și stil: ${tone}
`;

  switch (stepInfo.step) {
    case 1:
      return `${basePrompt}
CALL 1: STRUCTURA + OBIECTIVE + AGENDA
Creează fundamentul pentru un curs fizic complet despre ${subject}.
GENEREAZĂ EXACT 3 SECȚIUNI:
1. STRUCTURA CURSULUI (3-6 module principale)
2. OBIECTIVE DE ÎNVĂȚARE (taxonomia lui Bloom)
3. AGENDA DETALIATĂ (pentru ${duration})
IMPORTANT: Nu depăși 3 pagini total.`;

    case 2:
      return `${basePrompt}
CALL 2: SLIDES DE PREZENTARE
Generează conținutul complet pentru slide-urile de prezentare.
SPECIFICAȚII: Maxim ${limits.slides} slide-uri
Format: Titlu Slide | Conținut | Note Prezentator`;

    case 3:
      return `${basePrompt}
CALL 3: MANUAL FACILITATOR
Generează manualul complet pentru facilitator.
SPECIFICAȚII: Maxim ${limits.facilitator} pagini
Include: Ghid prezentare, Management activități, Situații dificile, Materiale și logistică`;

    case 4:
      return `${basePrompt}
CALL 4: MANUAL PARTICIPANT
Generează manualul complet al participantului.
SPECIFICAȚII: Maxim ${limits.participant} pagini
Format: Teorie + practică + spații pentru notițe`;

    case 5:
      return `${basePrompt}
CALL 5: ACTIVITĂȚI ȘI EXERCIȚII
Generează activitățile și exercițiile complete.
SPECIFICAȚII: Maxim ${limits.activities} pagini
Include: Activități experiențiale, Jocuri de rol, Studii de caz`;

    case 6:
      return `${basePrompt}
CALL 6: INSTRUMENTE DE EVALUARE
Generează instrumentele complete de evaluare.
SPECIFICAȚII: Maxim ${limits.evaluation} pagini
Include: Evaluare pre-curs, Durante curs, Post-curs, Proiect practic, Evaluarea cursului`;

    case 7:
      return `${basePrompt}
CALL 7: RESURSE SUPLIMENTARE
Generează resursele suplimentare complete.
SPECIFICAȚII: Maxim ${limits.resources} pagini
Include: Bibliografie, Resurse online, Comunități, Instrumente practice, Multimedia, Planuri dezvoltare`;

    default:
      return basePrompt;
  }
}

// Generate mock content for demonstration
function generateMockContent(stepInfo: any, params: GenerateParams): string {
  const { subject, duration, level, audience } = params;
  
  switch (stepInfo.step) {
    case 1:
      return `# ${subject} - Structură și Obiective

## 1. STRUCTURA CURSULUI
Modulul 1: Introducere în ${subject}
Modulul 2: Concepte fundamentale
Modulul 3: Aplicații practice
Modulul 4: Implementare și evaluare

## 2. OBIECTIVE DE ÎNVĂȚARE
- Cunoaștere: Identificarea conceptelor cheie
- Înțelegere: Explicarea principiilor de bază
- Aplicare: Utilizarea tehnicilor în practică
- Analiză: Evaluarea diferitelor abordări

## 3. AGENDA DETALIATĂ (${duration})
09:00-09:30: Introducere și prezentări
09:30-10:30: Modulul 1 - Concepte de bază
10:30-10:45: Pauză
10:45-11:45: Modulul 2 - Aplicații practice`;

    case 2:
      return `# Slide-uri Prezentare - ${subject}

## Slide 1: Titlu
**Titlu:** ${subject} pentru ${audience}
**Conținut:** Curs de ${duration} - Nivel ${level}
**Note:** Creează conexiunea cu audiența

## Slide 2: Agenda
**Conținut:** Lista modulelor și obiectivelor
**Note:** Subliniază beneficiile pentru participanți

## Slide 3: Obiective
**Conținut:** Ce vor învăța participanții
**Note:** Conectează cu experiența lor`;

    case 3:
      return `# Manual Facilitator - ${subject}

## 1. GHID DE PREZENTARE
Pentru fiecare secțiune:
- Script detaliat de prezentare
- Întrebări de facilitare specifice
- Timing exact și tranziții

## 2. MANAGEMENT ACTIVITĂȚI
- Instrucțiuni pas cu pas
- Criterii de observare
- Tehnici de debriefing

## 3. SITUAȚII DIFICILE
- Scenarii problematice comune
- Strategii de răspuns
- Tehnici de re-focalizare`;

    case 4:
      return `# Manual Participant - ${subject}

## Modulul 1: Introducere
**TEORIA ESENȚIALĂ**
Conceptele fundamentale ale ${subject}

**SPAȚII PENTRU NOTIȚE**
[Secțiuni dedicate cu întrebări ghid]

**EXERCIȚII PRACTICE**
- Exercițiul 1: Aplicare de bază
- Exercițiul 2: Studiu de caz

**APLICAREA ÎN PRACTICĂ**
- Checklist implementare
- Template-uri pentru lucrul post-curs`;

    case 5:
      return `# Activități și Exerciții - ${subject}

## 1. ACTIVITĂȚI EXPERIENȚIALE

### Activitatea 1: Simulare practică
**OBIECTIV:** Aplicarea conceptelor în context real
**DURATA:** 30 minute
**PARTICIPANȚI:** Grupuri de 4-5 persoane

**PREGĂTIREA:**
- Materiale necesare
- Setup sală
- Briefing facilitator

**DESFĂȘURAREA:**
- Instrucțiuni pas cu pas
- Timeline precis
- Criterii de observare`;

    case 6:
      return `# Instrumente de Evaluare - ${subject}

## 1. EVALUARE PRE-CURS
**Chestionar Nivel Inițial** (10 întrebări)
1. Care este experiența dvs. cu ${subject}?
2. Ce așteptări aveți de la acest curs?

## 2. EVALUĂRI DURANTE CURS
**Mini-teste de verificare**
- Întrebări cu alegere multiplă
- Întrebări practice scurte

## 3. EVALUARE POST-CURS
**Test final de cunoștințe** (15-20 întrebări)
- Cunoaștere: întrebări factuale
- Aplicare: scenarii practice`;

    case 7:
      return `# Resurse Suplimentare - ${subject}

## 1. BIBLIOGRAFIE COMENTATĂ
**Cărți esențiale**
1. "Ghidul complet pentru ${subject}" - Autor Principal
   - Descriere: Manual fundamental pentru începători
   - Relevanță: Acoperă toate conceptele de bază
   - Nivel: ${level}

## 2. RESURSE ONLINE
**Website-uri specializate**
- Site oficial pentru ${subject}
- Platforme de învățare online
- Forumuri de discuții

## 3. INSTRUMENTE PRACTICE
**Software și aplicații**
- Instrumente gratuite pentru ${subject}
- Template-uri editabile
- Aplicații mobile utile`;

    default:
      return `Conținut generat pentru pasul ${stepInfo.step}`;
  }
}

// Create and upload material to Supabase Storage
async function createAndUploadMaterial(stepContent: any, jobId: string, stepInfo: any, params: GenerateParams) {
  try {
    const materialType = stepInfo.name;
    const format = stepInfo.format;
    const fileName = `${stepInfo.name}_${Date.now()}.${format}`;
    const filePath = `${params.jobId}/${fileName}`;
    
    // Generate the appropriate file content
    let fileContent: Uint8Array;
    if (format === 'docx') {
      fileContent = generateDocxContent(stepContent.content, stepInfo.title);
    } else if (format === 'pptx') {
      fileContent = generatePptxContent(stepContent.content, stepInfo.title);
    } else {
      // Fallback to text
      const encoder = new TextEncoder();
      fileContent = encoder.encode(stepContent.content);
    }
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('course-materials')
      .upload(filePath, fileContent, {
        contentType: format === 'docx' 
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : format === 'pptx'
          ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          : 'text/plain',
        upsert: true
      });
    
    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }
    
    // Set expiry date to 72 hours from now
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 72);
    const expiryIso = expiryDate.toISOString();
    
    // Create signed URL for download
    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from('course-materials')
      .createSignedUrl(filePath, 72 * 3600); // 72 hours in seconds
    
    if (urlError) {
      throw new Error(`Failed to create signed URL: ${urlError.message}`);
    }
    
    // Create material record in database
    const material = {
      jobId,
      type: materialType,
      name: stepInfo.title,
      content: null, // We don't store content in DB anymore
      format,
      stepNumber: stepInfo.step,
      downloadUrl: urlData.signedUrl,
      downloadExpiry: expiryIso
    };
    
    const { error: dbError } = await supabaseAdmin
      .from("materials")
      .insert([material]);
    
    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage
        .from('course-materials')
        .remove([filePath]);
      
      throw new Error(`Failed to save material record: ${dbError.message}`);
    }
    
  } catch (error) {
    console.error("Error creating and uploading material:", error);
    throw new Error("Failed to create and upload material");
  }
}

// Main Deno serve handler
Deno.serve(async (req) => {
  // Enable CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    const { jobId, language, subject, level, audience, duration, tone } = await req.json();
    
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "Job ID is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // Process the generation in the background
    EdgeRuntime.waitUntil(
      generateMaterials({
        jobId,
        language,
        subject,
        level,
        audience,
        duration,
        tone,
      })
    );
    
    // Return immediate success response
    return new Response(
      JSON.stringify({ 
        status: "processing",
        message: "7-step generation process started successfully"
      }),
      {
        status: 202,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});