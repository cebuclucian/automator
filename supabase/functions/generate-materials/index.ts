import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import PptxGenJS from 'npm:pptxgenjs@3.12.0';
import { asBlob } from 'npm:html-docx-js@0.6.0';

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

// Helper function to generate HTML content for DOCX conversion
function generateHtmlContent(type: string, metadata: any): string {
  const { subject, language, level, audience, duration, tone, context } = metadata;
  
  const isRomanian = language === 'ro';
  
  switch (type) {
    case 'foundation':
      return generateFoundationHtml(subject, level, audience, duration, tone, context, isRomanian);
    case 'facilitator':
      return generateFacilitatorHtml(subject, level, audience, duration, tone, context, isRomanian);
    case 'participant':
      return generateParticipantHtml(subject, level, audience, duration, tone, context, isRomanian);
    case 'activities':
      return generateActivitiesHtml(subject, level, audience, duration, tone, context, isRomanian);
    case 'evaluation':
      return generateEvaluationHtml(subject, level, audience, duration, tone, context, isRomanian);
    case 'resources':
      return generateResourcesHtml(subject, level, audience, duration, tone, context, isRomanian);
    default:
      return '<p>Content not available</p>';
  }
}

// Helper function to generate PPTX slides
function generatePptxSlides(metadata: any): any[] {
  const { subject, language, level, audience, duration, tone, context } = metadata;
  const isRomanian = language === 'ro';
  
  const slides = [];
  
  // Slide 1: Title
  slides.push({
    title: isRomanian ? 'Titlu' : 'Title',
    content: [
      { text: subject, options: { fontSize: 44, bold: true, color: '363636' } },
      { text: isRomanian ? `Curs pentru ${audience}` : `Course for ${audience}`, options: { fontSize: 24, color: '666666' } },
      { text: isRomanian ? `Nivel: ${level}` : `Level: ${level}`, options: { fontSize: 18, color: '888888' } }
    ]
  });
  
  // Slide 2: Objectives
  slides.push({
    title: isRomanian ? 'Obiectivele cursului' : 'Course Objectives',
    content: [
      { text: isRomanian ? '• Înțelegerea conceptelor de bază' : '• Understanding basic concepts', options: { fontSize: 20 } },
      { text: isRomanian ? '• Aplicarea practică a cunoștințelor' : '• Practical application of knowledge', options: { fontSize: 20 } },
      { text: isRomanian ? '• Dezvoltarea competențelor specifice' : '• Development of specific skills', options: { fontSize: 20 } },
      { text: isRomanian ? '• Evaluarea progresului personal' : '• Personal progress evaluation', options: { fontSize: 20 } }
    ]
  });
  
  // Slide 3: Agenda
  slides.push({
    title: isRomanian ? 'Agenda' : 'Agenda',
    content: [
      { text: isRomanian ? '1. Introducere (15 min)' : '1. Introduction (15 min)', options: { fontSize: 18 } },
      { text: isRomanian ? '2. Concepte fundamentale (45 min)' : '2. Fundamental concepts (45 min)', options: { fontSize: 18 } },
      { text: isRomanian ? '3. Pauză (15 min)' : '3. Break (15 min)', options: { fontSize: 18 } },
      { text: isRomanian ? '4. Aplicații practice (60 min)' : '4. Practical applications (60 min)', options: { fontSize: 18 } },
      { text: isRomanian ? '5. Exerciții (30 min)' : '5. Exercises (30 min)', options: { fontSize: 18 } },
      { text: isRomanian ? '6. Evaluare și închidere (15 min)' : '6. Evaluation and closing (15 min)', options: { fontSize: 18 } }
    ]
  });
  
  // Slide 4: Key Concepts
  slides.push({
    title: isRomanian ? 'Concepte Cheie' : 'Key Concepts',
    content: [
      { text: isRomanian ? '• Definiții importante' : '• Important definitions', options: { fontSize: 20 } },
      { text: isRomanian ? '• Principii fundamentale' : '• Fundamental principles', options: { fontSize: 20 } },
      { text: isRomanian ? '• Teorii relevante' : '• Relevant theories', options: { fontSize: 20 } },
      { text: isRomanian ? '• Best practices' : '• Best practices', options: { fontSize: 20 } }
    ]
  });
  
  // Slide 5: Practical Applications
  slides.push({
    title: isRomanian ? 'Aplicații Practice' : 'Practical Applications',
    content: [
      { text: isRomanian ? '• Studii de caz reale' : '• Real case studies', options: { fontSize: 20 } },
      { text: isRomanian ? '• Exemple din industrie' : '• Industry examples', options: { fontSize: 20 } },
      { text: isRomanian ? '• Exerciții hands-on' : '• Hands-on exercises', options: { fontSize: 20 } },
      { text: isRomanian ? '• Simulări' : '• Simulations', options: { fontSize: 20 } }
    ]
  });
  
  // Slide 6: Thank You
  slides.push({
    title: isRomanian ? 'Mulțumiri' : 'Thank You',
    content: [
      { text: isRomanian ? 'Vă mulțumim pentru participare!' : 'Thank you for your participation!', options: { fontSize: 32, bold: true, color: '363636' } },
      { text: 'Contact: [email/telefon]', options: { fontSize: 18, color: '666666' } }
    ]
  });
  
  return slides;
}

function generateFoundationHtml(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Structura și Obiectivele Cursului</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
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
        <div class="info-item"><strong>Subiect:</strong> ${subject}</div>
        <div class="info-item"><strong>Nivel:</strong> ${level}</div>
        <div class="info-item"><strong>Public țintă:</strong> ${audience}</div>
        <div class="info-item"><strong>Durată:</strong> ${duration}</div>
        <div class="info-item"><strong>Context:</strong> ${context}</div>
        <div class="info-item"><strong>Ton:</strong> ${tone}</div>
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
        <li>Introducere și prezentări (15 minute)</li>
        <li>Concepte fundamentale (30% din timp)</li>
        <li>Aplicații practice (40% din timp)</li>
        <li>Exerciții și activități (20% din timp)</li>
        <li>Evaluare și feedback (10% din timp)</li>
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
    <title>Course Structure and Objectives</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
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
        <div class="info-item"><strong>Subject:</strong> ${subject}</div>
        <div class="info-item"><strong>Level:</strong> ${level}</div>
        <div class="info-item"><strong>Target Audience:</strong> ${audience}</div>
        <div class="info-item"><strong>Duration:</strong> ${duration}</div>
        <div class="info-item"><strong>Context:</strong> ${context}</div>
        <div class="info-item"><strong>Tone:</strong> ${tone}</div>
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
        <li>Introduction and presentations (15 minutes)</li>
        <li>Fundamental concepts (30% of time)</li>
        <li>Practical applications (40% of time)</li>
        <li>Exercises and activities (20% of time)</li>
        <li>Evaluation and feedback (10% of time)</li>
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

function generateFacilitatorHtml(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Manual Facilitator</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .checklist { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .checklist ul { list-style-type: none; padding-left: 0; }
        .checklist li:before { content: "□ "; font-weight: bold; }
        .tip { background: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>MANUAL FACILITATOR: ${subject}</h1>
    
    <h2>PREGĂTIREA CURSULUI</h2>
    <div class="checklist">
        <p><strong>Înainte de curs:</strong></p>
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
    
    <div class="tip">
        <h3>Tehnici de facilitare:</h3>
        <ul>
            <li>Ascultare activă</li>
            <li>Întrebări deschise</li>
            <li>Reformularea ideilor</li>
            <li>Gestionarea conflictelor</li>
            <li>Încurajarea participării</li>
        </ul>
    </div>

    <h3>Situații dificile:</h3>
    <ul>
        <li>Participanți dominatori</li>
        <li>Persoane timide</li>
        <li>Întrebări dificile</li>
        <li>Tensiuni în grup</li>
        <li>Probleme tehnice</li>
    </ul>

    <h2>EVALUAREA PROGRESULUI</h2>
    <p><strong>Metode de evaluare:</strong></p>
    <ul>
        <li>Observarea comportamentului</li>
        <li>Întrebări de verificare</li>
        <li>Exerciții practice</li>
        <li>Feedback verbal</li>
        <li>Auto-evaluarea participanților</li>
    </ul>

    <h2>ÎNCHIDEREA CURSULUI</h2>
    <p><strong>Ultimele 15 minute:</strong></p>
    <ul>
        <li>Rezumați punctele cheie</li>
        <li>Verificați atingerea obiectivelor</li>
        <li>Colectați feedback</li>
        <li>Distribuiți certificatele</li>
        <li>Planificați follow-up-ul</li>
    </ul>

    <h2>RESURSE PENTRU FACILITATOR</h2>
    <div class="checklist">
        <p><strong>Materiale necesare:</strong></p>
        <ul>
            <li>Laptop și proiector</li>
            <li>Flipchart și markere</li>
            <li>Post-it-uri</li>
            <li>Materiale printate</li>
            <li>Certificate de participare</li>
        </ul>
    </div>

    <div class="tip">
        <p><strong>Backup plan:</strong></p>
        <ul>
            <li>Activități alternative</li>
            <li>Exerciții fără tehnologie</li>
            <li>Materiale suplimentare</li>
            <li>Contacte de urgență</li>
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
    <title>Facilitator Manual</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .checklist { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .checklist ul { list-style-type: none; padding-left: 0; }
        .checklist li:before { content: "□ "; font-weight: bold; }
        .tip { background: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>FACILITATOR MANUAL: ${subject}</h1>
    
    <h2>COURSE PREPARATION</h2>
    <div class="checklist">
        <p><strong>Before the course:</strong></p>
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
    
    <div class="tip">
        <h3>Facilitation techniques:</h3>
        <ul>
            <li>Active listening</li>
            <li>Open questions</li>
            <li>Idea reformulation</li>
            <li>Conflict management</li>
            <li>Encouraging participation</li>
        </ul>
    </div>

    <h3>Difficult situations:</h3>
    <ul>
        <li>Dominating participants</li>
        <li>Shy people</li>
        <li>Difficult questions</li>
        <li>Group tensions</li>
        <li>Technical problems</li>
    </ul>

    <h2>PROGRESS EVALUATION</h2>
    <p><strong>Evaluation methods:</strong></p>
    <ul>
        <li>Behavior observation</li>
        <li>Verification questions</li>
        <li>Practical exercises</li>
        <li>Verbal feedback</li>
        <li>Participant self-assessment</li>
    </ul>

    <h2>COURSE CLOSING</h2>
    <p><strong>Last 15 minutes:</strong></p>
    <ul>
        <li>Summarize key points</li>
        <li>Check objective achievement</li>
        <li>Collect feedback</li>
        <li>Distribute certificates</li>
        <li>Plan follow-up</li>
    </ul>

    <h2>FACILITATOR RESOURCES</h2>
    <div class="checklist">
        <p><strong>Required materials:</strong></p>
        <ul>
            <li>Laptop and projector</li>
            <li>Flipchart and markers</li>
            <li>Post-it notes</li>
            <li>Printed materials</li>
            <li>Participation certificates</li>
        </ul>
    </div>

    <div class="tip">
        <p><strong>Backup plan:</strong></p>
        <ul>
            <li>Alternative activities</li>
            <li>Technology-free exercises</li>
            <li>Additional materials</li>
            <li>Emergency contacts</li>
        </ul>
    </div>
</body>
</html>`;
  }
}

function generateParticipantHtml(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Manual Participant</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .worksheet { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; margin: 15px 0; border-radius: 5px; }
        .fill-in { border-bottom: 1px solid #333; display: inline-block; min-width: 200px; margin: 0 5px; }
        .checkbox { margin-right: 10px; }
        .objectives { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>MANUAL PARTICIPANT: ${subject}</h1>
    
    <div style="text-align: center; background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h2>BINE ATI VENIT!</h2>
        <p>Acest manual vă va ghida prin cursul de <strong>${subject}</strong>. Vă rugăm să îl folosiți pentru a lua notițe și a urmări progresul dvs.</p>
    </div>

    <div class="objectives">
        <h2>OBIECTIVELE CURSULUI</h2>
        <p>La sfârșitul acestui curs veți fi capabili să:</p>
        <ul style="list-style-type: none; padding-left: 0;">
            <li><span class="checkbox">□</span> Înțelegeți conceptele fundamentale</li>
            <li><span class="checkbox">□</span> Aplicați cunoștințele în practică</li>
            <li><span class="checkbox">□</span> Rezolvați probleme specifice</li>
            <li><span class="checkbox">□</span> Evaluați propriul progres</li>
        </ul>
    </div>

    <h2>SECȚIUNEA 1: CONCEPTE FUNDAMENTALE</h2>
    <div class="worksheet">
        <h3>Definiții importante:</h3>
        <p><span class="fill-in"></span></p>
        <p><span class="fill-in"></span></p>
        <p><span class="fill-in"></span></p>

        <h3>Principii de bază:</h3>
        <p>1. <span class="fill-in"></span></p>
        <p>2. <span class="fill-in"></span></p>
        <p>3. <span class="fill-in"></span></p>

        <h3>Notițe personale:</h3>
        <p><span class="fill-in"></span></p>
        <p><span class="fill-in"></span></p>
        <p><span class="fill-in"></span></p>
    </div>

    <h2>SECȚIUNEA 2: APLICAȚII PRACTICE</h2>
    <div class="worksheet">
        <h3>Studiul de caz 1:</h3>
        <p>Situația: <span class="fill-in"></span></p>
        <p>Soluția propusă: <span class="fill-in"></span></p>
        <p>Rezultate: <span class="fill-in"></span></p>

        <h3>Studiul de caz 2:</h3>
        <p>Situația: <span class="fill-in"></span></p>
        <p>Soluția propusă: <span class="fill-in"></span></p>
        <p>Rezultate: <span class="fill-in"></span></p>
    </div>

    <h2>SECȚIUNEA 3: EXERCIȚII</h2>
    <div class="worksheet">
        <h3>Exercițiul 1:</h3>
        <p>Sarcina: <span class="fill-in"></span></p>
        <p>Răspunsul meu: <span class="fill-in"></span></p>
        <p>Feedback: <span class="fill-in"></span></p>

        <h3>Exercițiul 2:</h3>
        <p>Sarcina: <span class="fill-in"></span></p>
        <p>Răspunsul meu: <span class="fill-in"></span></p>
        <p>Feedback: <span class="fill-in"></span></p>
    </div>

    <h2>SECȚIUNEA 4: PLANUL MEU DE ACȚIUNE</h2>
    <div class="worksheet">
        <h3>Ce voi aplica imediat:</h3>
        <p>1. <span class="fill-in"></span></p>
        <p>2. <span class="fill-in"></span></p>
        <p>3. <span class="fill-in"></span></p>

        <h3>Ce voi dezvolta pe termen lung:</h3>
        <p>1. <span class="fill-in"></span></p>
        <p>2. <span class="fill-in"></span></p>
        <p>3. <span class="fill-in"></span></p>
    </div>

    <h2>RESURSE SUPLIMENTARE</h2>
    <div class="worksheet">
        <h3>Cărți recomandate:</h3>
        <p>• <span class="fill-in"></span></p>
        <p>• <span class="fill-in"></span></p>
        <p>• <span class="fill-in"></span></p>

        <h3>Site-uri web utile:</h3>
        <p>• <span class="fill-in"></span></p>
        <p>• <span class="fill-in"></span></p>
        <p>• <span class="fill-in"></span></p>
    </div>

    <h2>EVALUAREA CURSULUI</h2>
    <div class="worksheet">
        <p>Nota generală: <span class="fill-in"></span></p>
        <p>Cel mai util aspect: <span class="fill-in"></span></p>
        <p>Sugestii de îmbunătățire: <span class="fill-in"></span></p>
        <p><span class="fill-in"></span></p>
    </div>

    <div style="text-align: center; background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 30px 0;">
        <h2>CERTIFICATE</h2>
        <p><strong>Felicitări pentru finalizarea cursului!</strong></p>
        <p>Data: <span class="fill-in"></span></p>
        <p>Semnătura facilitatorului: <span class="fill-in"></span></p>
    </div>
</body>
</html>`;
  } else {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Participant Manual</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .worksheet { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; margin: 15px 0; border-radius: 5px; }
        .fill-in { border-bottom: 1px solid #333; display: inline-block; min-width: 200px; margin: 0 5px; }
        .checkbox { margin-right: 10px; }
        .objectives { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>PARTICIPANT MANUAL: ${subject}</h1>
    
    <div style="text-align: center; background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h2>WELCOME!</h2>
        <p>This manual will guide you through the <strong>${subject}</strong> course. Please use it to take notes and track your progress.</p>
    </div>

    <div class="objectives">
        <h2>COURSE OBJECTIVES</h2>
        <p>By the end of this course you will be able to:</p>
        <ul style="list-style-type: none; padding-left: 0;">
            <li><span class="checkbox">□</span> Understand fundamental concepts</li>
            <li><span class="checkbox">□</span> Apply knowledge in practice</li>
            <li><span class="checkbox">□</span> Solve specific problems</li>
            <li><span class="checkbox">□</span> Evaluate your own progress</li>
        </ul>
    </div>

    <h2>SECTION 1: FUNDAMENTAL CONCEPTS</h2>
    <div class="worksheet">
        <h3>Important definitions:</h3>
        <p><span class="fill-in"></span></p>
        <p><span class="fill-in"></span></p>
        <p><span class="fill-in"></span></p>

        <h3>Basic principles:</h3>
        <p>1. <span class="fill-in"></span></p>
        <p>2. <span class="fill-in"></span></p>
        <p>3. <span class="fill-in"></span></p>

        <h3>Personal notes:</h3>
        <p><span class="fill-in"></span></p>
        <p><span class="fill-in"></span></p>
        <p><span class="fill-in"></span></p>
    </div>

    <h2>SECTION 2: PRACTICAL APPLICATIONS</h2>
    <div class="worksheet">
        <h3>Case study 1:</h3>
        <p>Situation: <span class="fill-in"></span></p>
        <p>Proposed solution: <span class="fill-in"></span></p>
        <p>Results: <span class="fill-in"></span></p>

        <h3>Case study 2:</h3>
        <p>Situation: <span class="fill-in"></span></p>
        <p>Proposed solution: <span class="fill-in"></span></p>
        <p>Results: <span class="fill-in"></span></p>
    </div>

    <h2>SECTION 3: EXERCISES</h2>
    <div class="worksheet">
        <h3>Exercise 1:</h3>
        <p>Task: <span class="fill-in"></span></p>
        <p>My answer: <span class="fill-in"></span></p>
        <p>Feedback: <span class="fill-in"></span></p>

        <h3>Exercise 2:</h3>
        <p>Task: <span class="fill-in"></span></p>
        <p>My answer: <span class="fill-in"></span></p>
        <p>Feedback: <span class="fill-in"></span></p>
    </div>

    <h2>SECTION 4: MY ACTION PLAN</h2>
    <div class="worksheet">
        <h3>What I will apply immediately:</h3>
        <p>1. <span class="fill-in"></span></p>
        <p>2. <span class="fill-in"></span></p>
        <p>3. <span class="fill-in"></span></p>

        <h3>What I will develop long-term:</h3>
        <p>1. <span class="fill-in"></span></p>
        <p>2. <span class="fill-in"></span></p>
        <p>3. <span class="fill-in"></span></p>
    </div>

    <h2>ADDITIONAL RESOURCES</h2>
    <div class="worksheet">
        <h3>Recommended books:</h3>
        <p>• <span class="fill-in"></span></p>
        <p>• <span class="fill-in"></span></p>
        <p>• <span class="fill-in"></span></p>

        <h3>Useful websites:</h3>
        <p>• <span class="fill-in"></span></p>
        <p>• <span class="fill-in"></span></p>
        <p>• <span class="fill-in"></span></p>
    </div>

    <h2>COURSE EVALUATION</h2>
    <div class="worksheet">
        <p>Overall rating: <span class="fill-in"></span></p>
        <p>Most useful aspect: <span class="fill-in"></span></p>
        <p>Improvement suggestions: <span class="fill-in"></span></p>
        <p><span class="fill-in"></span></p>
    </div>

    <div style="text-align: center; background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 30px 0;">
        <h2>CERTIFICATE</h2>
        <p><strong>Congratulations on completing the course!</strong></p>
        <p>Date: <span class="fill-in"></span></p>
        <p>Facilitator signature: <span class="fill-in"></span></p>
    </div>
</body>
</html>`;
  }
}

function generateActivitiesHtml(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Activități și Exerciții</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .activity { background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .activity-header { background: #007bff; color: white; padding: 10px; margin: -20px -20px 15px -20px; border-radius: 5px 5px 0 0; }
        .time-info { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .instructions { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .materials { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>ACTIVITĂȚI ȘI EXERCIȚII: ${subject}</h1>
    
    <div class="activity">
        <div class="activity-header">
            <h2 style="margin: 0; color: white;">ACTIVITATEA 1: BRAINSTORMING</h2>
        </div>
        <div class="time-info">
            <strong>Timp:</strong> 15 minute | <strong>Participanți:</strong> Toți | <strong>Obiectiv:</strong> Generarea de idei creative
        </div>
        
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
            <h2 style="margin: 0; color: white;">ACTIVITATEA 2: STUDIU DE CAZ</h2>
        </div>
        <div class="time-info">
            <strong>Timp:</strong> 30 minute | <strong>Participanți:</strong> Grupuri de 3-4 persoane | <strong>Obiectiv:</strong> Aplicarea practică a conceptelor
        </div>
        
        <h3>Scenariul:</h3>
        <p>O companie din domeniul ${context} se confruntă cu următoarea provocare...</p>
        <p><em>[Descrierea detaliată a situației]</em></p>
        
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
            <h2 style="margin: 0; color: white;">ACTIVITATEA 3: ROLE-PLAYING</h2>
        </div>
        <div class="time-info">
            <strong>Timp:</strong> 20 minute | <strong>Participanți:</strong> Perechi | <strong>Obiectiv:</strong> Exersarea competențelor practice
        </div>
        
        <h3>Roluri:</h3>
        <ul>
            <li><strong>Persoana A:</strong> Manager/Facilitator</li>
            <li><strong>Persoana B:</strong> Angajat/Participant</li>
        </ul>
        
        <p><strong>Scenariul:</strong> Simulați o situație în care trebuie să aplicați principiile învățate...</p>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2 style="margin: 0; color: white;">ACTIVITATEA 4: QUIZ INTERACTIV</h2>
        </div>
        <div class="time-info">
            <strong>Timp:</strong> 15 minute | <strong>Participanți:</strong> Individual | <strong>Obiectiv:</strong> Verificarea cunoștințelor
        </div>
        
        <div class="instructions">
            <h3>Întrebări:</h3>
            <ol>
                <li>Care sunt cele 3 principii fundamentale ale ${subject}?</li>
                <li>Dați un exemplu de aplicare practică</li>
                <li>Care sunt principalele provocări în implementare?</li>
                <li>Cum măsurați succesul?</li>
                <li>Ce resurse sunt necesare?</li>
            </ol>
        </div>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2 style="margin: 0; color: white;">ACTIVITATEA 5: PLANUL DE ACȚIUNE</h2>
        </div>
        <div class="time-info">
            <strong>Timp:</strong> 25 minute | <strong>Participanți:</strong> Individual apoi în perechi | <strong>Obiectiv:</strong> Planificarea implementării
        </div>
        
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
            <h2 style="margin: 0; color: white;">ACTIVITATEA 6: FEEDBACK 360°</h2>
        </div>
        <div class="time-info">
            <strong>Timp:</strong> 20 minute | <strong>Participanți:</strong> Grupuri de 6 persoane | <strong>Obiectiv:</strong> Dezvoltarea competențelor de feedback
        </div>
        
        <div class="instructions">
            <h3>Proces:</h3>
            <ol>
                <li>Fiecare prezintă o situație (2 minute)</li>
                <li>Ceilalți oferă feedback constructiv (3 minute)</li>
                <li>Rotația continuă până toți au prezentat</li>
            </ol>
        </div>
    </div>

    <div class="materials">
        <h2>MATERIALE NECESARE:</h2>
        <ul style="list-style-type: none; padding-left: 0;">
            <li>□ Flipchart și markere</li>
            <li>□ Post-it-uri colorate</li>
            <li>□ Cronometru</li>
            <li>□ Fișe de evaluare</li>
            <li>□ Premii simbolice pentru activități</li>
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
    <title>Activities and Exercises</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .activity { background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .activity-header { background: #007bff; color: white; padding: 10px; margin: -20px -20px 15px -20px; border-radius: 5px 5px 0 0; }
        .time-info { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .instructions { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .materials { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>ACTIVITIES AND EXERCISES: ${subject}</h1>
    
    <div class="activity">
        <div class="activity-header">
            <h2 style="margin: 0; color: white;">ACTIVITY 1: BRAINSTORMING</h2>
        </div>
        <div class="time-info">
            <strong>Time:</strong> 15 minutes | <strong>Participants:</strong> Everyone | <strong>Objective:</strong> Generate creative ideas
        </div>
        
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
            <h2 style="margin: 0; color: white;">ACTIVITY 2: CASE STUDY</h2>
        </div>
        <div class="time-info">
            <strong>Time:</strong> 30 minutes | <strong>Participants:</strong> Groups of 3-4 people | <strong>Objective:</strong> Practical application of concepts
        </div>
        
        <h3>Scenario:</h3>
        <p>A company in the ${context} field faces the following challenge...</p>
        <p><em>[Detailed situation description]</em></p>
        
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
            <h2 style="margin: 0; color: white;">ACTIVITY 3: ROLE-PLAYING</h2>
        </div>
        <div class="time-info">
            <strong>Time:</strong> 20 minutes | <strong>Participants:</strong> Pairs | <strong>Objective:</strong> Practice practical skills
        </div>
        
        <h3>Roles:</h3>
        <ul>
            <li><strong>Person A:</strong> Manager/Facilitator</li>
            <li><strong>Person B:</strong> Employee/Participant</li>
        </ul>
        
        <p><strong>Scenario:</strong> Simulate a situation where you need to apply the learned principles...</p>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2 style="margin: 0; color: white;">ACTIVITY 4: INTERACTIVE QUIZ</h2>
        </div>
        <div class="time-info">
            <strong>Time:</strong> 15 minutes | <strong>Participants:</strong> Individual | <strong>Objective:</strong> Knowledge verification
        </div>
        
        <div class="instructions">
            <h3>Questions:</h3>
            <ol>
                <li>What are the 3 fundamental principles of ${subject}?</li>
                <li>Give an example of practical application</li>
                <li>What are the main implementation challenges?</li>
                <li>How do you measure success?</li>
                <li>What resources are needed?</li>
            </ol>
        </div>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2 style="margin: 0; color: white;">ACTIVITY 5: ACTION PLAN</h2>
        </div>
        <div class="time-info">
            <strong>Time:</strong> 25 minutes | <strong>Participants:</strong> Individual then in pairs | <strong>Objective:</strong> Implementation planning
        </div>
        
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
            <h2 style="margin: 0; color: white;">ACTIVITY 6: 360° FEEDBACK</h2>
        </div>
        <div class="time-info">
            <strong>Time:</strong> 20 minutes | <strong>Participants:</strong> Groups of 6 people | <strong>Objective:</strong> Develop feedback skills
        </div>
        
        <div class="instructions">
            <h3>Process:</h3>
            <ol>
                <li>Each presents a situation (2 minutes)</li>
                <li>Others provide constructive feedback (3 minutes)</li>
                <li>Rotation continues until everyone has presented</li>
            </ol>
        </div>
    </div>

    <div class="materials">
        <h2>REQUIRED MATERIALS:</h2>
        <ul style="list-style-type: none; padding-left: 0;">
            <li>□ Flipchart and markers</li>
            <li>□ Colored post-it notes</li>
            <li>□ Timer</li>
            <li>□ Evaluation sheets</li>
            <li>□ Symbolic prizes for activities</li>
        </ul>
    </div>
</body>
</html>`;
  }
}

function generateEvaluationHtml(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Instrumente de Evaluare</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .evaluation-section { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .scale { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .criteria { background: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .fill-in { border-bottom: 1px solid #333; display: inline-block; min-width: 200px; margin: 0 5px; }
        .checkbox { margin-right: 10px; }
        .rating { display: inline-block; margin: 0 10px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>INSTRUMENTE DE EVALUARE: ${subject}</h1>
    
    <div class="evaluation-section">
        <h2>EVALUARE INIȚIALĂ (PRE-CURS)</h2>
        
        <h3>Întrebări de evaluare a cunoștințelor:</h3>
        <ol>
            <li>Cât de familiar sunteți cu ${subject}? (1-10) <span class="fill-in"></span></li>
            <li>Ce experiență aveți în domeniu? <span class="fill-in"></span></li>
            <li>Care sunt așteptările dvs. de la acest curs? <span class="fill-in"></span></li>
            <li>Ce provocări întâmpinați în prezent? <span class="fill-in"></span></li>
            <li>Cum măsurați succesul în acest domeniu? <span class="fill-in"></span></li>
        </ol>
    </div>

    <div class="evaluation-section">
        <h2>EVALUARE CONTINUĂ (DURANTE CURS)</h2>
        
        <h3>Checkpoint 1 (după 30 minute):</h3>
        <ul style="list-style-type: none; padding-left: 0;">
            <li><span class="checkbox">□</span> Conceptele sunt clare</li>
            <li><span class="checkbox">□</span> Ritmul este potrivit</li>
            <li><span class="checkbox">□</span> Exemplele sunt relevante</li>
            <li><span class="checkbox">□</span> Am întrebări despre: <span class="fill-in"></span></li>
        </ul>

        <h3>Checkpoint 2 (după exerciții):</h3>
        <ul style="list-style-type: none; padding-left: 0;">
            <li><span class="checkbox">□</span> Am înțeles aplicațiile practice</li>
            <li><span class="checkbox">□</span> Pot să aplic cunoștințele</li>
            <li><span class="checkbox">□</span> Am nevoie de clarificări la: <span class="fill-in"></span></li>
            <li><span class="checkbox">□</span> Mă simt confortabil cu materialul</li>
        </ul>
    </div>

    <div class="evaluation-section">
        <h2>EVALUARE FINALĂ (POST-CURS)</h2>
        
        <h3>Test de cunoștințe:</h3>
        
        <p><strong>1. Definiți conceptul principal al ${subject}:</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        
        <p><strong>2. Enumerați 3 beneficii ale aplicării acestor principii:</strong></p>
        <p>a) <span class="fill-in"></span></p>
        <p>b) <span class="fill-in"></span></p>
        <p>c) <span class="fill-in"></span></p>
        
        <p><strong>3. Descrieți un scenariu de aplicare practică:</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        
        <p><strong>4. Care sunt principalele provocări în implementare?</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        
        <p><strong>5. Cum veți măsura progresul dvs.?</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
    </div>

    <div class="evaluation-section">
        <h2>EVALUAREA COMPETENȚELOR PRACTICE</h2>
        
        <h3>Exercițiul practic:</h3>
        <p><strong>Sarcina:</strong> Aplicați principiile învățate într-o situație simulată</p>
        
        <div class="criteria">
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
                    <td><span class="fill-in" style="min-width: 50px;"></span></td>
                    <td><span class="fill-in"></span></td>
                </tr>
                <tr>
                    <td>Aplicarea corectă</td>
                    <td>25%</td>
                    <td><span class="fill-in" style="min-width: 50px;"></span></td>
                    <td><span class="fill-in"></span></td>
                </tr>
                <tr>
                    <td>Creativitatea soluției</td>
                    <td>25%</td>
                    <td><span class="fill-in" style="min-width: 50px;"></span></td>
                    <td><span class="fill-in"></span></td>
                </tr>
                <tr>
                    <td>Comunicarea rezultatelor</td>
                    <td>25%</td>
                    <td><span class="fill-in" style="min-width: 50px;"></span></td>
                    <td><span class="fill-in"></span></td>
                </tr>
            </table>
        </div>
        
        <div class="scale">
            <h3>Scala de notare:</h3>
            <ul>
                <li><strong>Excelent (9-10):</strong> Depășește așteptările</li>
                <li><strong>Bun (7-8):</strong> Îndeplinește așteptările</li>
                <li><strong>Satisfăcător (5-6):</strong> Îndeplinește parțial</li>
                <li><strong>Nesatisfăcător (1-4):</strong> Nu îndeplinește</li>
            </ul>
        </div>
    </div>

    <div class="evaluation-section">
        <h2>AUTO-EVALUAREA</h2>
        
        <h3>Reflecție personală:</h3>
        <p><strong>1. Ce am învățat cel mai important?</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        
        <p><strong>2. Cum voi aplica aceste cunoștințe?</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        
        <p><strong>3. Ce competențe vreau să dezvolt mai mult?</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        
        <p><strong>4. Care este următorul meu pas?</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
    </div>

    <div class="evaluation-section">
        <h2>EVALUAREA CURSULUI</h2>
        
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
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
            </tr>
            <tr>
                <td>Facilitatorul</td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
            </tr>
            <tr>
                <td>Materialele</td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
            </tr>
        </table>
        
        <h3>Recomandări:</h3>
        <ul style="list-style-type: none; padding-left: 0;">
            <li><span class="checkbox">□</span> Recomand cu căldură</li>
            <li><span class="checkbox">□</span> Recomand</li>
            <li><span class="checkbox">□</span> Recomand cu rezerve</li>
            <li><span class="checkbox">□</span> Nu recomand</li>
        </ul>
        
        <p><strong>Sugestii de îmbunătățire:</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
    </div>

    <div class="evaluation-section">
        <h2>PLANUL DE DEZVOLTARE CONTINUĂ</h2>
        
        <h3>Obiective pe termen scurt (1-3 luni):</h3>
        <p>1. <span class="fill-in"></span></p>
        <p>2. <span class="fill-in"></span></p>
        <p>3. <span class="fill-in"></span></p>
        
        <h3>Obiective pe termen lung (6-12 luni):</h3>
        <p>1. <span class="fill-in"></span></p>
        <p>2. <span class="fill-in"></span></p>
        <p>3. <span class="fill-in"></span></p>
        
        <h3>Resurse pentru dezvoltare:</h3>
        <ul style="list-style-type: none; padding-left: 0;">
            <li><span class="checkbox">□</span> Cărți suplimentare</li>
            <li><span class="checkbox">□</span> Cursuri avansate</li>
            <li><span class="checkbox">□</span> Mentoring</li>
            <li><span class="checkbox">□</span> Practică ghidată</li>
            <li><span class="checkbox">□</span> Comunități de practică</li>
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
    <title>Evaluation Tools</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .evaluation-section { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .scale { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .criteria { background: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .fill-in { border-bottom: 1px solid #333; display: inline-block; min-width: 200px; margin: 0 5px; }
        .checkbox { margin-right: 10px; }
        .rating { display: inline-block; margin: 0 10px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>EVALUATION TOOLS: ${subject}</h1>
    
    <div class="evaluation-section">
        <h2>INITIAL EVALUATION (PRE-COURSE)</h2>
        
        <h3>Knowledge assessment questions:</h3>
        <ol>
            <li>How familiar are you with ${subject}? (1-10) <span class="fill-in"></span></li>
            <li>What experience do you have in the field? <span class="fill-in"></span></li>
            <li>What are your expectations from this course? <span class="fill-in"></span></li>
            <li>What challenges are you currently facing? <span class="fill-in"></span></li>
            <li>How do you measure success in this domain? <span class="fill-in"></span></li>
        </ol>
    </div>

    <div class="evaluation-section">
        <h2>CONTINUOUS EVALUATION (DURING COURSE)</h2>
        
        <h3>Checkpoint 1 (after 30 minutes):</h3>
        <ul style="list-style-type: none; padding-left: 0;">
            <li><span class="checkbox">□</span> Concepts are clear</li>
            <li><span class="checkbox">□</span> Pace is appropriate</li>
            <li><span class="checkbox">□</span> Examples are relevant</li>
            <li><span class="checkbox">□</span> I have questions about: <span class="fill-in"></span></li>
        </ul>

        <h3>Checkpoint 2 (after exercises):</h3>
        <ul style="list-style-type: none; padding-left: 0;">
            <li><span class="checkbox">□</span> I understood practical applications</li>
            <li><span class="checkbox">□</span> I can apply the knowledge</li>
            <li><span class="checkbox">□</span> I need clarifications on: <span class="fill-in"></span></li>
            <li><span class="checkbox">□</span> I feel comfortable with the material</li>
        </ul>
    </div>

    <div class="evaluation-section">
        <h2>FINAL EVALUATION (POST-COURSE)</h2>
        
        <h3>Knowledge test:</h3>
        
        <p><strong>1. Define the main concept of ${subject}:</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        
        <p><strong>2. List 3 benefits of applying these principles:</strong></p>
        <p>a) <span class="fill-in"></span></p>
        <p>b) <span class="fill-in"></span></p>
        <p>c) <span class="fill-in"></span></p>
        
        <p><strong>3. Describe a practical application scenario:</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        
        <p><strong>4. What are the main implementation challenges?</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        
        <p><strong>5. How will you measure your progress?</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
    </div>

    <div class="evaluation-section">
        <h2>PRACTICAL SKILLS EVALUATION</h2>
        
        <h3>Practical exercise:</h3>
        <p><strong>Task:</strong> Apply learned principles in a simulated situation</p>
        
        <div class="criteria">
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
                    <td><span class="fill-in" style="min-width: 50px;"></span></td>
                    <td><span class="fill-in"></span></td>
                </tr>
                <tr>
                    <td>Correct application</td>
                    <td>25%</td>
                    <td><span class="fill-in" style="min-width: 50px;"></span></td>
                    <td><span class="fill-in"></span></td>
                </tr>
                <tr>
                    <td>Solution creativity</td>
                    <td>25%</td>
                    <td><span class="fill-in" style="min-width: 50px;"></span></td>
                    <td><span class="fill-in"></span></td>
                </tr>
                <tr>
                    <td>Results communication</td>
                    <td>25%</td>
                    <td><span class="fill-in" style="min-width: 50px;"></span></td>
                    <td><span class="fill-in"></span></td>
                </tr>
            </table>
        </div>
        
        <div class="scale">
            <h3>Grading scale:</h3>
            <ul>
                <li><strong>Excellent (9-10):</strong> Exceeds expectations</li>
                <li><strong>Good (7-8):</strong> Meets expectations</li>
                <li><strong>Satisfactory (5-6):</strong> Partially meets</li>
                <li><strong>Unsatisfactory (1-4):</strong> Does not meet</li>
            </ul>
        </div>
    </div>

    <div class="evaluation-section">
        <h2>SELF-EVALUATION</h2>
        
        <h3>Personal reflection:</h3>
        <p><strong>1. What did I learn that was most important?</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        
        <p><strong>2. How will I apply this knowledge?</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        
        <p><strong>3. What skills do I want to develop more?</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        
        <p><strong>4. What is my next step?</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
    </div>

    <div class="evaluation-section">
        <h2>COURSE EVALUATION</h2>
        
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
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
            </tr>
            <tr>
                <td>Facilitator</td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
            </tr>
            <tr>
                <td>Materials</td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
                <td><span class="checkbox">□</span></td>
            </tr>
        </table>
        
        <h3>Recommendations:</h3>
        <ul style="list-style-type: none; padding-left: 0;">
            <li><span class="checkbox">□</span> Highly recommend</li>
            <li><span class="checkbox">□</span> Recommend</li>
            <li><span class="checkbox">□</span> Recommend with reservations</li>
            <li><span class="checkbox">□</span> Do not recommend</li>
        </ul>
        
        <p><strong>Improvement suggestions:</strong></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
        <p><span class="fill-in" style="min-width: 400px;"></span></p>
    </div>

    <div class="evaluation-section">
        <h2>CONTINUOUS DEVELOPMENT PLAN</h2>
        
        <h3>Short-term objectives (1-3 months):</h3>
        <p>1. <span class="fill-in"></span></p>
        <p>2. <span class="fill-in"></span></p>
        <p>3. <span class="fill-in"></span></p>
        
        <h3>Long-term objectives (6-12 months):</h3>
        <p>1. <span class="fill-in"></span></p>
        <p>2. <span class="fill-in"></span></p>
        <p>3. <span class="fill-in"></span></p>
        
        <h3>Development resources:</h3>
        <ul style="list-style-type: none; padding-left: 0;">
            <li><span class="checkbox">□</span> Additional books</li>
            <li><span class="checkbox">□</span> Advanced courses</li>
            <li><span class="checkbox">□</span> Mentoring</li>
            <li><span class="checkbox">□</span> Guided practice</li>
            <li><span class="checkbox">□</span> Communities of practice</li>
        </ul>
    </div>
</body>
</html>`;
  }
}

function generateResourcesHtml(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resurse Suplimentare</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .resource-section { background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .book-list { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .online-resources { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .development-plan { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .checklist { list-style-type: none; padding-left: 0; }
        .checklist li:before { content: "□ "; font-weight: bold; margin-right: 10px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        .contact-info { background: #e2e3e5; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <h1>RESURSE SUPLIMENTARE: ${subject}</h1>
    
    <div class="resource-section">
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
            <h3>Nivel intermediar:</h3>
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
    </div>

    <div class="resource-section">
        <h2>RESURSE ONLINE</h2>
        
        <div class="online-resources">
            <h3>Site-uri web utile:</h3>
            <ul>
                <li><strong>www.${subject.toLowerCase().replace(/\s+/g, '')}.org</strong> - Resurse oficiale</li>
                <li><strong>www.${context}academy.com</strong> - Cursuri online</li>
                <li><strong>www.expertsin${subject.toLowerCase().replace(/\s+/g, '')}.net</strong> - Comunitate de experți</li>
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
    </div>

    <div class="resource-section">
        <h2>CURSURI ȘI CERTIFICĂRI</h2>
        
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

    <div class="resource-section">
        <h2>COMUNITĂȚI ȘI NETWORKING</h2>
        
        <h3>Grupuri profesionale:</h3>
        <ul>
            <li><strong>Asociația ${subject} România</strong></li>
            <li><strong>Grupul LinkedIn "${subject} Professionals"</strong></li>
            <li><strong>Comunitatea Facebook "${subject} în ${context}"</strong></li>
        </ul>
        
        <h3>Evenimente și conferințe:</h3>
        <ul>
            <li>Conferința Anuală ${subject}</li>
            <li>Workshop-uri lunare ${subject}</li>
            <li>Meetup-uri locale ${subject}</li>
            <li>Webinare săptămânale</li>
        </ul>
    </div>

    <div class="resource-section">
        <h2>INSTRUMENTE ȘI SOFTWARE</h2>
        
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

    <div class="resource-section">
        <h2>TEMPLATE-URI ȘI MODELE</h2>
        
        <h3>Documente utile:</h3>
        <ul class="checklist">
            <li>Template plan de implementare ${subject}</li>
            <li>Checklist evaluare ${subject}</li>
            <li>Model raport progres ${subject}</li>
            <li>Ghid best practices ${subject}</li>
        </ul>
    </div>

    <div class="development-plan">
        <h2>DEZVOLTARE CONTINUĂ</h2>
        
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

    <div class="contact-info">
        <h2>CONTACTE UTILE</h2>
        
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

    <div class="resource-section">
        <h2>ACTUALIZĂRI ȘI TENDINȚE</h2>
        
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
    <title>Additional Resources</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .resource-section { background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .book-list { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .online-resources { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .development-plan { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .checklist { list-style-type: none; padding-left: 0; }
        .checklist li:before { content: "□ "; font-weight: bold; margin-right: 10px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        .contact-info { background: #e2e3e5; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <h1>ADDITIONAL RESOURCES: ${subject}</h1>
    
    <div class="resource-section">
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
            <h3>Intermediate level:</h3>
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
    </div>

    <div class="resource-section">
        <h2>ONLINE RESOURCES</h2>
        
        <div class="online-resources">
            <h3>Useful websites:</h3>
            <ul>
                <li><strong>www.${subject.toLowerCase().replace(/\s+/g, '')}.org</strong> - Official resources</li>
                <li><strong>www.${context}academy.com</strong> - Online courses</li>
                <li><strong>www.expertsin${subject.toLowerCase().replace(/\s+/g, '')}.net</strong> - Expert community</li>
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
    </div>

    <div class="resource-section">
        <h2>COURSES AND CERTIFICATIONS</h2>
        
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

    <div class="resource-section">
        <h2>COMMUNITIES AND NETWORKING</h2>
        
        <h3>Professional groups:</h3>
        <ul>
            <li><strong>${subject} Association</strong></li>
            <li><strong>LinkedIn Group "${subject} Professionals"</strong></li>
            <li><strong>Facebook Community "${subject} in ${context}"</strong></li>
        </ul>
        
        <h3>Events and conferences:</h3>
        <ul>
            <li>Annual ${subject} Conference</li>
            <li>Monthly ${subject} Workshops</li>
            <li>Local ${subject} Meetups</li>
            <li>Weekly webinars</li>
        </ul>
    </div>

    <div class="resource-section">
        <h2>TOOLS AND SOFTWARE</h2>
        
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

    <div class="resource-section">
        <h2>TEMPLATES AND MODELS</h2>
        
        <h3>Useful documents:</h3>
        <ul class="checklist">
            <li>${subject} implementation plan template</li>
            <li>${subject} evaluation checklist</li>
            <li>${subject} progress report model</li>
            <li>${subject} best practices guide</li>
        </ul>
    </div>

    <div class="development-plan">
        <h2>CONTINUOUS DEVELOPMENT</h2>
        
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

    <div class="contact-info">
        <h2>USEFUL CONTACTS</h2>
        
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

    <div class="resource-section">
        <h2>UPDATES AND TRENDS</h2>
        
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

// Helper function to create and upload DOCX file to Supabase Storage
async function createAndUploadDocx(
  supabase: any,
  htmlContent: string,
  fileName: string
): Promise<string | null> {
  try {
    console.log(`Creating DOCX file: ${fileName}`);
    
    // Convert HTML to DOCX using html-docx-js
    const docxBlob = asBlob(htmlContent);
    
    // Convert blob to Uint8Array for Supabase Storage
    const arrayBuffer = await docxBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Generate unique file path
    const timestamp = Date.now();
    const filePath = `materials/${timestamp}/${fileName}.docx`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-materials')
      .upload(filePath, uint8Array, {
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

// Helper function to create and upload PPTX file to Supabase Storage
async function createAndUploadPptx(
  supabase: any,
  slidesData: any[],
  fileName: string,
  metadata: any
): Promise<string | null> {
  try {
    console.log(`Creating PPTX file: ${fileName}`);
    
    // Create new presentation
    const pptx = new PptxGenJS();
    
    // Set presentation properties
    pptx.author = 'Automator.ro';
    pptx.company = 'Automator.ro';
    pptx.title = metadata.subject || 'Course Presentation';
    pptx.subject = metadata.subject || 'Generated Course';
    
    // Add slides
    slidesData.forEach((slideData, index) => {
      const slide = pptx.addSlide();
      
      // Add title
      slide.addText(slideData.title, {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 1,
        fontSize: 32,
        bold: true,
        color: '363636',
        align: 'center'
      });
      
      // Add content
      if (slideData.content && slideData.content.length > 0) {
        slideData.content.forEach((item: any, itemIndex: number) => {
          slide.addText(item.text, {
            x: 0.5,
            y: 1.8 + (itemIndex * 0.6),
            w: 9,
            h: 0.5,
            fontSize: item.options?.fontSize || 18,
            bold: item.options?.bold || false,
            color: item.options?.color || '000000',
            align: 'left'
          });
        });
      }
      
      // Add slide number
      slide.addText(`${index + 1}`, {
        x: 9.5,
        y: 7,
        w: 0.5,
        h: 0.3,
        fontSize: 12,
        color: '666666',
        align: 'center'
      });
    });
    
    // Generate PPTX as ArrayBuffer
    const pptxArrayBuffer = await pptx.write({ outputType: 'arraybuffer' });
    const uint8Array = new Uint8Array(pptxArrayBuffer);
    
    // Generate unique file path
    const timestamp = Date.now();
    const filePath = `materials/${timestamp}/${fileName}.pptx`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-materials')
      .upload(filePath, uint8Array, {
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        upsert: false
      });

    if (error) {
      console.error('Error uploading PPTX file:', error);
      return null;
    }

    console.log('PPTX file uploaded successfully:', filePath);
    return filePath;
  } catch (error) {
    console.error('Error creating/uploading PPTX file:', error);
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

    // Define the 7 materials to generate with proper formats
    const materialsToGenerate = [
      { type: 'foundation', name: 'Structura si Obiectivele Cursului', format: 'docx', stepNumber: 1, isDocx: true },
      { type: 'slides', name: 'Slide-uri de Prezentare', format: 'pptx', stepNumber: 2, isDocx: false },
      { type: 'facilitator', name: 'Manual Facilitator', format: 'docx', stepNumber: 3, isDocx: true },
      { type: 'participant', name: 'Manual Participant', format: 'docx', stepNumber: 4, isDocx: true },
      { type: 'activities', name: 'Activitati si Exercitii', format: 'docx', stepNumber: 5, isDocx: true },
      { type: 'evaluation', name: 'Instrumente de Evaluare', format: 'docx', stepNumber: 6, isDocx: true },
      { type: 'resources', name: 'Resurse Suplimentare', format: 'docx', stepNumber: 7, isDocx: true },
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

      let storagePath: string | null = null;
      let content = '';

      if (material.isDocx) {
        // Generate HTML content and convert to DOCX
        const htmlContent = generateHtmlContent(material.type, metadata);
        content = htmlContent;
        storagePath = await createAndUploadDocx(supabase, htmlContent, material.name);
      } else {
        // Generate PPTX slides
        const slidesData = generatePptxSlides(metadata);
        content = JSON.stringify(slidesData); // Store slides data as JSON for reference
        storagePath = await createAndUploadPptx(supabase, slidesData, material.name, metadata);
      }

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
          content: content,
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