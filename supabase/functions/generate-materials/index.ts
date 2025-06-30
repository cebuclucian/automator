import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import HTMLtoDOCX from 'npm:html-docx-js@0.6.1';
import PptxGenJS from 'npm:pptxgenjs@3.12.0';

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

// Helper function to generate HTML content for DOCX files
function generateHTMLContent(type: string, metadata: any): string {
  const { subject, language, level, audience, duration, tone, context } = metadata;
  
  const isRomanian = language === 'ro';
  
  switch (type) {
    case 'foundation':
      return generateFoundationHTML(subject, level, audience, duration, tone, context, isRomanian);
    case 'facilitator':
      return generateFacilitatorHTML(subject, level, audience, duration, tone, context, isRomanian);
    case 'participant':
      return generateParticipantHTML(subject, level, audience, duration, tone, context, isRomanian);
    case 'activities':
      return generateActivitiesHTML(subject, level, audience, duration, tone, context, isRomanian);
    case 'evaluation':
      return generateEvaluationHTML(subject, level, audience, duration, tone, context, isRomanian);
    case 'resources':
      return generateResourcesHTML(subject, level, audience, duration, tone, context, isRomanian);
    default:
      return '<html><body><h1>Content not available</h1></body></html>';
  }
}

// Helper function to generate PPTX content structure
function generatePPTXContent(metadata: any): any[] {
  const { subject, language, level, audience, duration, tone, context } = metadata;
  const isRomanian = language === 'ro';
  
  const slides = [];
  
  // Slide 1: Title
  slides.push({
    title: subject,
    content: [
      { text: `${isRomanian ? 'Curs pentru' : 'Course for'} ${audience}`, options: { fontSize: 18 } },
      { text: `${isRomanian ? 'Nivel' : 'Level'}: ${level}`, options: { fontSize: 16 } },
      { text: `${isRomanian ? 'Durată' : 'Duration'}: ${duration}`, options: { fontSize: 16 } }
    ]
  });
  
  // Slide 2: Objectives
  slides.push({
    title: isRomanian ? 'Obiectivele cursului' : 'Course Objectives',
    content: [
      { text: isRomanian ? '• Înțelegerea conceptelor de bază' : '• Understanding basic concepts', options: { fontSize: 16 } },
      { text: isRomanian ? '• Aplicarea practică a cunoștințelor' : '• Practical application of knowledge', options: { fontSize: 16 } },
      { text: isRomanian ? '• Dezvoltarea competențelor specifice' : '• Development of specific skills', options: { fontSize: 16 } },
      { text: isRomanian ? '• Evaluarea progresului personal' : '• Personal progress evaluation', options: { fontSize: 16 } }
    ]
  });
  
  // Slide 3: Agenda
  slides.push({
    title: isRomanian ? 'Agenda' : 'Agenda',
    content: [
      { text: `1. ${isRomanian ? 'Introducere' : 'Introduction'} (15 min)`, options: { fontSize: 16 } },
      { text: `2. ${isRomanian ? 'Concepte fundamentale' : 'Fundamental concepts'} (45 min)`, options: { fontSize: 16 } },
      { text: `3. ${isRomanian ? 'Pauză' : 'Break'} (15 min)`, options: { fontSize: 16 } },
      { text: `4. ${isRomanian ? 'Aplicații practice' : 'Practical applications'} (60 min)`, options: { fontSize: 16 } },
      { text: `5. ${isRomanian ? 'Exerciții' : 'Exercises'} (30 min)`, options: { fontSize: 16 } },
      { text: `6. ${isRomanian ? 'Evaluare și închidere' : 'Evaluation and closing'} (15 min)`, options: { fontSize: 16 } }
    ]
  });
  
  // Slide 4: Key Concepts
  slides.push({
    title: isRomanian ? 'Concepte cheie' : 'Key Concepts',
    content: [
      { text: isRomanian ? '• Definiții importante' : '• Important definitions', options: { fontSize: 16 } },
      { text: isRomanian ? '• Principii fundamentale' : '• Fundamental principles', options: { fontSize: 16 } },
      { text: isRomanian ? '• Teorii relevante' : '• Relevant theories', options: { fontSize: 16 } },
      { text: isRomanian ? '• Best practices' : '• Best practices', options: { fontSize: 16 } }
    ]
  });
  
  // Slide 5: Practical Applications
  slides.push({
    title: isRomanian ? 'Aplicații practice' : 'Practical Applications',
    content: [
      { text: isRomanian ? '• Studii de caz reale' : '• Real case studies', options: { fontSize: 16 } },
      { text: isRomanian ? '• Exemple din industrie' : '• Industry examples', options: { fontSize: 16 } },
      { text: isRomanian ? '• Exerciții hands-on' : '• Hands-on exercises', options: { fontSize: 16 } },
      { text: isRomanian ? '• Simulări' : '• Simulations', options: { fontSize: 16 } }
    ]
  });
  
  // Slide 6: Q&A
  slides.push({
    title: isRomanian ? 'Întrebări și răspunsuri' : 'Questions and Answers',
    content: [
      { text: isRomanian ? 'Sesiune de Q&A' : 'Q&A Session', options: { fontSize: 20 } }
    ]
  });
  
  // Slide 7: Thank You
  slides.push({
    title: isRomanian ? 'Mulțumiri' : 'Thank You',
    content: [
      { text: isRomanian ? 'Vă mulțumim pentru participare!' : 'Thank you for your participation!', options: { fontSize: 18 } },
      { text: 'Contact: contact@automator.ro', options: { fontSize: 16 } }
    ]
  });
  
  return slides;
}

function generateFoundationHTML(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Structura și Obiectivele Cursului: ${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .info-item { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>STRUCTURA ȘI OBIECTIVELE CURSULUI: ${subject}</h1>
    
    <h2>INFORMAȚII GENERALE</h2>
    <div class="info-grid">
        <div class="info-item">
            <strong>Subiect:</strong> ${subject}
        </div>
        <div class="info-item">
            <strong>Nivel:</strong> ${level}
        </div>
        <div class="info-item">
            <strong>Public țintă:</strong> ${audience}
        </div>
        <div class="info-item">
            <strong>Durată:</strong> ${duration}
        </div>
        <div class="info-item">
            <strong>Context:</strong> ${context}
        </div>
        <div class="info-item">
            <strong>Ton:</strong> ${tone}
        </div>
    </div>

    <h2>OBIECTIVE DE ÎNVĂȚARE</h2>
    <p>La sfârșitul acestui curs, participanții vor fi capabili să:</p>
    <ul>
        <li>Înțeleagă conceptele fundamentale ale ${subject}</li>
        <li>Aplice principiile de bază în situații practice</li>
        <li>Analizeze și rezolve probleme specifice domeniului</li>
        <li>Dezvolte competențe practice relevante</li>
        <li>Evalueze și îmbunătățească performanța proprie</li>
    </ul>

    <h2>AGENDA DETALIATĂ</h2>
    <ul>
        <li><strong>Introducere și prezentări</strong> (15 minute)</li>
        <li><strong>Concepte fundamentale</strong> (30% din timp)</li>
        <li><strong>Aplicații practice</strong> (40% din timp)</li>
        <li><strong>Exerciții și activități</strong> (20% din timp)</li>
        <li><strong>Evaluare și feedback</strong> (10% din timp)</li>
    </ul>

    <h2>METODOLOGIE</h2>
    <ul>
        <li>Prezentări interactive</li>
        <li>Studii de caz</li>
        <li>Exerciții practice</li>
        <li>Discuții în grup</li>
        <li>Evaluare continuă</li>
    </ul>

    <h2>RESURSE NECESARE</h2>
    <ul>
        <li>Materiale de prezentare</li>
        <li>Fișe de lucru</li>
        <li>Studii de caz</li>
        <li>Instrumente de evaluare</li>
        <li>Resurse suplimentare pentru dezvoltare continuă</li>
    </ul>
</body>
</html>`;
  } else {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Course Structure and Objectives: ${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .info-item { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>COURSE STRUCTURE AND OBJECTIVES: ${subject}</h1>
    
    <h2>GENERAL INFORMATION</h2>
    <div class="info-grid">
        <div class="info-item">
            <strong>Subject:</strong> ${subject}
        </div>
        <div class="info-item">
            <strong>Level:</strong> ${level}
        </div>
        <div class="info-item">
            <strong>Target Audience:</strong> ${audience}
        </div>
        <div class="info-item">
            <strong>Duration:</strong> ${duration}
        </div>
        <div class="info-item">
            <strong>Context:</strong> ${context}
        </div>
        <div class="info-item">
            <strong>Tone:</strong> ${tone}
        </div>
    </div>

    <h2>LEARNING OBJECTIVES</h2>
    <p>By the end of this course, participants will be able to:</p>
    <ul>
        <li>Understand fundamental concepts of ${subject}</li>
        <li>Apply basic principles in practical situations</li>
        <li>Analyze and solve domain-specific problems</li>
        <li>Develop relevant practical skills</li>
        <li>Evaluate and improve their own performance</li>
    </ul>

    <h2>DETAILED AGENDA</h2>
    <ul>
        <li><strong>Introduction and presentations</strong> (15 minutes)</li>
        <li><strong>Fundamental concepts</strong> (30% of time)</li>
        <li><strong>Practical applications</strong> (40% of time)</li>
        <li><strong>Exercises and activities</strong> (20% of time)</li>
        <li><strong>Evaluation and feedback</strong> (10% of time)</li>
    </ul>

    <h2>METHODOLOGY</h2>
    <ul>
        <li>Interactive presentations</li>
        <li>Case studies</li>
        <li>Practical exercises</li>
        <li>Group discussions</li>
        <li>Continuous evaluation</li>
    </ul>

    <h2>REQUIRED RESOURCES</h2>
    <ul>
        <li>Presentation materials</li>
        <li>Worksheets</li>
        <li>Case studies</li>
        <li>Evaluation tools</li>
        <li>Additional resources for continuous development</li>
    </ul>
</body>
</html>`;
  }
}

function generateFacilitatorHTML(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Manual Facilitator: ${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .checklist { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .checklist ul { list-style-type: none; padding-left: 0; }
        .checklist li:before { content: "☐ "; margin-right: 8px; }
        .tip { background: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>MANUAL FACILITATOR: ${subject}</h1>
    
    <h2>PREGĂTIREA CURSULUI</h2>
    <div class="checklist">
        <h3>Înainte de curs:</h3>
        <ul>
            <li>Verificați echipamentele tehnice</li>
            <li>Pregătiți materialele pentru participanți</li>
            <li>Testați prezentarea</li>
            <li>Pregătiți activitățile interactive</li>
            <li>Planificați pauzele</li>
        </ul>
    </div>

    <h2>GHID DE FACILITARE</h2>
    
    <h3>Introducerea (15 minute):</h3>
    <ul>
        <li>Salutați participanții</li>
        <li>Prezentați-vă pe scurt</li>
        <li>Explicați obiectivele cursului</li>
        <li>Stabiliți regulile de bază</li>
        <li>Creați o atmosferă relaxată</li>
    </ul>

    <h3>Concepte fundamentale (45 minute):</h3>
    <ul>
        <li>Prezentați teoria pas cu pas</li>
        <li>Folosiți exemple concrete</li>
        <li>Verificați înțelegerea regulat</li>
        <li>Încurajați întrebările</li>
        <li>Adaptați ritmul la audiență</li>
    </ul>

    <h3>Aplicații practice (60 minute):</h3>
    <ul>
        <li>Introduceți studiile de caz</li>
        <li>Formați grupuri de lucru</li>
        <li>Monitorizați progresul</li>
        <li>Oferiți feedback constructiv</li>
        <li>Facilitați discuțiile</li>
    </ul>

    <h2>MANAGEMENTUL GRUPULUI</h2>
    
    <h3>Tehnici de facilitare:</h3>
    <ul>
        <li>Ascultare activă</li>
        <li>Întrebări deschise</li>
        <li>Reformularea ideilor</li>
        <li>Gestionarea conflictelor</li>
        <li>Încurajarea participării</li>
    </ul>

    <div class="tip">
        <strong>Sfat:</strong> Mențineți contactul vizual cu toți participanții și adaptați-vă stilul de comunicare la nevoile grupului.
    </div>

    <h3>Situații dificile:</h3>
    <ul>
        <li><strong>Participanți dominatori:</strong> Redirecționați politicos către alții</li>
        <li><strong>Persoane timide:</strong> Încurajați prin întrebări directe</li>
        <li><strong>Întrebări dificile:</strong> Recunoașteți și promiteți să reveniți</li>
        <li><strong>Tensiuni în grup:</strong> Mediați și refocalizați pe obiective</li>
        <li><strong>Probleme tehnice:</strong> Aveți întotdeauna un plan B</li>
    </ul>

    <h2>EVALUAREA PROGRESULUI</h2>
    <ul>
        <li>Observarea comportamentului</li>
        <li>Întrebări de verificare</li>
        <li>Exerciții practice</li>
        <li>Feedback verbal</li>
        <li>Auto-evaluarea participanților</li>
    </ul>

    <h2>ÎNCHIDEREA CURSULUI</h2>
    <h3>Ultimele 15 minute:</h3>
    <ul>
        <li>Rezumați punctele cheie</li>
        <li>Verificați atingerea obiectivelor</li>
        <li>Colectați feedback</li>
        <li>Distribuiți certificatele</li>
        <li>Planificați follow-up-ul</li>
    </ul>

    <div class="checklist">
        <h3>Materiale necesare:</h3>
        <ul>
            <li>Laptop și proiector</li>
            <li>Flipchart și markere</li>
            <li>Post-it-uri</li>
            <li>Materiale printate</li>
            <li>Certificate de participare</li>
        </ul>
    </div>
</body>
</html>`;
  } else {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Facilitator Manual: ${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .checklist { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .checklist ul { list-style-type: none; padding-left: 0; }
        .checklist li:before { content: "☐ "; margin-right: 8px; }
        .tip { background: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>FACILITATOR MANUAL: ${subject}</h1>
    
    <h2>COURSE PREPARATION</h2>
    <div class="checklist">
        <h3>Before the course:</h3>
        <ul>
            <li>Check technical equipment</li>
            <li>Prepare participant materials</li>
            <li>Test the presentation</li>
            <li>Prepare interactive activities</li>
            <li>Plan breaks</li>
        </ul>
    </div>

    <h2>FACILITATION GUIDE</h2>
    
    <h3>Introduction (15 minutes):</h3>
    <ul>
        <li>Greet participants</li>
        <li>Introduce yourself briefly</li>
        <li>Explain course objectives</li>
        <li>Establish ground rules</li>
        <li>Create a relaxed atmosphere</li>
    </ul>

    <h3>Fundamental concepts (45 minutes):</h3>
    <ul>
        <li>Present theory step by step</li>
        <li>Use concrete examples</li>
        <li>Check understanding regularly</li>
        <li>Encourage questions</li>
        <li>Adapt pace to audience</li>
    </ul>

    <h3>Practical applications (60 minutes):</h3>
    <ul>
        <li>Introduce case studies</li>
        <li>Form working groups</li>
        <li>Monitor progress</li>
        <li>Provide constructive feedback</li>
        <li>Facilitate discussions</li>
    </ul>

    <h2>GROUP MANAGEMENT</h2>
    
    <h3>Facilitation techniques:</h3>
    <ul>
        <li>Active listening</li>
        <li>Open questions</li>
        <li>Idea reformulation</li>
        <li>Conflict management</li>
        <li>Encouraging participation</li>
    </ul>

    <div class="tip">
        <strong>Tip:</strong> Maintain eye contact with all participants and adapt your communication style to the group's needs.
    </div>

    <h3>Difficult situations:</h3>
    <ul>
        <li><strong>Dominating participants:</strong> Politely redirect to others</li>
        <li><strong>Shy people:</strong> Encourage through direct questions</li>
        <li><strong>Difficult questions:</strong> Acknowledge and promise to return</li>
        <li><strong>Group tensions:</strong> Mediate and refocus on objectives</li>
        <li><strong>Technical problems:</strong> Always have a plan B</li>
    </ul>

    <h2>PROGRESS EVALUATION</h2>
    <ul>
        <li>Behavior observation</li>
        <li>Verification questions</li>
        <li>Practical exercises</li>
        <li>Verbal feedback</li>
        <li>Participant self-assessment</li>
    </ul>

    <h2>COURSE CLOSING</h2>
    <h3>Last 15 minutes:</h3>
    <ul>
        <li>Summarize key points</li>
        <li>Check objective achievement</li>
        <li>Collect feedback</li>
        <li>Distribute certificates</li>
        <li>Plan follow-up</li>
    </ul>

    <div class="checklist">
        <h3>Required materials:</h3>
        <ul>
            <li>Laptop and projector</li>
            <li>Flipchart and markers</li>
            <li>Post-it notes</li>
            <li>Printed materials</li>
            <li>Participation certificates</li>
        </ul>
    </div>
</body>
</html>`;
  }
}

function generateParticipantHTML(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Manual Participant: ${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .notes-section { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; margin: 15px 0; min-height: 100px; }
        .checkbox-list { list-style-type: none; padding-left: 0; }
        .checkbox-list li:before { content: "☐ "; margin-right: 8px; font-weight: bold; }
        .underline { border-bottom: 1px solid #ccc; display: inline-block; min-width: 200px; margin: 0 5px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>MANUAL PARTICIPANT: ${subject}</h1>
    
    <h2>BINE ATI VENIT!</h2>
    <p>Acest manual vă va ghida prin cursul de <strong>${subject}</strong>. Vă rugăm să îl folosiți pentru a lua notițe și a urmări progresul dvs.</p>

    <h2>OBIECTIVELE CURSULUI</h2>
    <p>La sfârșitul acestui curs veți fi capabili să:</p>
    <ul class="checkbox-list">
        <li>Înțelegeți conceptele fundamentale</li>
        <li>Aplicați cunoștințele în practică</li>
        <li>Rezolvați probleme specifice</li>
        <li>Evaluați propriul progres</li>
    </ul>

    <h2>SECȚIUNEA 1: CONCEPTE FUNDAMENTALE</h2>
    
    <h3>Definiții importante:</h3>
    <div class="notes-section">
        <p>Notițe:</p>
        <div class="underline"></div><br><br>
        <div class="underline"></div><br><br>
        <div class="underline"></div><br><br>
    </div>

    <h3>Principii de bază:</h3>
    <div class="notes-section">
        <p>1. <span class="underline"></span></p><br>
        <p>2. <span class="underline"></span></p><br>
        <p>3. <span class="underline"></span></p><br>
    </div>

    <h3>Notițe personale:</h3>
    <div class="notes-section">
        <!-- Spațiu pentru notițe -->
    </div>

    <h2>SECȚIUNEA 2: APLICAȚII PRACTICE</h2>
    
    <h3>Studiul de caz 1:</h3>
    <div class="notes-section">
        <p><strong>Situația:</strong> <span class="underline"></span></p><br>
        <p><strong>Soluția propusă:</strong> <span class="underline"></span></p><br>
        <p><strong>Rezultate:</strong> <span class="underline"></span></p><br>
    </div>

    <h3>Studiul de caz 2:</h3>
    <div class="notes-section">
        <p><strong>Situația:</strong> <span class="underline"></span></p><br>
        <p><strong>Soluția propusă:</strong> <span class="underline"></span></p><br>
        <p><strong>Rezultate:</strong> <span class="underline"></span></p><br>
    </div>

    <h2>SECȚIUNEA 3: EXERCIȚII</h2>
    
    <h3>Exercițiul 1:</h3>
    <div class="notes-section">
        <p><strong>Sarcina:</strong> <span class="underline"></span></p><br>
        <p><strong>Răspunsul meu:</strong> <span class="underline"></span></p><br>
        <p><strong>Feedback:</strong> <span class="underline"></span></p><br>
    </div>

    <h3>Exercițiul 2:</h3>
    <div class="notes-section">
        <p><strong>Sarcina:</strong> <span class="underline"></span></p><br>
        <p><strong>Răspunsul meu:</strong> <span class="underline"></span></p><br>
        <p><strong>Feedback:</strong> <span class="underline"></span></p><br>
    </div>

    <h2>SECȚIUNEA 4: PLANUL MEU DE ACȚIUNE</h2>
    
    <h3>Ce voi aplica imediat:</h3>
    <div class="notes-section">
        <p>1. <span class="underline"></span></p><br>
        <p>2. <span class="underline"></span></p><br>
        <p>3. <span class="underline"></span></p><br>
    </div>

    <h3>Ce voi dezvolta pe termen lung:</h3>
    <div class="notes-section">
        <p>1. <span class="underline"></span></p><br>
        <p>2. <span class="underline"></span></p><br>
        <p>3. <span class="underline"></span></p><br>
    </div>

    <h2>RESURSE SUPLIMENTARE</h2>
    
    <h3>Cărți recomandate:</h3>
    <ul>
        <li><span class="underline"></span></li>
        <li><span class="underline"></span></li>
        <li><span class="underline"></span></li>
    </ul>

    <h3>Site-uri web utile:</h3>
    <ul>
        <li><span class="underline"></span></li>
        <li><span class="underline"></span></li>
        <li><span class="underline"></span></li>
    </ul>

    <h2>EVALUAREA CURSULUI</h2>
    <div class="notes-section">
        <p><strong>Nota generală:</strong> <span class="underline"></span></p><br>
        <p><strong>Cel mai util aspect:</strong> <span class="underline"></span></p><br>
        <p><strong>Sugestii de îmbunătățire:</strong></p>
        <div class="underline"></div><br><br>
    </div>

    <h2>CERTIFICATE</h2>
    <div class="notes-section">
        <p><strong>Felicitări pentru finalizarea cursului!</strong></p><br>
        <p><strong>Data:</strong> <span class="underline"></span></p><br>
        <p><strong>Semnătura facilitatorului:</strong> <span class="underline"></span></p><br>
    </div>
</body>
</html>`;
  } else {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Participant Manual: ${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .notes-section { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; margin: 15px 0; min-height: 100px; }
        .checkbox-list { list-style-type: none; padding-left: 0; }
        .checkbox-list li:before { content: "☐ "; margin-right: 8px; font-weight: bold; }
        .underline { border-bottom: 1px solid #ccc; display: inline-block; min-width: 200px; margin: 0 5px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>PARTICIPANT MANUAL: ${subject}</h1>
    
    <h2>WELCOME!</h2>
    <p>This manual will guide you through the <strong>${subject}</strong> course. Please use it to take notes and track your progress.</p>

    <h2>COURSE OBJECTIVES</h2>
    <p>By the end of this course you will be able to:</p>
    <ul class="checkbox-list">
        <li>Understand fundamental concepts</li>
        <li>Apply knowledge in practice</li>
        <li>Solve specific problems</li>
        <li>Evaluate your own progress</li>
    </ul>

    <h2>SECTION 1: FUNDAMENTAL CONCEPTS</h2>
    
    <h3>Important definitions:</h3>
    <div class="notes-section">
        <p>Notes:</p>
        <div class="underline"></div><br><br>
        <div class="underline"></div><br><br>
        <div class="underline"></div><br><br>
    </div>

    <h3>Basic principles:</h3>
    <div class="notes-section">
        <p>1. <span class="underline"></span></p><br>
        <p>2. <span class="underline"></span></p><br>
        <p>3. <span class="underline"></span></p><br>
    </div>

    <h3>Personal notes:</h3>
    <div class="notes-section">
        <!-- Space for notes -->
    </div>

    <h2>SECTION 2: PRACTICAL APPLICATIONS</h2>
    
    <h3>Case study 1:</h3>
    <div class="notes-section">
        <p><strong>Situation:</strong> <span class="underline"></span></p><br>
        <p><strong>Proposed solution:</strong> <span class="underline"></span></p><br>
        <p><strong>Results:</strong> <span class="underline"></span></p><br>
    </div>

    <h3>Case study 2:</h3>
    <div class="notes-section">
        <p><strong>Situation:</strong> <span class="underline"></span></p><br>
        <p><strong>Proposed solution:</strong> <span class="underline"></span></p><br>
        <p><strong>Results:</strong> <span class="underline"></span></p><br>
    </div>

    <h2>SECTION 3: EXERCISES</h2>
    
    <h3>Exercise 1:</h3>
    <div class="notes-section">
        <p><strong>Task:</strong> <span class="underline"></span></p><br>
        <p><strong>My answer:</strong> <span class="underline"></span></p><br>
        <p><strong>Feedback:</strong> <span class="underline"></span></p><br>
    </div>

    <h3>Exercise 2:</h3>
    <div class="notes-section">
        <p><strong>Task:</strong> <span class="underline"></span></p><br>
        <p><strong>My answer:</strong> <span class="underline"></span></p><br>
        <p><strong>Feedback:</strong> <span class="underline"></span></p><br>
    </div>

    <h2>SECTION 4: MY ACTION PLAN</h2>
    
    <h3>What I will apply immediately:</h3>
    <div class="notes-section">
        <p>1. <span class="underline"></span></p><br>
        <p>2. <span class="underline"></span></p><br>
        <p>3. <span class="underline"></span></p><br>
    </div>

    <h3>What I will develop long-term:</h3>
    <div class="notes-section">
        <p>1. <span class="underline"></span></p><br>
        <p>2. <span class="underline"></span></p><br>
        <p>3. <span class="underline"></span></p><br>
    </div>

    <h2>ADDITIONAL RESOURCES</h2>
    
    <h3>Recommended books:</h3>
    <ul>
        <li><span class="underline"></span></li>
        <li><span class="underline"></span></li>
        <li><span class="underline"></span></li>
    </ul>

    <h3>Useful websites:</h3>
    <ul>
        <li><span class="underline"></span></li>
        <li><span class="underline"></span></li>
        <li><span class="underline"></span></li>
    </ul>

    <h2>COURSE EVALUATION</h2>
    <div class="notes-section">
        <p><strong>Overall rating:</strong> <span class="underline"></span></p><br>
        <p><strong>Most useful aspect:</strong> <span class="underline"></span></p><br>
        <p><strong>Improvement suggestions:</strong></p>
        <div class="underline"></div><br><br>
    </div>

    <h2>CERTIFICATE</h2>
    <div class="notes-section">
        <p><strong>Congratulations on completing the course!</strong></p><br>
        <p><strong>Date:</strong> <span class="underline"></span></p><br>
        <p><strong>Facilitator signature:</strong> <span class="underline"></span></p><br>
    </div>
</body>
</html>`;
  }
}

function generateActivitiesHTML(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Activități și Exerciții: ${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .activity { background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; }
        .activity-header { background: #007bff; color: white; padding: 10px; margin: -20px -20px 15px -20px; }
        .instructions { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .checklist { list-style-type: none; padding-left: 0; }
        .checklist li:before { content: "☐ "; margin-right: 8px; font-weight: bold; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        .time-badge { background: #28a745; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px; }
    </style>
</head>
<body>
    <h1>ACTIVITĂȚI ȘI EXERCIȚII: ${subject}</h1>
    
    <div class="activity">
        <div class="activity-header">
            <h2>ACTIVITATEA 1: BRAINSTORMING</h2>
            <span class="time-badge">15 minute</span>
        </div>
        <p><strong>Participanți:</strong> Toți | <strong>Obiectiv:</strong> Generarea de idei creative</p>
        
        <div class="instructions">
            <h3>Instrucțiuni:</h3>
            <ol>
                <li>Formați grupuri de 4-5 persoane</li>
                <li>Alegeți un moderator pentru fiecare grup</li>
                <li>Generați cât mai multe idei în 10 minute</li>
                <li>Prezentați cele mai bune 3 idei (5 minute)</li>
            </ol>
        </div>
        
        <p><strong>Întrebarea:</strong> "Cum putem aplica ${subject} în activitatea noastră zilnică?"</p>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2>ACTIVITATEA 2: STUDIU DE CAZ</h2>
            <span class="time-badge">30 minute</span>
        </div>
        <p><strong>Participanți:</strong> Grupuri de 3-4 persoane | <strong>Obiectiv:</strong> Aplicarea practică a conceptelor</p>
        
        <h3>Scenariul:</h3>
        <p>O companie din domeniul ${context} se confruntă cu următoarea provocare...</p>
        <p><em>[Descrierea detaliată a situației va fi furnizată de facilitator]</em></p>
        
        <div class="instructions">
            <h3>Sarcini:</h3>
            <ol>
                <li>Analizați situația (10 minute)</li>
                <li>Propuneți soluții (15 minute)</li>
                <li>Prezentați soluția (5 minute)</li>
            </ol>
        </div>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2>ACTIVITATEA 3: ROLE-PLAYING</h2>
            <span class="time-badge">20 minute</span>
        </div>
        <p><strong>Participanți:</strong> Perechi | <strong>Obiectiv:</strong> Exersarea competențelor practice</p>
        
        <h3>Roluri:</h3>
        <ul>
            <li><strong>Persoana A:</strong> Manager/Facilitator</li>
            <li><strong>Persoana B:</strong> Angajat/Participant</li>
        </ul>
        
        <p><strong>Scenariul:</strong> Simulați o situație în care trebuie să aplicați principiile învățate...</p>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2>ACTIVITATEA 4: QUIZ INTERACTIV</h2>
            <span class="time-badge">15 minute</span>
        </div>
        <p><strong>Participanți:</strong> Individual | <strong>Obiectiv:</strong> Verificarea cunoștințelor</p>
        
        <h3>Întrebări:</h3>
        <ol>
            <li>Care sunt cele 3 principii fundamentale ale ${subject}?</li>
            <li>Dați un exemplu de aplicare practică</li>
            <li>Care sunt principalele provocări în implementare?</li>
            <li>Cum măsurați succesul?</li>
            <li>Ce resurse sunt necesare?</li>
        </ol>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2>ACTIVITATEA 5: PLANUL DE ACȚIUNE</h2>
            <span class="time-badge">25 minute</span>
        </div>
        <p><strong>Participanți:</strong> Individual apoi în perechi | <strong>Obiectiv:</strong> Planificarea implementării</p>
        
        <div class="instructions">
            <h3>Pași:</h3>
            <ol>
                <li>Identificați 3 obiective SMART (10 minute)</li>
                <li>Planificați acțiunile concrete (10 minute)</li>
                <li>Împărtășiți cu partenerul pentru feedback (5 minute)</li>
            </ol>
        </div>
        
        <h3>Template plan de acțiune:</h3>
        <ul>
            <li><strong>Obiectiv 1:</strong> ________________</li>
            <li><strong>Acțiuni:</strong> __________________</li>
            <li><strong>Termen:</strong> ___________________</li>
            <li><strong>Resurse:</strong> __________________</li>
        </ul>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2>ACTIVITATEA 6: FEEDBACK 360°</h2>
            <span class="time-badge">20 minute</span>
        </div>
        <p><strong>Participanți:</strong> Grupuri de 6 persoane | <strong>Obiectiv:</strong> Dezvoltarea competențelor de feedback</p>
        
        <div class="instructions">
            <h3>Proces:</h3>
            <ol>
                <li>Fiecare prezintă o situație (2 minute)</li>
                <li>Ceilalți oferă feedback constructiv (3 minute)</li>
                <li>Rotația continuă până toți au prezentat</li>
            </ol>
        </div>
    </div>

    <h2>MATERIALE NECESARE</h2>
    <ul class="checklist">
        <li>Flipchart și markere</li>
        <li>Post-it-uri colorate</li>
        <li>Cronometru</li>
        <li>Fișe de evaluare</li>
        <li>Premii simbolice pentru activități</li>
    </ul>
</body>
</html>`;
  } else {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Activities and Exercises: ${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .activity { background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; }
        .activity-header { background: #007bff; color: white; padding: 10px; margin: -20px -20px 15px -20px; }
        .instructions { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .checklist { list-style-type: none; padding-left: 0; }
        .checklist li:before { content: "☐ "; margin-right: 8px; font-weight: bold; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        .time-badge { background: #28a745; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px; }
    </style>
</head>
<body>
    <h1>ACTIVITIES AND EXERCISES: ${subject}</h1>
    
    <div class="activity">
        <div class="activity-header">
            <h2>ACTIVITY 1: BRAINSTORMING</h2>
            <span class="time-badge">15 minutes</span>
        </div>
        <p><strong>Participants:</strong> Everyone | <strong>Objective:</strong> Generate creative ideas</p>
        
        <div class="instructions">
            <h3>Instructions:</h3>
            <ol>
                <li>Form groups of 4-5 people</li>
                <li>Choose a moderator for each group</li>
                <li>Generate as many ideas as possible in 10 minutes</li>
                <li>Present the best 3 ideas (5 minutes)</li>
            </ol>
        </div>
        
        <p><strong>Question:</strong> "How can we apply ${subject} in our daily activities?"</p>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2>ACTIVITY 2: CASE STUDY</h2>
            <span class="time-badge">30 minutes</span>
        </div>
        <p><strong>Participants:</strong> Groups of 3-4 people | <strong>Objective:</strong> Practical application of concepts</p>
        
        <h3>Scenario:</h3>
        <p>A company in the ${context} field faces the following challenge...</p>
        <p><em>[Detailed situation description will be provided by facilitator]</em></p>
        
        <div class="instructions">
            <h3>Tasks:</h3>
            <ol>
                <li>Analyze the situation (10 minutes)</li>
                <li>Propose solutions (15 minutes)</li>
                <li>Present the solution (5 minutes)</li>
            </ol>
        </div>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2>ACTIVITY 3: ROLE-PLAYING</h2>
            <span class="time-badge">20 minutes</span>
        </div>
        <p><strong>Participants:</strong> Pairs | <strong>Objective:</strong> Practice practical skills</p>
        
        <h3>Roles:</h3>
        <ul>
            <li><strong>Person A:</strong> Manager/Facilitator</li>
            <li><strong>Person B:</strong> Employee/Participant</li>
        </ul>
        
        <p><strong>Scenario:</strong> Simulate a situation where you need to apply the learned principles...</p>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2>ACTIVITY 4: INTERACTIVE QUIZ</h2>
            <span class="time-badge">15 minutes</span>
        </div>
        <p><strong>Participants:</strong> Individual | <strong>Objective:</strong> Knowledge verification</p>
        
        <h3>Questions:</h3>
        <ol>
            <li>What are the 3 fundamental principles of ${subject}?</li>
            <li>Give an example of practical application</li>
            <li>What are the main implementation challenges?</li>
            <li>How do you measure success?</li>
            <li>What resources are needed?</li>
        </ol>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2>ACTIVITY 5: ACTION PLAN</h2>
            <span class="time-badge">25 minutes</span>
        </div>
        <p><strong>Participants:</strong> Individual then in pairs | <strong>Objective:</strong> Implementation planning</p>
        
        <div class="instructions">
            <h3>Steps:</h3>
            <ol>
                <li>Identify 3 SMART objectives (10 minutes)</li>
                <li>Plan concrete actions (10 minutes)</li>
                <li>Share with partner for feedback (5 minutes)</li>
            </ol>
        </div>
        
        <h3>Action plan template:</h3>
        <ul>
            <li><strong>Objective 1:</strong> _______________</li>
            <li><strong>Actions:</strong> __________________</li>
            <li><strong>Deadline:</strong> _________________</li>
            <li><strong>Resources:</strong> ________________</li>
        </ul>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2>ACTIVITY 6: 360° FEEDBACK</h2>
            <span class="time-badge">20 minutes</span>
        </div>
        <p><strong>Participants:</strong> Groups of 6 people | <strong>Objective:</strong> Develop feedback skills</p>
        
        <div class="instructions">
            <h3>Process:</h3>
            <ol>
                <li>Each presents a situation (2 minutes)</li>
                <li>Others provide constructive feedback (3 minutes)</li>
                <li>Rotation continues until everyone has presented</li>
            </ol>
        </div>
    </div>

    <h2>REQUIRED MATERIALS</h2>
    <ul class="checklist">
        <li>Flipchart and markers</li>
        <li>Colored post-it notes</li>
        <li>Timer</li>
        <li>Evaluation sheets</li>
        <li>Symbolic prizes for activities</li>
    </ul>
</body>
</html>`;
  }
}

function generateEvaluationHTML(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Instrumente de Evaluare: ${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .evaluation-section { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; margin: 15px 0; }
        .checkbox-list { list-style-type: none; padding-left: 0; }
        .checkbox-list li:before { content: "☐ "; margin-right: 8px; font-weight: bold; }
        .rating-scale { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .underline { border-bottom: 1px solid #ccc; display: inline-block; min-width: 200px; margin: 0 5px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #dee2e6; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <h1>INSTRUMENTE DE EVALUARE: ${subject}</h1>
    
    <h2>EVALUARE INIȚIALĂ (PRE-CURS)</h2>
    <div class="evaluation-section">
        <h3>Întrebări de evaluare a cunoștințelor:</h3>
        <ol>
            <li>Cât de familiar sunteți cu ${subject}? (1-10) <span class="underline"></span></li>
            <li>Ce experiență aveți în domeniu? <span class="underline"></span></li>
            <li>Care sunt așteptările dvs. de la acest curs? <span class="underline"></span></li>
            <li>Ce provocări întâmpinați în prezent? <span class="underline"></span></li>
            <li>Cum măsurați succesul în acest domeniu? <span class="underline"></span></li>
        </ol>
    </div>

    <h2>EVALUARE CONTINUĂ (DURANTE CURS)</h2>
    
    <div class="evaluation-section">
        <h3>Checkpoint 1 (după 30 minute):</h3>
        <ul class="checkbox-list">
            <li>Conceptele sunt clare</li>
            <li>Ritmul este potrivit</li>
            <li>Exemplele sunt relevante</li>
            <li>Am întrebări despre: <span class="underline"></span></li>
        </ul>
    </div>

    <div class="evaluation-section">
        <h3>Checkpoint 2 (după exerciții):</h3>
        <ul class="checkbox-list">
            <li>Am înțeles aplicațiile practice</li>
            <li>Pot să aplic cunoștințele</li>
            <li>Am nevoie de clarificări la: <span class="underline"></span></li>
            <li>Mă simt confortabil cu materialul</li>
        </ul>
    </div>

    <h2>EVALUARE FINALĂ (POST-CURS)</h2>
    
    <div class="evaluation-section">
        <h3>Test de cunoștințe:</h3>
        
        <p><strong>1. Definiți conceptul principal al ${subject}:</strong></p>
        <div class="underline" style="width: 100%; min-height: 60px;"></div>
        
        <p><strong>2. Enumerați 3 beneficii ale aplicării acestor principii:</strong></p>
        <p>a) <span class="underline"></span></p>
        <p>b) <span class="underline"></span></p>
        <p>c) <span class="underline"></span></p>
        
        <p><strong>3. Descrieți un scenariu de aplicare practică:</strong></p>
        <div class="underline" style="width: 100%; min-height: 80px;"></div>
        
        <p><strong>4. Care sunt principalele provocări în implementare?</strong></p>
        <div class="underline" style="width: 100%; min-height: 60px;"></div>
        
        <p><strong>5. Cum veți măsura progresul dvs.?</strong></p>
        <div class="underline" style="width: 100%; min-height: 60px;"></div>
    </div>

    <h2>EVALUAREA COMPETENȚELOR PRACTICE</h2>
    
    <div class="evaluation-section">
        <h3>Exercițiul practic:</h3>
        <p><strong>Sarcina:</strong> Aplicați principiile învățate într-o situație simulată</p>
        
        <h3>Criterii de evaluare:</h3>
        <table>
            <tr>
                <th>Criteriu</th>
                <th>Pondere</th>
                <th>Punctaj (1-10)</th>
                <th>Observații</th>
            </tr>
            <tr>
                <td>Înțelegerea conceptelor</td>
                <td>25%</td>
                <td><span class="underline"></span></td>
                <td><span class="underline"></span></td>
            </tr>
            <tr>
                <td>Aplicarea corectă</td>
                <td>25%</td>
                <td><span class="underline"></span></td>
                <td><span class="underline"></span></td>
            </tr>
            <tr>
                <td>Creativitatea soluției</td>
                <td>25%</td>
                <td><span class="underline"></span></td>
                <td><span class="underline"></span></td>
            </tr>
            <tr>
                <td>Comunicarea rezultatelor</td>
                <td>25%</td>
                <td><span class="underline"></span></td>
                <td><span class="underline"></span></td>
            </tr>
        </table>
        
        <div class="rating-scale">
            <h3>Scala de notare:</h3>
            <ul>
                <li><strong>Excelent (9-10):</strong> Depășește așteptările</li>
                <li><strong>Bun (7-8):</strong> Îndeplinește așteptările</li>
                <li><strong>Satisfăcător (5-6):</strong> Îndeplinește parțial</li>
                <li><strong>Nesatisfăcător (1-4):</strong> Nu îndeplinește</li>
            </ul>
        </div>
    </div>

    <h2>AUTO-EVALUAREA</h2>
    
    <div class="evaluation-section">
        <h3>Reflecție personală:</h3>
        
        <p><strong>1. Ce am învățat cel mai important?</strong></p>
        <div class="underline" style="width: 100%; min-height: 60px;"></div>
        
        <p><strong>2. Cum voi aplica aceste cunoștințe?</strong></p>
        <div class="underline" style="width: 100%; min-height: 60px;"></div>
        
        <p><strong>3. Ce competențe vreau să dezvolt mai mult?</strong></p>
        <div class="underline" style="width: 100%; min-height: 60px;"></div>
        
        <p><strong>4. Care este următorul meu pas?</strong></p>
        <div class="underline" style="width: 100%; min-height: 60px;"></div>
    </div>

    <h2>EVALUAREA CURSULUI</h2>
    
    <div class="evaluation-section">
        <table>
            <tr>
                <th>Aspect</th>
                <th>Foarte bun</th>
                <th>Bun</th>
                <th>Satisfăcător</th>
                <th>Nesatisfăcător</th>
            </tr>
            <tr>
                <td>Conținutul cursului</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
            </tr>
            <tr>
                <td>Facilitatorul</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
            </tr>
            <tr>
                <td>Materialele</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
            </tr>
            <tr>
                <td>Activitățile</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
            </tr>
        </table>
        
        <p><strong>Recomandări:</strong></p>
        <ul class="checkbox-list">
            <li>Recomand cu căldură</li>
            <li>Recomand</li>
            <li>Recomand cu rezerve</li>
            <li>Nu recomand</li>
        </ul>
        
        <p><strong>Sugestii de îmbunătățire:</strong></p>
        <div class="underline" style="width: 100%; min-height: 80px;"></div>
    </div>

    <h2>PLANUL DE DEZVOLTARE CONTINUĂ</h2>
    
    <div class="evaluation-section">
        <h3>Obiective pe termen scurt (1-3 luni):</h3>
        <p>1. <span class="underline"></span></p>
        <p>2. <span class="underline"></span></p>
        <p>3. <span class="underline"></span></p>
        
        <h3>Obiective pe termen lung (6-12 luni):</h3>
        <p>1. <span class="underline"></span></p>
        <p>2. <span class="underline"></span></p>
        <p>3. <span class="underline"></span></p>
        
        <h3>Resurse pentru dezvoltare:</h3>
        <ul class="checkbox-list">
            <li>Cărți suplimentare</li>
            <li>Cursuri avansate</li>
            <li>Mentoring</li>
            <li>Practică ghidată</li>
            <li>Comunități de practică</li>
        </ul>
    </div>
</body>
</html>`;
  } else {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Evaluation Tools: ${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .evaluation-section { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; margin: 15px 0; }
        .checkbox-list { list-style-type: none; padding-left: 0; }
        .checkbox-list li:before { content: "☐ "; margin-right: 8px; font-weight: bold; }
        .rating-scale { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .underline { border-bottom: 1px solid #ccc; display: inline-block; min-width: 200px; margin: 0 5px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #dee2e6; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <h1>EVALUATION TOOLS: ${subject}</h1>
    
    <h2>INITIAL EVALUATION (PRE-COURSE)</h2>
    <div class="evaluation-section">
        <h3>Knowledge assessment questions:</h3>
        <ol>
            <li>How familiar are you with ${subject}? (1-10) <span class="underline"></span></li>
            <li>What experience do you have in the field? <span class="underline"></span></li>
            <li>What are your expectations from this course? <span class="underline"></span></li>
            <li>What challenges are you currently facing? <span class="underline"></span></li>
            <li>How do you measure success in this domain? <span class="underline"></span></li>
        </ol>
    </div>

    <h2>CONTINUOUS EVALUATION (DURING COURSE)</h2>
    
    <div class="evaluation-section">
        <h3>Checkpoint 1 (after 30 minutes):</h3>
        <ul class="checkbox-list">
            <li>Concepts are clear</li>
            <li>Pace is appropriate</li>
            <li>Examples are relevant</li>
            <li>I have questions about: <span class="underline"></span></li>
        </ul>
    </div>

    <div class="evaluation-section">
        <h3>Checkpoint 2 (after exercises):</h3>
        <ul class="checkbox-list">
            <li>I understood practical applications</li>
            <li>I can apply the knowledge</li>
            <li>I need clarifications on: <span class="underline"></span></li>
            <li>I feel comfortable with the material</li>
        </ul>
    </div>

    <h2>FINAL EVALUATION (POST-COURSE)</h2>
    
    <div class="evaluation-section">
        <h3>Knowledge test:</h3>
        
        <p><strong>1. Define the main concept of ${subject}:</strong></p>
        <div class="underline" style="width: 100%; min-height: 60px;"></div>
        
        <p><strong>2. List 3 benefits of applying these principles:</strong></p>
        <p>a) <span class="underline"></span></p>
        <p>b) <span class="underline"></span></p>
        <p>c) <span class="underline"></span></p>
        
        <p><strong>3. Describe a practical application scenario:</strong></p>
        <div class="underline" style="width: 100%; min-height: 80px;"></div>
        
        <p><strong>4. What are the main implementation challenges?</strong></p>
        <div class="underline" style="width: 100%; min-height: 60px;"></div>
        
        <p><strong>5. How will you measure your progress?</strong></p>
        <div class="underline" style="width: 100%; min-height: 60px;"></div>
    </div>

    <h2>PRACTICAL SKILLS EVALUATION</h2>
    
    <div class="evaluation-section">
        <h3>Practical exercise:</h3>
        <p><strong>Task:</strong> Apply learned principles in a simulated situation</p>
        
        <h3>Evaluation criteria:</h3>
        <table>
            <tr>
                <th>Criterion</th>
                <th>Weight</th>
                <th>Score (1-10)</th>
                <th>Comments</th>
            </tr>
            <tr>
                <td>Concept understanding</td>
                <td>25%</td>
                <td><span class="underline"></span></td>
                <td><span class="underline"></span></td>
            </tr>
            <tr>
                <td>Correct application</td>
                <td>25%</td>
                <td><span class="underline"></span></td>
                <td><span class="underline"></span></td>
            </tr>
            <tr>
                <td>Solution creativity</td>
                <td>25%</td>
                <td><span class="underline"></span></td>
                <td><span class="underline"></span></td>
            </tr>
            <tr>
                <td>Results communication</td>
                <td>25%</td>
                <td><span class="underline"></span></td>
                <td><span class="underline"></span></td>
            </tr>
        </table>
        
        <div class="rating-scale">
            <h3>Grading scale:</h3>
            <ul>
                <li><strong>Excellent (9-10):</strong> Exceeds expectations</li>
                <li><strong>Good (7-8):</strong> Meets expectations</li>
                <li><strong>Satisfactory (5-6):</strong> Partially meets</li>
                <li><strong>Unsatisfactory (1-4):</strong> Does not meet</li>
            </ul>
        </div>
    </div>

    <h2>SELF-EVALUATION</h2>
    
    <div class="evaluation-section">
        <h3>Personal reflection:</h3>
        
        <p><strong>1. What did I learn that was most important?</strong></p>
        <div class="underline" style="width: 100%; min-height: 60px;"></div>
        
        <p><strong>2. How will I apply this knowledge?</strong></p>
        <div class="underline" style="width: 100%; min-height: 60px;"></div>
        
        <p><strong>3. What skills do I want to develop more?</strong></p>
        <div class="underline" style="width: 100%; min-height: 60px;"></div>
        
        <p><strong>4. What is my next step?</strong></p>
        <div class="underline" style="width: 100%; min-height: 60px;"></div>
    </div>

    <h2>COURSE EVALUATION</h2>
    
    <div class="evaluation-section">
        <table>
            <tr>
                <th>Aspect</th>
                <th>Very good</th>
                <th>Good</th>
                <th>Satisfactory</th>
                <th>Unsatisfactory</th>
            </tr>
            <tr>
                <td>Course content</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
            </tr>
            <tr>
                <td>Facilitator</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
            </tr>
            <tr>
                <td>Materials</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
            </tr>
            <tr>
                <td>Activities</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
                <td>☐</td>
            </tr>
        </table>
        
        <p><strong>Recommendations:</strong></p>
        <ul class="checkbox-list">
            <li>Highly recommend</li>
            <li>Recommend</li>
            <li>Recommend with reservations</li>
            <li>Do not recommend</li>
        </ul>
        
        <p><strong>Improvement suggestions:</strong></p>
        <div class="underline" style="width: 100%; min-height: 80px;"></div>
    </div>

    <h2>CONTINUOUS DEVELOPMENT PLAN</h2>
    
    <div class="evaluation-section">
        <h3>Short-term objectives (1-3 months):</h3>
        <p>1. <span class="underline"></span></p>
        <p>2. <span class="underline"></span></p>
        <p>3. <span class="underline"></span></p>
        
        <h3>Long-term objectives (6-12 months):</h3>
        <p>1. <span class="underline"></span></p>
        <p>2. <span class="underline"></span></p>
        <p>3. <span class="underline"></span></p>
        
        <h3>Development resources:</h3>
        <ul class="checkbox-list">
            <li>Additional books</li>
            <li>Advanced courses</li>
            <li>Mentoring</li>
            <li>Guided practice</li>
            <li>Communities of practice</li>
        </ul>
    </div>
</body>
</html>`;
  }
}

function generateResourcesHTML(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resurse Suplimentare: ${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .resource-section { background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 15px 0; }
        .book-list { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .online-resources { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .checklist { list-style-type: none; padding-left: 0; }
        .checklist li:before { content: "☐ "; margin-right: 8px; font-weight: bold; }
        .timeline { background: #e2e3e5; padding: 15px; border-radius: 5px; margin: 10px 0; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>RESURSE SUPLIMENTARE: ${subject}</h1>
    
    <h2>CĂRȚI RECOMANDATE</h2>
    
    <div class="book-list">
        <h3>Nivel începător:</h3>
        <ol>
            <li><strong>"Introducere în ${subject}"</strong> - Autor Principal
                <ul>
                    <li>Concepte de bază explicate simplu</li>
                    <li>Exemple practice din viața reală</li>
                    <li>Exerciții pas cu pas</li>
                </ul>
            </li>
            <li><strong>"${subject} pentru toți"</strong> - Expert Recunoscut
                <ul>
                    <li>Abordare accesibilă</li>
                    <li>Studii de caz diverse</li>
                    <li>Ghid practic de implementare</li>
                </ul>
            </li>
        </ol>
    </div>

    <div class="book-list">
        <h3>Nivel intermediar și avansat:</h3>
        <ol start="3">
            <li><strong>"${subject} avansat"</strong> - Specialist în domeniu
                <ul>
                    <li>Tehnici sofisticate</li>
                    <li>Analize aprofundate</li>
                    <li>Strategii complexe</li>
                </ul>
            </li>
            <li><strong>"Masterizarea ${subject}"</strong> - Autoritate în domeniu
                <ul>
                    <li>Perspective inovatoare</li>
                    <li>Cercetări recente</li>
                    <li>Aplicații avansate</li>
                </ul>
            </li>
        </ol>
    </div>

    <h2>RESURSE ONLINE</h2>
    
    <div class="online-resources">
        <h3>Site-uri web utile:</h3>
        <ul>
            <li><a href="#">www.${subject.toLowerCase().replace(/\s+/g, '')}.org</a> - Resurse oficiale</li>
            <li><a href="#">www.${context}academy.com</a> - Cursuri online</li>
            <li><a href="#">www.expertsin${subject.toLowerCase().replace(/\s+/g, '')}.net</a> - Comunitate de experți</li>
        </ul>
        
        <h3>Bloguri și articole:</h3>
        <ul>
            <li><strong>Blog-ul ${subject}</strong> - Articole săptămânale</li>
            <li><strong>Revista ${context}</strong> - Studii de caz lunare</li>
            <li><strong>Newsletter ${subject} Trends</strong> - Tendințe și noutăți</li>
        </ul>
        
        <h3>Podcasturi:</h3>
        <ul>
            <li><strong>"${subject} în practică"</strong> - Episoade săptămânale</li>
            <li><strong>"Experți în ${subject}"</strong> - Interviuri cu specialiști</li>
            <li><strong>"${context} și ${subject}"</strong> - Discuții tematice</li>
        </ul>
    </div>

    <h2>CURSURI ȘI CERTIFICĂRI</h2>
    
    <div class="resource-section">
        <h3>Cursuri online:</h3>
        <ul class="checklist">
            <li>${subject} Fundamentals (40 ore)</li>
            <li>Advanced ${subject} Techniques (60 ore)</li>
            <li>${subject} for ${audience} (30 ore)</li>
            <li>${context} ${subject} Specialization (80 ore)</li>
        </ul>
        
        <h3>Certificări profesionale:</h3>
        <ul class="checklist">
            <li>Certified ${subject} Practitioner</li>
            <li>Advanced ${subject} Specialist</li>
            <li>${subject} Master Certification</li>
            <li>${context} ${subject} Expert</li>
        </ul>
    </div>

    <h2>COMUNITĂȚI ȘI NETWORKING</h2>
    
    <div class="resource-section">
        <h3>Grupuri profesionale:</h3>
        <ul>
            <li>Asociația ${subject} România</li>
            <li>Grupul LinkedIn "${subject} Professionals"</li>
            <li>Comunitatea Facebook "${subject} în ${context}"</li>
        </ul>
        
        <h3>Evenimente și conferințe:</h3>
        <ul>
            <li>Conferința Anuală ${subject}</li>
            <li>Workshop-uri lunare ${subject}</li>
            <li>Meetup-uri locale ${subject}</li>
            <li>Webinare săptămânale</li>
        </ul>
    </div>

    <h2>INSTRUMENTE ȘI SOFTWARE</h2>
    
    <div class="resource-section">
        <h3>Instrumente gratuite:</h3>
        <ul class="checklist">
            <li>${subject} Calculator - Calcule rapide</li>
            <li>${subject} Planner - Planificare proiecte</li>
            <li>${subject} Tracker - Monitorizare progres</li>
        </ul>
        
        <h3>Software profesional:</h3>
        <ul class="checklist">
            <li>${subject} Pro Suite - Soluție completă</li>
            <li>Advanced ${subject} Tools - Instrumente avansate</li>
            <li>${subject} Analytics - Analiză și raportare</li>
        </ul>
    </div>

    <h2>TEMPLATE-URI ȘI MODELE</h2>
    
    <div class="resource-section">
        <h3>Documente utile:</h3>
        <ul class="checklist">
            <li>Template plan de implementare ${subject}</li>
            <li>Checklist evaluare ${subject}</li>
            <li>Model raport progres ${subject}</li>
            <li>Ghid best practices ${subject}</li>
        </ul>
    </div>

    <h2>DEZVOLTARE CONTINUĂ</h2>
    
    <div class="timeline">
        <h3>Plan de învățare pe 6 luni:</h3>
        
        <h4>Luna 1-2: Consolidarea fundamentelor</h4>
        <ul>
            <li>Recitirea materialelor cursului</li>
            <li>Aplicarea în proiecte mici</li>
            <li>Participarea la webinare</li>
        </ul>
        
        <h4>Luna 3-4: Aprofundarea cunoștințelor</h4>
        <ul>
            <li>Citirea unei cărți avansate</li>
            <li>Participarea la workshop-uri</li>
            <li>Networking cu experți</li>
        </ul>
        
        <h4>Luna 5-6: Specializarea</h4>
        <ul>
            <li>Alegerea unei nișe specifice</li>
            <li>Dezvoltarea unui proiect complex</li>
            <li>Pregătirea pentru certificare</li>
        </ul>
    </div>

    <h2>CONTACTE UTILE</h2>
    
    <div class="resource-section">
        <h3>Mentori și consultanți:</h3>
        <ul>
            <li><strong>Nume Expert 1</strong> - email@expert1.com</li>
            <li><strong>Nume Expert 2</strong> - email@expert2.com</li>
            <li><strong>Nume Consultant</strong> - email@consultant.com</li>
        </ul>
        
        <h3>Organizații de sprijin:</h3>
        <ul>
            <li>Centrul de Excelență ${subject}</li>
            <li>Institutul ${context} ${subject}</li>
            <li>Fundația pentru ${subject}</li>
        </ul>
    </div>

    <h2>ACTUALIZĂRI ȘI TENDINȚE</h2>
    
    <div class="resource-section">
        <h3>Surse de informații actuale:</h3>
        <ul class="checklist">
            <li>Newsletter-e specializate</li>
            <li>Rapoarte anuale din industrie</li>
            <li>Studii de cercetare recente</li>
            <li>Analize de piață</li>
        </ul>
        
        <h3>Tendințe emergente în ${subject}:</h3>
        <ol>
            <li>Digitalizarea proceselor</li>
            <li>Automatizarea activităților</li>
            <li>Integrarea AI și ML</li>
            <li>Sustenabilitatea și responsabilitatea</li>
            <li>Personalizarea experiențelor</li>
        </ol>
    </div>
</body>
</html>`;
  } else {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Additional Resources: ${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .resource-section { background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 15px 0; }
        .book-list { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .online-resources { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .checklist { list-style-type: none; padding-left: 0; }
        .checklist li:before { content: "☐ "; margin-right: 8px; font-weight: bold; }
        .timeline { background: #e2e3e5; padding: 15px; border-radius: 5px; margin: 10px 0; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>ADDITIONAL RESOURCES: ${subject}</h1>
    
    <h2>RECOMMENDED BOOKS</h2>
    
    <div class="book-list">
        <h3>Beginner level:</h3>
        <ol>
            <li><strong>"Introduction to ${subject}"</strong> - Main Author
                <ul>
                    <li>Basic concepts explained simply</li>
                    <li>Real-life practical examples</li>
                    <li>Step-by-step exercises</li>
                </ul>
            </li>
            <li><strong>"${subject} for Everyone"</strong> - Recognized Expert
                <ul>
                    <li>Accessible approach</li>
                    <li>Diverse case studies</li>
                    <li>Practical implementation guide</li>
                </ul>
            </li>
        </ol>
    </div>

    <div class="book-list">
        <h3>Intermediate and advanced level:</h3>
        <ol start="3">
            <li><strong>"Advanced ${subject}"</strong> - Domain Specialist
                <ul>
                    <li>Sophisticated techniques</li>
                    <li>In-depth analyses</li>
                    <li>Complex strategies</li>
                </ul>
            </li>
            <li><strong>"Mastering ${subject}"</strong> - Domain Authority
                <ul>
                    <li>Innovative perspectives</li>
                    <li>Recent research</li>
                    <li>Advanced applications</li>
                </ul>
            </li>
        </ol>
    </div>

    <h2>ONLINE RESOURCES</h2>
    
    <div class="online-resources">
        <h3>Useful websites:</h3>
        <ul>
            <li><a href="#">www.${subject.toLowerCase().replace(/\s+/g, '')}.org</a> - Official resources</li>
            <li><a href="#">www.${context}academy.com</a> - Online courses</li>
            <li><a href="#">www.expertsin${subject.toLowerCase().replace(/\s+/g, '')}.net</a> - Expert community</li>
        </ul>
        
        <h3>Blogs and articles:</h3>
        <ul>
            <li><strong>${subject} Blog</strong> - Weekly articles</li>
            <li><strong>${context} Magazine</strong> - Monthly case studies</li>
            <li><strong>${subject} Trends Newsletter</strong> - Trends and news</li>
        </ul>
        
        <h3>Podcasts:</h3>
        <ul>
            <li><strong>"${subject} in Practice"</strong> - Weekly episodes</li>
            <li><strong>"${subject} Experts"</strong> - Specialist interviews</li>
            <li><strong>"${context} and ${subject}"</strong> - Thematic discussions</li>
        </ul>
    </div>

    <h2>COURSES AND CERTIFICATIONS</h2>
    
    <div class="resource-section">
        <h3>Online courses:</h3>
        <ul class="checklist">
            <li>${subject} Fundamentals (40 hours)</li>
            <li>Advanced ${subject} Techniques (60 hours)</li>
            <li>${subject} for ${audience} (30 hours)</li>
            <li>${context} ${subject} Specialization (80 hours)</li>
        </ul>
        
        <h3>Professional certifications:</h3>
        <ul class="checklist">
            <li>Certified ${subject} Practitioner</li>
            <li>Advanced ${subject} Specialist</li>
            <li>${subject} Master Certification</li>
            <li>${context} ${subject} Expert</li>
        </ul>
    </div>

    <h2>COMMUNITIES AND NETWORKING</h2>
    
    <div class="resource-section">
        <h3>Professional groups:</h3>
        <ul>
            <li>${subject} Association</li>
            <li>LinkedIn Group "${subject} Professionals"</li>
            <li>Facebook Community "${subject} in ${context}"</li>
        </ul>
        
        <h3>Events and conferences:</h3>
        <ul>
            <li>Annual ${subject} Conference</li>
            <li>Monthly ${subject} Workshops</li>
            <li>Local ${subject} Meetups</li>
            <li>Weekly webinars</li>
        </ul>
    </div>

    <h2>TOOLS AND SOFTWARE</h2>
    
    <div class="resource-section">
        <h3>Free tools:</h3>
        <ul class="checklist">
            <li>${subject} Calculator - Quick calculations</li>
            <li>${subject} Planner - Project planning</li>
            <li>${subject} Tracker - Progress monitoring</li>
        </ul>
        
        <h3>Professional software:</h3>
        <ul class="checklist">
            <li>${subject} Pro Suite - Complete solution</li>
            <li>Advanced ${subject} Tools - Advanced tools</li>
            <li>${subject} Analytics - Analysis and reporting</li>
        </ul>
    </div>

    <h2>TEMPLATES AND MODELS</h2>
    
    <div class="resource-section">
        <h3>Useful documents:</h3>
        <ul class="checklist">
            <li>${subject} implementation plan template</li>
            <li>${subject} evaluation checklist</li>
            <li>${subject} progress report model</li>
            <li>${subject} best practices guide</li>
        </ul>
    </div>

    <h2>CONTINUOUS DEVELOPMENT</h2>
    
    <div class="timeline">
        <h3>6-month learning plan:</h3>
        
        <h4>Month 1-2: Foundation consolidation</h4>
        <ul>
            <li>Re-reading course materials</li>
            <li>Application in small projects</li>
            <li>Webinar participation</li>
        </ul>
        
        <h4>Month 3-4: Knowledge deepening</h4>
        <ul>
            <li>Reading an advanced book</li>
            <li>Workshop participation</li>
            <li>Expert networking</li>
        </ul>
        
        <h4>Month 5-6: Specialization</h4>
        <ul>
            <li>Choosing a specific niche</li>
            <li>Developing a complex project</li>
            <li>Certification preparation</li>
        </ul>
    </div>

    <h2>USEFUL CONTACTS</h2>
    
    <div class="resource-section">
        <h3>Mentors and consultants:</h3>
        <ul>
            <li><strong>Expert Name 1</strong> - email@expert1.com</li>
            <li><strong>Expert Name 2</strong> - email@expert2.com</li>
            <li><strong>Consultant Name</strong> - email@consultant.com</li>
        </ul>
        
        <h3>Support organizations:</h3>
        <ul>
            <li>${subject} Center of Excellence</li>
            <li>${context} ${subject} Institute</li>
            <li>Foundation for ${subject}</li>
        </ul>
    </div>

    <h2>UPDATES AND TRENDS</h2>
    
    <div class="resource-section">
        <h3>Current information sources:</h3>
        <ul class="checklist">
            <li>Specialized newsletters</li>
            <li>Annual industry reports</li>
            <li>Recent research studies</li>
            <li>Market analyses</li>
        </ul>
        
        <h3>Emerging trends in ${subject}:</h3>
        <ol>
            <li>Process digitalization</li>
            <li>Activity automation</li>
            <li>AI and ML integration</li>
            <li>Sustainability and responsibility</li>
            <li>Experience personalization</li>
        </ol>
    </div>
</body>
</html>`;
  }
}

// Helper function to create and upload file to Supabase Storage with proper binary conversion
async function createAndUploadFile(
  supabase: any,
  content: string | any[],
  fileName: string,
  format: string,
  type: string
): Promise<string | null> {
  try {
    console.log(`Creating ${format.toUpperCase()} file: ${fileName}`);
    
    let fileBuffer: ArrayBuffer;
    let contentType: string;
    
    if (format === 'docx') {
      // Convert HTML to DOCX using html-docx-js
      const htmlContent = content as string;
      console.log('Converting HTML to DOCX...');
      
      const docxBuffer = HTMLtoDOCX(htmlContent, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
      });
      
      fileBuffer = docxBuffer;
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
    } else if (format === 'pptx') {
      // Convert slides data to PPTX using pptxgenjs
      const slidesData = content as any[];
      console.log('Converting slides to PPTX...');
      
      const pptx = new PptxGenJS();
      
      // Set presentation properties
      pptx.author = 'Automator.ro';
      pptx.company = 'Automator.ro';
      pptx.title = fileName;
      
      // Add slides
      slidesData.forEach((slideData, index) => {
        const slide = pptx.addSlide();
        
        // Add title
        slide.addText(slideData.title, {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 1,
          fontSize: 24,
          bold: true,
          color: '2c3e50'
        });
        
        // Add content
        if (slideData.content && slideData.content.length > 0) {
          slideData.content.forEach((contentItem: any, contentIndex: number) => {
            slide.addText(contentItem.text, {
              x: 0.5,
              y: 1.8 + (contentIndex * 0.5),
              w: 9,
              h: 0.4,
              fontSize: contentItem.options?.fontSize || 16,
              color: '34495e'
            });
          });
        }
      });
      
      // Generate the PPTX file
      const pptxArrayBuffer = await pptx.write({ outputType: 'arraybuffer' });
      fileBuffer = pptxArrayBuffer as ArrayBuffer;
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      
    } else {
      // Fallback to text file
      const textContent = typeof content === 'string' ? content : JSON.stringify(content);
      fileBuffer = new TextEncoder().encode(textContent).buffer;
      contentType = 'text/plain';
    }
    
    // Generate unique file path
    const timestamp = Date.now();
    const filePath = `materials/${timestamp}/${fileName}.${format}`;
    
    console.log(`Uploading file to storage: ${filePath}, size: ${fileBuffer.byteLength} bytes`);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-materials')
      .upload(filePath, fileBuffer, {
        contentType: contentType,
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    console.log('File uploaded successfully:', filePath);
    return filePath;
  } catch (error) {
    console.error('Error creating/uploading file:', error);
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
    const { jobId, ...metadata } = await req.json();
    console.log('Request data:', { jobId, metadata });

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
    await updateJobProgress(supabase, jobId, 0, 'processing', 'Începe generarea materialelor...', 1, 'Structură + Obiective + Agendă');

    // Define the 7 materials to generate with proper content types
    const materialsToGenerate = [
      { type: 'foundation', name: 'Structura si Obiectivele Cursului', format: 'docx', stepNumber: 1, contentType: 'html' },
      { type: 'slides', name: 'Slide-uri de Prezentare', format: 'pptx', stepNumber: 2, contentType: 'slides' },
      { type: 'facilitator', name: 'Manual Facilitator', format: 'docx', stepNumber: 3, contentType: 'html' },
      { type: 'participant', name: 'Manual Participant', format: 'docx', stepNumber: 4, contentType: 'html' },
      { type: 'activities', name: 'Activitati si Exercitii', format: 'docx', stepNumber: 5, contentType: 'html' },
      { type: 'evaluation', name: 'Instrumente de Evaluare', format: 'docx', stepNumber: 6, contentType: 'html' },
      { type: 'resources', name: 'Resurse Suplimentare', format: 'docx', stepNumber: 7, contentType: 'html' },
    ];

    // Generate each material
    for (let i = 0; i < materialsToGenerate.length; i++) {
      const material = materialsToGenerate[i];
      const progress = Math.round(((i + 1) / materialsToGenerate.length) * 100);
      
      console.log(`Generating material ${i + 1}/7: ${material.name}`);
      
      // Update progress
      await updateJobProgress(
        supabase, 
        jobId, 
        progress - 10, 
        'processing', 
        `Generează ${material.name}...`,
        material.stepNumber,
        material.name
      );

      // Generate content based on type
      let content: string | any[];
      if (material.contentType === 'slides') {
        content = generatePPTXContent(metadata);
      } else {
        content = generateHTMLContent(material.type, metadata);
      }
      
      // Create and upload file with proper binary conversion
      const storagePath = await createAndUploadFile(
        supabase,
        content,
        material.name,
        material.format,
        material.type
      );

      if (!storagePath) {
        console.error(`Failed to upload material: ${material.name}`);
        await updateJobProgress(supabase, jobId, progress, 'failed', `Eroare la generarea ${material.name}`);
        return createErrorResponse(`Failed to generate ${material.name}`, 500);
      }

      // Create download expiry (72 hours from now)
      const downloadExpiry = new Date();
      downloadExpiry.setHours(downloadExpiry.getHours() + 72);

      // Save material to database
      const { error: materialError } = await supabase
        .from('materials')
        .insert({
          jobId: jobId,
          type: material.type,
          name: material.name,
          content: typeof content === 'string' ? content.substring(0, 10000) : JSON.stringify(content).substring(0, 10000), // Store truncated content for reference
          format: material.format,
          stepNumber: material.stepNumber,
          storage_path: storagePath,
          downloadExpiry: downloadExpiry.toISOString(),
        });

      if (materialError) {
        console.error('Error saving material to database:', materialError);
        await updateJobProgress(supabase, jobId, progress, 'failed', `Eroare la salvarea ${material.name}`);
        return createErrorResponse(`Failed to save ${material.name}`, 500);
      }

      // Update progress
      await updateJobProgress(
        supabase, 
        jobId, 
        progress, 
        'processing', 
        `${material.name} generat cu succes`,
        material.stepNumber,
        material.name
      );

      console.log(`Material ${i + 1}/7 generated successfully: ${material.name}`);
    }

    // Mark job as completed
    await updateJobProgress(supabase, jobId, 100, 'completed', 'Toate materialele au fost generate cu succes!');

    console.log('All materials generated successfully for job:', jobId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Materials generated successfully',
        materialsCount: materialsToGenerate.length
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