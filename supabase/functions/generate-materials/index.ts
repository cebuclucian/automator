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

// Helper function to generate structured content for DOCX
function generateStructuredContent(type: string, metadata: any): any[] {
  const { subject, language, level, audience, duration, tone, context } = metadata;
  
  const isRomanian = language === 'ro';
  
  switch (type) {
    case 'foundation':
      return generateFoundationStructure(subject, level, audience, duration, tone, context, isRomanian);
    case 'slides':
      return generateSlidesStructure(subject, level, audience, duration, tone, context, isRomanian);
    case 'facilitator':
      return generateFacilitatorStructure(subject, level, audience, duration, tone, context, isRomanian);
    case 'participant':
      return generateParticipantStructure(subject, level, audience, duration, tone, context, isRomanian);
    case 'activities':
      return generateActivitiesStructure(subject, level, audience, duration, tone, context, isRomanian);
    case 'evaluation':
      return generateEvaluationStructure(subject, level, audience, duration, tone, context, isRomanian);
    case 'resources':
      return generateResourcesStructure(subject, level, audience, duration, tone, context, isRomanian);
    default:
      return [{ type: 'paragraph', text: 'Content not available' }];
  }
}

function generateFoundationStructure(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): any[] {
  if (isRomanian) {
    return [
      { type: 'heading1', text: `STRUCTURA ȘI OBIECTIVELE CURSULUI: ${subject}` },
      { type: 'heading2', text: 'INFORMAȚII GENERALE' },
      { type: 'bullet', text: `Subiect: ${subject}` },
      { type: 'bullet', text: `Nivel: ${level}` },
      { type: 'bullet', text: `Public țintă: ${audience}` },
      { type: 'bullet', text: `Durată: ${duration}` },
      { type: 'bullet', text: `Context: ${context}` },
      { type: 'bullet', text: `Ton: ${tone}` },
      { type: 'heading2', text: 'OBIECTIVE DE ÎNVĂȚARE' },
      { type: 'paragraph', text: 'La sfârșitul acestui curs, participanții vor fi capabili să:' },
      { type: 'bullet', text: `Înțeleagă conceptele fundamentale ale ${subject}` },
      { type: 'bullet', text: 'Aplice principiile de bază în situații practice' },
      { type: 'bullet', text: 'Analizeze și rezolve probleme specifice domeniului' },
      { type: 'bullet', text: 'Dezvolte competențe practice relevante' },
      { type: 'bullet', text: 'Evalueze și îmbunătățească performanța proprie' },
      { type: 'heading2', text: 'AGENDA DETALIATĂ' },
      { type: 'bullet', text: 'Introducere și prezentări (15 minute)' },
      { type: 'bullet', text: 'Concepte fundamentale (30% din timp)' },
      { type: 'bullet', text: 'Aplicații practice (40% din timp)' },
      { type: 'bullet', text: 'Exerciții și activități (20% din timp)' },
      { type: 'bullet', text: 'Evaluare și feedback (10% din timp)' },
      { type: 'heading2', text: 'METODOLOGIE' },
      { type: 'bullet', text: 'Prezentări interactive' },
      { type: 'bullet', text: 'Studii de caz' },
      { type: 'bullet', text: 'Exerciții practice' },
      { type: 'bullet', text: 'Discuții în grup' },
      { type: 'bullet', text: 'Evaluare continuă' },
    ];
  } else {
    return [
      { type: 'heading1', text: `COURSE STRUCTURE AND OBJECTIVES: ${subject}` },
      { type: 'heading2', text: 'GENERAL INFORMATION' },
      { type: 'bullet', text: `Subject: ${subject}` },
      { type: 'bullet', text: `Level: ${level}` },
      { type: 'bullet', text: `Target Audience: ${audience}` },
      { type: 'bullet', text: `Duration: ${duration}` },
      { type: 'bullet', text: `Context: ${context}` },
      { type: 'bullet', text: `Tone: ${tone}` },
      { type: 'heading2', text: 'LEARNING OBJECTIVES' },
      { type: 'paragraph', text: 'By the end of this course, participants will be able to:' },
      { type: 'bullet', text: `Understand fundamental concepts of ${subject}` },
      { type: 'bullet', text: 'Apply basic principles in practical situations' },
      { type: 'bullet', text: 'Analyze and solve domain-specific problems' },
      { type: 'bullet', text: 'Develop relevant practical skills' },
      { type: 'bullet', text: 'Evaluate and improve their own performance' },
      { type: 'heading2', text: 'DETAILED AGENDA' },
      { type: 'bullet', text: 'Introduction and presentations (15 minutes)' },
      { type: 'bullet', text: 'Fundamental concepts (30% of time)' },
      { type: 'bullet', text: 'Practical applications (40% of time)' },
      { type: 'bullet', text: 'Exercises and activities (20% of time)' },
      { type: 'bullet', text: 'Evaluation and feedback (10% of time)' },
      { type: 'heading2', text: 'METHODOLOGY' },
      { type: 'bullet', text: 'Interactive presentations' },
      { type: 'bullet', text: 'Case studies' },
      { type: 'bullet', text: 'Practical exercises' },
      { type: 'bullet', text: 'Group discussions' },
      { type: 'bullet', text: 'Continuous evaluation' },
    ];
  }
}

function generateSlidesStructure(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): any[] {
  if (isRomanian) {
    return [
      { type: 'heading1', text: `SLIDE-URI DE PREZENTARE: ${subject}` },
      { type: 'heading2', text: 'SLIDE 1: TITLU' },
      { type: 'paragraph', text: subject },
      { type: 'paragraph', text: `Curs pentru ${audience}` },
      { type: 'paragraph', text: `Nivel: ${level}` },
      { type: 'heading2', text: 'SLIDE 2: OBIECTIVE' },
      { type: 'paragraph', text: 'Obiectivele cursului:' },
      { type: 'bullet', text: 'Înțelegerea conceptelor de bază' },
      { type: 'bullet', text: 'Aplicarea practică a cunoștințelor' },
      { type: 'bullet', text: 'Dezvoltarea competențelor specifice' },
      { type: 'bullet', text: 'Evaluarea progresului personal' },
      { type: 'heading2', text: 'SLIDE 3: AGENDA' },
      { type: 'bullet', text: 'Introducere (15 min)' },
      { type: 'bullet', text: 'Concepte fundamentale (45 min)' },
      { type: 'bullet', text: 'Pauză (15 min)' },
      { type: 'bullet', text: 'Aplicații practice (60 min)' },
      { type: 'bullet', text: 'Exerciții (30 min)' },
      { type: 'bullet', text: 'Evaluare și închidere (15 min)' },
      { type: 'heading2', text: 'NOTE PENTRU PREZENTATOR' },
      { type: 'bullet', text: 'Mențineți un ritm dinamic' },
      { type: 'bullet', text: 'Încurajați participarea activă' },
      { type: 'bullet', text: 'Folosiți exemple concrete' },
      { type: 'bullet', text: 'Adaptați conținutul la audiență' },
    ];
  } else {
    return [
      { type: 'heading1', text: `PRESENTATION SLIDES: ${subject}` },
      { type: 'heading2', text: 'SLIDE 1: TITLE' },
      { type: 'paragraph', text: subject },
      { type: 'paragraph', text: `Course for ${audience}` },
      { type: 'paragraph', text: `Level: ${level}` },
      { type: 'heading2', text: 'SLIDE 2: OBJECTIVES' },
      { type: 'paragraph', text: 'Course objectives:' },
      { type: 'bullet', text: 'Understanding basic concepts' },
      { type: 'bullet', text: 'Practical application of knowledge' },
      { type: 'bullet', text: 'Development of specific skills' },
      { type: 'bullet', text: 'Personal progress evaluation' },
      { type: 'heading2', text: 'SLIDE 3: AGENDA' },
      { type: 'bullet', text: 'Introduction (15 min)' },
      { type: 'bullet', text: 'Fundamental concepts (45 min)' },
      { type: 'bullet', text: 'Break (15 min)' },
      { type: 'bullet', text: 'Practical applications (60 min)' },
      { type: 'bullet', text: 'Exercises (30 min)' },
      { type: 'bullet', text: 'Evaluation and closing (15 min)' },
      { type: 'heading2', text: 'PRESENTER NOTES' },
      { type: 'bullet', text: 'Maintain a dynamic pace' },
      { type: 'bullet', text: 'Encourage active participation' },
      { type: 'bullet', text: 'Use concrete examples' },
      { type: 'bullet', text: 'Adapt content to audience' },
    ];
  }
}

function generateFacilitatorStructure(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): any[] {
  if (isRomanian) {
    return [
      { type: 'heading1', text: `MANUAL FACILITATOR: ${subject}` },
      { type: 'heading2', text: 'PREGĂTIREA CURSULUI' },
      { type: 'paragraph', text: 'Înainte de curs:' },
      { type: 'bullet', text: 'Verificați echipamentele tehnice' },
      { type: 'bullet', text: 'Pregătiți materialele pentru participanți' },
      { type: 'bullet', text: 'Testați prezentarea' },
      { type: 'bullet', text: 'Pregătiți activitățile interactive' },
      { type: 'bullet', text: 'Planificați pauzele' },
      { type: 'heading2', text: 'GHID DE FACILITARE' },
      { type: 'paragraph', text: 'Introducerea (15 minute):' },
      { type: 'bullet', text: 'Salutați participanții' },
      { type: 'bullet', text: 'Prezentați-vă pe scurt' },
      { type: 'bullet', text: 'Explicați obiectivele cursului' },
      { type: 'bullet', text: 'Stabiliți regulile de bază' },
      { type: 'bullet', text: 'Creați o atmosferă relaxată' },
      { type: 'heading2', text: 'MANAGEMENTUL GRUPULUI' },
      { type: 'paragraph', text: 'Tehnici de facilitare:' },
      { type: 'bullet', text: 'Ascultare activă' },
      { type: 'bullet', text: 'Întrebări deschise' },
      { type: 'bullet', text: 'Reformularea ideilor' },
      { type: 'bullet', text: 'Gestionarea conflictelor' },
      { type: 'bullet', text: 'Încurajarea participării' },
    ];
  } else {
    return [
      { type: 'heading1', text: `FACILITATOR MANUAL: ${subject}` },
      { type: 'heading2', text: 'COURSE PREPARATION' },
      { type: 'paragraph', text: 'Before the course:' },
      { type: 'bullet', text: 'Check technical equipment' },
      { type: 'bullet', text: 'Prepare participant materials' },
      { type: 'bullet', text: 'Test the presentation' },
      { type: 'bullet', text: 'Prepare interactive activities' },
      { type: 'bullet', text: 'Plan breaks' },
      { type: 'heading2', text: 'FACILITATION GUIDE' },
      { type: 'paragraph', text: 'Introduction (15 minutes):' },
      { type: 'bullet', text: 'Greet participants' },
      { type: 'bullet', text: 'Introduce yourself briefly' },
      { type: 'bullet', text: 'Explain course objectives' },
      { type: 'bullet', text: 'Establish ground rules' },
      { type: 'bullet', text: 'Create a relaxed atmosphere' },
      { type: 'heading2', text: 'GROUP MANAGEMENT' },
      { type: 'paragraph', text: 'Facilitation techniques:' },
      { type: 'bullet', text: 'Active listening' },
      { type: 'bullet', text: 'Open questions' },
      { type: 'bullet', text: 'Idea reformulation' },
      { type: 'bullet', text: 'Conflict management' },
      { type: 'bullet', text: 'Encouraging participation' },
    ];
  }
}

function generateParticipantStructure(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): any[] {
  if (isRomanian) {
    return [
      { type: 'heading1', text: `MANUAL PARTICIPANT: ${subject}` },
      { type: 'heading2', text: 'BINE ATI VENIT!' },
      { type: 'paragraph', text: `Acest manual vă va ghida prin cursul de ${subject}. Vă rugăm să îl folosiți pentru a lua notițe și a urmări progresul dvs.` },
      { type: 'heading2', text: 'OBIECTIVELE CURSULUI' },
      { type: 'paragraph', text: 'La sfârșitul acestui curs veți fi capabili să:' },
      { type: 'bullet', text: 'Înțelegeți conceptele fundamentale' },
      { type: 'bullet', text: 'Aplicați cunoștințele în practică' },
      { type: 'bullet', text: 'Rezolvați probleme specifice' },
      { type: 'bullet', text: 'Evaluați propriul progres' },
      { type: 'heading2', text: 'SECȚIUNEA 1: CONCEPTE FUNDAMENTALE' },
      { type: 'paragraph', text: 'Definiții importante:' },
      { type: 'paragraph', text: '_________________________________' },
      { type: 'paragraph', text: '_________________________________' },
      { type: 'paragraph', text: 'Principii de bază:' },
      { type: 'paragraph', text: '1. _____________________________' },
      { type: 'paragraph', text: '2. _____________________________' },
      { type: 'paragraph', text: '3. _____________________________' },
      { type: 'heading2', text: 'PLANUL MEU DE ACȚIUNE' },
      { type: 'paragraph', text: 'Ce voi aplica imediat:' },
      { type: 'paragraph', text: '1. _____________________________' },
      { type: 'paragraph', text: '2. _____________________________' },
      { type: 'paragraph', text: '3. _____________________________' },
    ];
  } else {
    return [
      { type: 'heading1', text: `PARTICIPANT MANUAL: ${subject}` },
      { type: 'heading2', text: 'WELCOME!' },
      { type: 'paragraph', text: `This manual will guide you through the ${subject} course. Please use it to take notes and track your progress.` },
      { type: 'heading2', text: 'COURSE OBJECTIVES' },
      { type: 'paragraph', text: 'By the end of this course you will be able to:' },
      { type: 'bullet', text: 'Understand fundamental concepts' },
      { type: 'bullet', text: 'Apply knowledge in practice' },
      { type: 'bullet', text: 'Solve specific problems' },
      { type: 'bullet', text: 'Evaluate your own progress' },
      { type: 'heading2', text: 'SECTION 1: FUNDAMENTAL CONCEPTS' },
      { type: 'paragraph', text: 'Important definitions:' },
      { type: 'paragraph', text: '_________________________________' },
      { type: 'paragraph', text: '_________________________________' },
      { type: 'paragraph', text: 'Basic principles:' },
      { type: 'paragraph', text: '1. _____________________________' },
      { type: 'paragraph', text: '2. _____________________________' },
      { type: 'paragraph', text: '3. _____________________________' },
      { type: 'heading2', text: 'MY ACTION PLAN' },
      { type: 'paragraph', text: 'What I will apply immediately:' },
      { type: 'paragraph', text: '1. _____________________________' },
      { type: 'paragraph', text: '2. _____________________________' },
      { type: 'paragraph', text: '3. _____________________________' },
    ];
  }
}

function generateActivitiesStructure(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): any[] {
  if (isRomanian) {
    return [
      { type: 'heading1', text: `ACTIVITĂȚI ȘI EXERCIȚII: ${subject}` },
      { type: 'heading2', text: 'ACTIVITATEA 1: BRAINSTORMING' },
      { type: 'paragraph', text: 'Timp: 15 minute' },
      { type: 'paragraph', text: 'Participanți: Toți' },
      { type: 'paragraph', text: 'Obiectiv: Generarea de idei creative' },
      { type: 'paragraph', text: 'Instrucțiuni:' },
      { type: 'bullet', text: 'Formați grupuri de 4-5 persoane' },
      { type: 'bullet', text: 'Alegeți un moderator pentru fiecare grup' },
      { type: 'bullet', text: 'Generați cât mai multe idei în 10 minute' },
      { type: 'bullet', text: 'Prezentați cele mai bune 3 idei (5 minute)' },
      { type: 'paragraph', text: `Întrebarea: "Cum putem aplica ${subject} în activitatea noastră zilnică?"` },
      { type: 'heading2', text: 'ACTIVITATEA 2: STUDIU DE CAZ' },
      { type: 'paragraph', text: 'Timp: 30 minute' },
      { type: 'paragraph', text: 'Participanți: Grupuri de 3-4 persoane' },
      { type: 'paragraph', text: 'Obiectiv: Aplicarea practică a conceptelor' },
      { type: 'paragraph', text: 'Sarcini:' },
      { type: 'bullet', text: 'Analizați situația (10 minute)' },
      { type: 'bullet', text: 'Propuneți soluții (15 minute)' },
      { type: 'bullet', text: 'Prezentați soluția (5 minute)' },
      { type: 'heading2', text: 'MATERIALE NECESARE' },
      { type: 'bullet', text: 'Flipchart și markere' },
      { type: 'bullet', text: 'Post-it-uri colorate' },
      { type: 'bullet', text: 'Cronometru' },
      { type: 'bullet', text: 'Fișe de evaluare' },
    ];
  } else {
    return [
      { type: 'heading1', text: `ACTIVITIES AND EXERCISES: ${subject}` },
      { type: 'heading2', text: 'ACTIVITY 1: BRAINSTORMING' },
      { type: 'paragraph', text: 'Time: 15 minutes' },
      { type: 'paragraph', text: 'Participants: Everyone' },
      { type: 'paragraph', text: 'Objective: Generate creative ideas' },
      { type: 'paragraph', text: 'Instructions:' },
      { type: 'bullet', text: 'Form groups of 4-5 people' },
      { type: 'bullet', text: 'Choose a moderator for each group' },
      { type: 'bullet', text: 'Generate as many ideas as possible in 10 minutes' },
      { type: 'bullet', text: 'Present the best 3 ideas (5 minutes)' },
      { type: 'paragraph', text: `Question: "How can we apply ${subject} in our daily activities?"` },
      { type: 'heading2', text: 'ACTIVITY 2: CASE STUDY' },
      { type: 'paragraph', text: 'Time: 30 minutes' },
      { type: 'paragraph', text: 'Participants: Groups of 3-4 people' },
      { type: 'paragraph', text: 'Objective: Practical application of concepts' },
      { type: 'paragraph', text: 'Tasks:' },
      { type: 'bullet', text: 'Analyze the situation (10 minutes)' },
      { type: 'bullet', text: 'Propose solutions (15 minutes)' },
      { type: 'bullet', text: 'Present the solution (5 minutes)' },
      { type: 'heading2', text: 'REQUIRED MATERIALS' },
      { type: 'bullet', text: 'Flipchart and markers' },
      { type: 'bullet', text: 'Colored post-it notes' },
      { type: 'bullet', text: 'Timer' },
      { type: 'bullet', text: 'Evaluation sheets' },
    ];
  }
}

function generateEvaluationStructure(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): any[] {
  if (isRomanian) {
    return [
      { type: 'heading1', text: `INSTRUMENTE DE EVALUARE: ${subject}` },
      { type: 'heading2', text: 'EVALUARE INIȚIALĂ (PRE-CURS)' },
      { type: 'paragraph', text: 'Întrebări de evaluare a cunoștințelor:' },
      { type: 'bullet', text: `Cât de familiar sunteți cu ${subject}? (1-10)` },
      { type: 'bullet', text: 'Ce experiență aveți în domeniu?' },
      { type: 'bullet', text: 'Care sunt așteptările dvs. de la acest curs?' },
      { type: 'bullet', text: 'Ce provocări întâmpinați în prezent?' },
      { type: 'bullet', text: 'Cum măsurați succesul în acest domeniu?' },
      { type: 'heading2', text: 'EVALUARE FINALĂ (POST-CURS)' },
      { type: 'paragraph', text: 'Test de cunoștințe:' },
      { type: 'paragraph', text: `1. Definiți conceptul principal al ${subject}:` },
      { type: 'paragraph', text: '_________________________________' },
      { type: 'paragraph', text: '2. Enumerați 3 beneficii ale aplicării acestor principii:' },
      { type: 'paragraph', text: 'a) ____________________________' },
      { type: 'paragraph', text: 'b) ____________________________' },
      { type: 'paragraph', text: 'c) ____________________________' },
      { type: 'heading2', text: 'AUTO-EVALUAREA' },
      { type: 'paragraph', text: 'Reflecție personală:' },
      { type: 'paragraph', text: '1. Ce am învățat cel mai important?' },
      { type: 'paragraph', text: '_________________________________' },
      { type: 'paragraph', text: '2. Cum voi aplica aceste cunoștințe?' },
      { type: 'paragraph', text: '_________________________________' },
    ];
  } else {
    return [
      { type: 'heading1', text: `EVALUATION TOOLS: ${subject}` },
      { type: 'heading2', text: 'INITIAL EVALUATION (PRE-COURSE)' },
      { type: 'paragraph', text: 'Knowledge assessment questions:' },
      { type: 'bullet', text: `How familiar are you with ${subject}? (1-10)` },
      { type: 'bullet', text: 'What experience do you have in the field?' },
      { type: 'bullet', text: 'What are your expectations from this course?' },
      { type: 'bullet', text: 'What challenges are you currently facing?' },
      { type: 'bullet', text: 'How do you measure success in this domain?' },
      { type: 'heading2', text: 'FINAL EVALUATION (POST-COURSE)' },
      { type: 'paragraph', text: 'Knowledge test:' },
      { type: 'paragraph', text: `1. Define the main concept of ${subject}:` },
      { type: 'paragraph', text: '_________________________________' },
      { type: 'paragraph', text: '2. List 3 benefits of applying these principles:' },
      { type: 'paragraph', text: 'a) ____________________________' },
      { type: 'paragraph', text: 'b) ____________________________' },
      { type: 'paragraph', text: 'c) ____________________________' },
      { type: 'heading2', text: 'SELF-EVALUATION' },
      { type: 'paragraph', text: 'Personal reflection:' },
      { type: 'paragraph', text: '1. What did I learn that was most important?' },
      { type: 'paragraph', text: '_________________________________' },
      { type: 'paragraph', text: '2. How will I apply this knowledge?' },
      { type: 'paragraph', text: '_________________________________' },
    ];
  }
}

function generateResourcesStructure(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): any[] {
  if (isRomanian) {
    return [
      { type: 'heading1', text: `RESURSE SUPLIMENTARE: ${subject}` },
      { type: 'heading2', text: 'CĂRȚI RECOMANDATE' },
      { type: 'paragraph', text: 'Nivel începător:' },
      { type: 'bullet', text: `"Introducere în ${subject}" - Autor Principal` },
      { type: 'bullet', text: 'Concepte de bază explicate simplu' },
      { type: 'bullet', text: 'Exemple practice din viața reală' },
      { type: 'bullet', text: 'Exerciții pas cu pas' },
      { type: 'paragraph', text: 'Nivel intermediar:' },
      { type: 'bullet', text: `"${subject} avansat" - Specialist în domeniu` },
      { type: 'bullet', text: 'Tehnici sofisticate' },
      { type: 'bullet', text: 'Analize aprofundate' },
      { type: 'bullet', text: 'Strategii complexe' },
      { type: 'heading2', text: 'RESURSE ONLINE' },
      { type: 'paragraph', text: 'Site-uri web utile:' },
      { type: 'bullet', text: `www.${subject.toLowerCase().replace(/\s+/g, '')}.org - Resurse oficiale` },
      { type: 'bullet', text: `www.${context}academy.com - Cursuri online` },
      { type: 'bullet', text: `www.expertsin${subject.toLowerCase().replace(/\s+/g, '')}.net - Comunitate de experți` },
      { type: 'heading2', text: 'DEZVOLTARE CONTINUĂ' },
      { type: 'paragraph', text: 'Plan de învățare pe 6 luni:' },
      { type: 'paragraph', text: 'Luna 1-2: Consolidarea fundamentelor' },
      { type: 'bullet', text: 'Recitirea materialelor cursului' },
      { type: 'bullet', text: 'Aplicarea în proiecte mici' },
      { type: 'bullet', text: 'Participarea la webinare' },
      { type: 'paragraph', text: 'Luna 3-4: Aprofundarea cunoștințelor' },
      { type: 'bullet', text: 'Citirea unei cărți avansate' },
      { type: 'bullet', text: 'Participarea la workshop-uri' },
      { type: 'bullet', text: 'Networking cu experți' },
    ];
  } else {
    return [
      { type: 'heading1', text: `ADDITIONAL RESOURCES: ${subject}` },
      { type: 'heading2', text: 'RECOMMENDED BOOKS' },
      { type: 'paragraph', text: 'Beginner level:' },
      { type: 'bullet', text: `"Introduction to ${subject}" - Main Author` },
      { type: 'bullet', text: 'Basic concepts explained simply' },
      { type: 'bullet', text: 'Real-life practical examples' },
      { type: 'bullet', text: 'Step-by-step exercises' },
      { type: 'paragraph', text: 'Intermediate level:' },
      { type: 'bullet', text: `"Advanced ${subject}" - Domain Specialist` },
      { type: 'bullet', text: 'Sophisticated techniques' },
      { type: 'bullet', text: 'In-depth analyses' },
      { type: 'bullet', text: 'Complex strategies' },
      { type: 'heading2', text: 'ONLINE RESOURCES' },
      { type: 'paragraph', text: 'Useful websites:' },
      { type: 'bullet', text: `www.${subject.toLowerCase().replace(/\s+/g, '')}.org - Official resources` },
      { type: 'bullet', text: `www.${context}academy.com - Online courses` },
      { type: 'bullet', text: `www.expertsin${subject.toLowerCase().replace(/\s+/g, '')}.net - Expert community` },
      { type: 'heading2', text: 'CONTINUOUS DEVELOPMENT' },
      { type: 'paragraph', text: '6-month learning plan:' },
      { type: 'paragraph', text: 'Month 1-2: Foundation consolidation' },
      { type: 'bullet', text: 'Re-reading course materials' },
      { type: 'bullet', text: 'Application in small projects' },
      { type: 'bullet', text: 'Webinar participation' },
      { type: 'paragraph', text: 'Month 3-4: Knowledge deepening' },
      { type: 'bullet', text: 'Reading an advanced book' },
      { type: 'bullet', text: 'Workshop participation' },
      { type: 'bullet', text: 'Expert networking' },
    ];
  }
}

// Helper function to convert structured content to DOCX
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
    // Create DOCX document
    const doc = createDocxFromStructure(structure);
    
    // Generate binary buffer
    const buffer = await Packer.toBuffer(doc);
    
    // Generate unique file path
    const timestamp = Date.now();
    const filePath = `materials/${timestamp}/${fileName}.docx`;
    
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

// Helper function to create and upload text file for PPTX (placeholder)
async function createAndUploadFile(
  supabase: any,
  content: string,
  fileName: string,
  format: string
): Promise<string | null> {
  try {
    // For PPTX, create a simple text file as placeholder
    // In a real implementation, you'd use a PPTX library
    const fileContent = new TextEncoder().encode(content);
    
    // Generate unique file path
    const timestamp = Date.now();
    const filePath = `materials/${timestamp}/${fileName}.${format}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-materials')
      .upload(filePath, fileContent, {
        contentType: format === 'pptx' ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' : 'text/plain',
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

// Helper function to generate simple text content for non-DOCX files
function generateSimpleContent(type: string, metadata: any): string {
  const { subject, language, level, audience, duration, tone, context } = metadata;
  
  const isRomanian = language === 'ro';
  
  switch (type) {
    case 'slides':
      if (isRomanian) {
        return `SLIDE-URI DE PREZENTARE: ${subject}

SLIDE 1: TITLU
${subject}
Curs pentru ${audience}
Nivel: ${level}

SLIDE 2: OBIECTIVE
Obiectivele cursului:
• Înțelegerea conceptelor de bază
• Aplicarea practică a cunoștințelor
• Dezvoltarea competențelor specifice
• Evaluarea progresului personal

SLIDE 3: AGENDA
1. Introducere (15 min)
2. Concepte fundamentale (45 min)
3. Pauză (15 min)
4. Aplicații practice (60 min)
5. Exerciții (30 min)
6. Evaluare și închidere (15 min)

NOTE PENTRU PREZENTATOR:
- Mențineți un ritm dinamic
- Încurajați participarea activă
- Folosiți exemple concrete
- Adaptați conținutul la audiență`;
      } else {
        return `PRESENTATION SLIDES: ${subject}

SLIDE 1: TITLE
${subject}
Course for ${audience}
Level: ${level}

SLIDE 2: OBJECTIVES
Course objectives:
• Understanding basic concepts
• Practical application of knowledge
• Development of specific skills
• Personal progress evaluation

SLIDE 3: AGENDA
1. Introduction (15 min)
2. Fundamental concepts (45 min)
3. Break (15 min)
4. Practical applications (60 min)
5. Exercises (30 min)
6. Evaluation and closing (15 min)

PRESENTER NOTES:
- Maintain a dynamic pace
- Encourage active participation
- Use concrete examples
- Adapt content to audience`;
      }
    default:
      return 'Content not available';
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

    // Define the 7 materials to generate
    const materialsToGenerate = [
      { type: 'foundation', name: 'Structura si Obiectivele Cursului', format: 'docx', stepNumber: 1 },
      { type: 'slides', name: 'Slide-uri de Prezentare', format: 'pptx', stepNumber: 2 },
      { type: 'facilitator', name: 'Manual Facilitator', format: 'docx', stepNumber: 3 },
      { type: 'participant', name: 'Manual Participant', format: 'docx', stepNumber: 4 },
      { type: 'activities', name: 'Activitati si Exercitii', format: 'docx', stepNumber: 5 },
      { type: 'evaluation', name: 'Instrumente de Evaluare', format: 'docx', stepNumber: 6 },
      { type: 'resources', name: 'Resurse Suplimentare', format: 'docx', stepNumber: 7 },
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

      if (material.format === 'docx') {
        // Generate structured content for DOCX
        const structure = generateStructuredContent(material.type, metadata);
        content = structure.map(item => `${item.type}: ${item.text}`).join('\n');
        
        // Create and upload DOCX file
        storagePath = await createAndUploadDocx(
          supabase,
          structure,
          material.name
        );
      } else {
        // For PPTX, generate simple text content (placeholder)
        content = generateSimpleContent(material.type, metadata);
        
        // Create and upload file
        storagePath = await createAndUploadFile(
          supabase,
          content,
          material.name,
          material.format
        );
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