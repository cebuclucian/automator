// Updated Supabase Edge Function for 7-step course generation process
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

// Initialize Supabase client with service role key for admin access
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

// Claude API Client (simplified)
const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY") || "";
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

// Define type for job parameters - updated for new system
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
  { step: 1, name: 'foundation', title: 'Structură + Obiective + Agendă' },
  { step: 2, name: 'slides', title: 'Slide-uri de prezentare' },
  { step: 3, name: 'facilitator', title: 'Manual facilitator' },
  { step: 4, name: 'participant', title: 'Manual participant' },
  { step: 5, name: 'activities', title: 'Activități și exerciții' },
  { step: 6, name: 'evaluation', title: 'Instrumente de evaluare' },
  { step: 7, name: 'resources', title: 'Resurse suplimentare' }
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
      
      // Create material record
      await createMaterialRecord(stepContent, jobId, stepInfo);
      
      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Generate download URLs for all materials
    await generateDownloadUrls(jobId);
    
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

// Create material record in database
async function createMaterialRecord(stepContent: any, jobId: string, stepInfo: any) {
  try {
    const materialType = stepInfo.name;
    const format = stepInfo.step === 2 ? 'pptx' : 'docx'; // Slides are PowerPoint, others are Word
    
    const material = {
      jobId,
      type: materialType,
      name: stepInfo.title,
      content: stepContent.content,
      format,
      stepNumber: stepInfo.step
    };
    
    const { error } = await supabaseAdmin
      .from("materials")
      .insert([material]);
    
    if (error) throw error;
    
  } catch (error) {
    console.error("Error creating material record:", error);
    throw new Error("Failed to save generated materials");
  }
}

// Generate download URLs for all materials
async function generateDownloadUrls(jobId: string) {
  try {
    // Set expiry date to 72 hours from now
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 72);
    const expiryIso = expiryDate.toISOString();
    
    // Update materials with fake download URLs
    const { data: materials, error: fetchError } = await supabaseAdmin
      .from("materials")
      .select("id, type, stepNumber")
      .eq("jobId", jobId);
    
    if (fetchError) throw fetchError;
    
    // Update each material with a fake download URL
    for (const material of materials) {
      const { error } = await supabaseAdmin
        .from("materials")
        .update({
          downloadUrl: `https://automator.ro/api/download/${jobId}/${material.id}`,
          downloadExpiry: expiryIso
        })
        .eq("id", material.id);
      
      if (error) throw error;
    }
    
    // Create a fake "download all" URL for the job
    const { error } = await supabaseAdmin
      .from("jobs")
      .update({
        downloadUrl: `https://automator.ro/api/download-all/${jobId}`,
        downloadExpiry: expiryIso
      })
      .eq("id", jobId);
    
    if (error) throw error;
    
  } catch (error) {
    console.error("Error generating download URLs:", error);
    throw new Error("Failed to generate download links");
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