import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import PptxGenJS from 'npm:pptxgenjs@3.12.0';
import htmlDocx from 'npm:html-docx-js@0.6.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  console.log(`Updating job progress: ${jobId} - ${progress}% - ${status} - ${statusMessage}`);
  
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
    throw new Error(`Failed to update job progress: ${error.message}`);
  }
}

// Generate HTML content for DOCX files
function generateFoundationHtml(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  const title = isRomanian ? `STRUCTURA ȘI OBIECTIVELE CURSULUI: ${subject}` : `COURSE STRUCTURE AND OBJECTIVES: ${subject}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .info-box { background: #ecf0f1; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; }
        .objectives { background: #e8f5e8; padding: 15px; border-radius: 5px; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
        .section { margin: 25px 0; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <div class="info-box">
        <h2>${isRomanian ? 'INFORMAȚII GENERALE' : 'GENERAL INFORMATION'}</h2>
        <ul>
            <li><strong>${isRomanian ? 'Subiect' : 'Subject'}:</strong> ${subject}</li>
            <li><strong>${isRomanian ? 'Nivel' : 'Level'}:</strong> ${level}</li>
            <li><strong>${isRomanian ? 'Public țintă' : 'Target Audience'}:</strong> ${audience}</li>
            <li><strong>${isRomanian ? 'Durată' : 'Duration'}:</strong> ${duration}</li>
            <li><strong>${isRomanian ? 'Context' : 'Context'}:</strong> ${context}</li>
            <li><strong>${isRomanian ? 'Ton' : 'Tone'}:</strong> ${tone}</li>
        </ul>
    </div>

    <div class="objectives">
        <h2>${isRomanian ? 'OBIECTIVE DE ÎNVĂȚARE' : 'LEARNING OBJECTIVES'}</h2>
        <p>${isRomanian ? 'La sfârșitul acestui curs, participanții vor fi capabili să:' : 'By the end of this course, participants will be able to:'}</p>
        <ul>
            <li>${isRomanian ? `Înțeleagă conceptele fundamentale ale ${subject}` : `Understand fundamental concepts of ${subject}`}</li>
            <li>${isRomanian ? 'Aplice principiile de bază în situații practice' : 'Apply basic principles in practical situations'}</li>
            <li>${isRomanian ? 'Analizeze și rezolve probleme specifice domeniului' : 'Analyze and solve domain-specific problems'}</li>
            <li>${isRomanian ? 'Dezvolte competențe practice relevante' : 'Develop relevant practical skills'}</li>
            <li>${isRomanian ? 'Evalueze și îmbunătățească performanța proprie' : 'Evaluate and improve their own performance'}</li>
        </ul>
    </div>

    <div class="section">
        <h2>${isRomanian ? 'AGENDA DETALIATĂ' : 'DETAILED AGENDA'}</h2>
        <ul>
            <li>${isRomanian ? 'Introducere și prezentări (15 minute)' : 'Introduction and presentations (15 minutes)'}</li>
            <li>${isRomanian ? 'Concepte fundamentale (30% din timp)' : 'Fundamental concepts (30% of time)'}</li>
            <li>${isRomanian ? 'Aplicații practice (40% din timp)' : 'Practical applications (40% of time)'}</li>
            <li>${isRomanian ? 'Exerciții și activități (20% din timp)' : 'Exercises and activities (20% of time)'}</li>
            <li>${isRomanian ? 'Evaluare și feedback (10% din timp)' : 'Evaluation and feedback (10% of time)'}</li>
        </ul>
    </div>

    <div class="section">
        <h2>${isRomanian ? 'METODOLOGIE' : 'METHODOLOGY'}</h2>
        <ul>
            <li>${isRomanian ? 'Prezentări interactive' : 'Interactive presentations'}</li>
            <li>${isRomanian ? 'Studii de caz' : 'Case studies'}</li>
            <li>${isRomanian ? 'Exerciții practice' : 'Practical exercises'}</li>
            <li>${isRomanian ? 'Discuții în grup' : 'Group discussions'}</li>
            <li>${isRomanian ? 'Evaluare continuă' : 'Continuous evaluation'}</li>
        </ul>
    </div>
</body>
</html>`;
}

function generateFacilitatorHtml(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  const title = isRomanian ? `MANUAL FACILITATOR: ${subject}` : `FACILITATOR MANUAL: ${subject}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #e74c3c; padding-bottom: 10px; }
        h2 { color: #c0392b; margin-top: 30px; }
        .checklist { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .tip { background: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin: 20px 0; }
        .warning { background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
        .checkbox { margin-right: 10px; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <div class="checklist">
        <h2>${isRomanian ? 'PREGĂTIREA CURSULUI' : 'COURSE PREPARATION'}</h2>
        <p>${isRomanian ? 'Înainte de curs:' : 'Before the course:'}</p>
        <ul>
            <li><input type="checkbox" class="checkbox">${isRomanian ? 'Verificați echipamentele tehnice' : 'Check technical equipment'}</li>
            <li><input type="checkbox" class="checkbox">${isRomanian ? 'Pregătiți materialele pentru participanți' : 'Prepare participant materials'}</li>
            <li><input type="checkbox" class="checkbox">${isRomanian ? 'Testați prezentarea' : 'Test the presentation'}</li>
            <li><input type="checkbox" class="checkbox">${isRomanian ? 'Pregătiți activitățile interactive' : 'Prepare interactive activities'}</li>
            <li><input type="checkbox" class="checkbox">${isRomanian ? 'Planificați pauzele' : 'Plan breaks'}</li>
        </ul>
    </div>

    <div class="tip">
        <h2>${isRomanian ? 'GHID DE FACILITARE' : 'FACILITATION GUIDE'}</h2>
        
        <h3>${isRomanian ? 'Introducerea (15 minute):' : 'Introduction (15 minutes):'}</h3>
        <ul>
            <li>${isRomanian ? 'Salutați participanții' : 'Greet participants'}</li>
            <li>${isRomanian ? 'Prezentați-vă pe scurt' : 'Introduce yourself briefly'}</li>
            <li>${isRomanian ? 'Explicați obiectivele cursului' : 'Explain course objectives'}</li>
            <li>${isRomanian ? 'Stabiliți regulile de bază' : 'Establish ground rules'}</li>
            <li>${isRomanian ? 'Creați o atmosferă relaxată' : 'Create a relaxed atmosphere'}</li>
        </ul>

        <h3>${isRomanian ? 'Concepte fundamentale (45 minute):' : 'Fundamental concepts (45 minutes):'}</h3>
        <ul>
            <li>${isRomanian ? 'Prezentați teoria pas cu pas' : 'Present theory step by step'}</li>
            <li>${isRomanian ? 'Folosiți exemple concrete' : 'Use concrete examples'}</li>
            <li>${isRomanian ? 'Verificați înțelegerea regulat' : 'Check understanding regularly'}</li>
            <li>${isRomanian ? 'Încurajați întrebările' : 'Encourage questions'}</li>
            <li>${isRomanian ? 'Adaptați ritmul la audiență' : 'Adapt pace to audience'}</li>
        </ul>
    </div>

    <div class="warning">
        <h2>${isRomanian ? 'SITUAȚII DIFICILE' : 'DIFFICULT SITUATIONS'}</h2>
        <ul>
            <li>${isRomanian ? 'Participanți dominatori' : 'Dominating participants'}</li>
            <li>${isRomanian ? 'Persoane timide' : 'Shy people'}</li>
            <li>${isRomanian ? 'Întrebări dificile' : 'Difficult questions'}</li>
            <li>${isRomanian ? 'Tensiuni în grup' : 'Group tensions'}</li>
            <li>${isRomanian ? 'Probleme tehnice' : 'Technical problems'}</li>
        </ul>
    </div>
</body>
</html>`;
}

function generateParticipantHtml(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  const title = isRomanian ? `MANUAL PARTICIPANT: ${subject}` : `PARTICIPANT MANUAL: ${subject}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #27ae60; padding-bottom: 10px; }
        h2 { color: #229954; margin-top: 30px; }
        .welcome { background: #d5f4e6; padding: 15px; border-left: 4px solid #27ae60; margin: 20px 0; }
        .section { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .notes { border: 1px dashed #6c757d; padding: 15px; margin: 10px 0; min-height: 100px; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
        .checkbox { margin-right: 10px; }
        .fill-in { border-bottom: 1px solid #000; min-width: 200px; display: inline-block; margin: 0 5px; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <div class="welcome">
        <h2>${isRomanian ? 'BINE ATI VENIT!' : 'WELCOME!'}</h2>
        <p>${isRomanian ? `Acest manual vă va ghida prin cursul de ${subject}. Vă rugăm să îl folosiți pentru a lua notițe și a urmări progresul dvs.` : `This manual will guide you through the ${subject} course. Please use it to take notes and track your progress.`}</p>
    </div>

    <div class="section">
        <h2>${isRomanian ? 'OBIECTIVELE CURSULUI' : 'COURSE OBJECTIVES'}</h2>
        <p>${isRomanian ? 'La sfârșitul acestui curs veți fi capabili să:' : 'By the end of this course you will be able to:'}</p>
        <ul>
            <li><input type="checkbox" class="checkbox">${isRomanian ? 'Înțelegeți conceptele fundamentale' : 'Understand fundamental concepts'}</li>
            <li><input type="checkbox" class="checkbox">${isRomanian ? 'Aplicați cunoștințele în practică' : 'Apply knowledge in practice'}</li>
            <li><input type="checkbox" class="checkbox">${isRomanian ? 'Rezolvați probleme specifice' : 'Solve specific problems'}</li>
            <li><input type="checkbox" class="checkbox">${isRomanian ? 'Evaluați propriul progres' : 'Evaluate your own progress'}</li>
        </ul>
    </div>

    <div class="section">
        <h2>${isRomanian ? 'SECȚIUNEA 1: CONCEPTE FUNDAMENTALE' : 'SECTION 1: FUNDAMENTAL CONCEPTS'}</h2>
        
        <h3>${isRomanian ? 'Definiții importante:' : 'Important definitions:'}</h3>
        <div class="notes">
            <span class="fill-in"></span><br><br>
            <span class="fill-in"></span><br><br>
            <span class="fill-in"></span><br><br>
        </div>

        <h3>${isRomanian ? 'Principii de bază:' : 'Basic principles:'}</h3>
        <ol>
            <li><span class="fill-in"></span></li>
            <li><span class="fill-in"></span></li>
            <li><span class="fill-in"></span></li>
        </ol>

        <h3>${isRomanian ? 'Notițe personale:' : 'Personal notes:'}</h3>
        <div class="notes"></div>
    </div>

    <div class="section">
        <h2>${isRomanian ? 'SECȚIUNEA 2: APLICAȚII PRACTICE' : 'SECTION 2: PRACTICAL APPLICATIONS'}</h2>
        
        <h3>${isRomanian ? 'Studiul de caz 1:' : 'Case study 1:'}</h3>
        <p>${isRomanian ? 'Situația:' : 'Situation:'} <span class="fill-in"></span></p>
        <p>${isRomanian ? 'Soluția propusă:' : 'Proposed solution:'} <span class="fill-in"></span></p>
        <p>${isRomanian ? 'Rezultate:' : 'Results:'} <span class="fill-in"></span></p>

        <h3>${isRomanian ? 'Studiul de caz 2:' : 'Case study 2:'}</h3>
        <p>${isRomanian ? 'Situația:' : 'Situation:'} <span class="fill-in"></span></p>
        <p>${isRomanian ? 'Soluția propusă:' : 'Proposed solution:'} <span class="fill-in"></span></p>
        <p>${isRomanian ? 'Rezultate:' : 'Results:'} <span class="fill-in"></span></p>
    </div>

    <div class="section">
        <h2>${isRomanian ? 'PLANUL MEU DE ACȚIUNE' : 'MY ACTION PLAN'}</h2>
        
        <h3>${isRomanian ? 'Ce voi aplica imediat:' : 'What I will apply immediately:'}</h3>
        <ol>
            <li><span class="fill-in"></span></li>
            <li><span class="fill-in"></span></li>
            <li><span class="fill-in"></span></li>
        </ol>

        <h3>${isRomanian ? 'Ce voi dezvolta pe termen lung:' : 'What I will develop long-term:'}</h3>
        <ol>
            <li><span class="fill-in"></span></li>
            <li><span class="fill-in"></span></li>
            <li><span class="fill-in"></span></li>
        </ol>
    </div>
</body>
</html>`;
}

function generateActivitiesHtml(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  const title = isRomanian ? `ACTIVITĂȚI ȘI EXERCIȚII: ${subject}` : `ACTIVITIES AND EXERCISES: ${subject}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #f39c12; padding-bottom: 10px; }
        h2 { color: #e67e22; margin-top: 30px; }
        .activity { background: #fef9e7; padding: 20px; margin: 20px 0; border-left: 4px solid #f39c12; border-radius: 5px; }
        .activity-header { background: #f39c12; color: white; padding: 10px; margin: -20px -20px 15px -20px; border-radius: 5px 5px 0 0; }
        .time-box { background: #e8f5e8; padding: 10px; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .instructions { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        ul, ol { padding-left: 20px; }
        li { margin: 8px 0; }
        .materials { background: #fff3e0; padding: 10px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <div class="activity">
        <div class="activity-header">
            <h2>${isRomanian ? 'ACTIVITATEA 1: BRAINSTORMING' : 'ACTIVITY 1: BRAINSTORMING'}</h2>
        </div>
        <div class="time-box">
            <strong>${isRomanian ? 'Timp:' : 'Time:'}</strong> 15 ${isRomanian ? 'minute' : 'minutes'}<br>
            <strong>${isRomanian ? 'Participanți:' : 'Participants:'}</strong> ${isRomanian ? 'Toți' : 'Everyone'}<br>
            <strong>${isRomanian ? 'Obiectiv:' : 'Objective:'}</strong> ${isRomanian ? 'Generarea de idei creative' : 'Generate creative ideas'}
        </div>
        
        <div class="instructions">
            <h3>${isRomanian ? 'Instrucțiuni:' : 'Instructions:'}</h3>
            <ol>
                <li>${isRomanian ? 'Formați grupuri de 4-5 persoane' : 'Form groups of 4-5 people'}</li>
                <li>${isRomanian ? 'Alegeți un moderator pentru fiecare grup' : 'Choose a moderator for each group'}</li>
                <li>${isRomanian ? 'Generați cât mai multe idei în 10 minute' : 'Generate as many ideas as possible in 10 minutes'}</li>
                <li>${isRomanian ? 'Prezentați cele mai bune 3 idei (5 minute)' : 'Present the best 3 ideas (5 minutes)'}</li>
            </ol>
        </div>
        
        <p><strong>${isRomanian ? 'Întrebarea:' : 'Question:'}</strong> "${isRomanian ? `Cum putem aplica ${subject} în activitatea noastră zilnică?` : `How can we apply ${subject} in our daily activities?`}"</p>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2>${isRomanian ? 'ACTIVITATEA 2: STUDIU DE CAZ' : 'ACTIVITY 2: CASE STUDY'}</h2>
        </div>
        <div class="time-box">
            <strong>${isRomanian ? 'Timp:' : 'Time:'}</strong> 30 ${isRomanian ? 'minute' : 'minutes'}<br>
            <strong>${isRomanian ? 'Participanți:' : 'Participants:'}</strong> ${isRomanian ? 'Grupuri de 3-4 persoane' : 'Groups of 3-4 people'}<br>
            <strong>${isRomanian ? 'Obiectiv:' : 'Objective:'}</strong> ${isRomanian ? 'Aplicarea practică a conceptelor' : 'Practical application of concepts'}
        </div>
        
        <div class="instructions">
            <h3>${isRomanian ? 'Scenariul:' : 'Scenario:'}</h3>
            <p>${isRomanian ? `O companie din domeniul ${context} se confruntă cu următoarea provocare...` : `A company in the ${context} field faces the following challenge...`}</p>
            <p><em>[${isRomanian ? 'Descrierea detaliată a situației' : 'Detailed situation description'}]</em></p>
            
            <h3>${isRomanian ? 'Sarcini:' : 'Tasks:'}</h3>
            <ol>
                <li>${isRomanian ? 'Analizați situația (10 minute)' : 'Analyze the situation (10 minutes)'}</li>
                <li>${isRomanian ? 'Propuneți soluții (15 minute)' : 'Propose solutions (15 minutes)'}</li>
                <li>${isRomanian ? 'Prezentați soluția (5 minute)' : 'Present the solution (5 minutes)'}</li>
            </ol>
        </div>
    </div>

    <div class="activity">
        <div class="activity-header">
            <h2>${isRomanian ? 'ACTIVITATEA 3: ROLE-PLAYING' : 'ACTIVITY 3: ROLE-PLAYING'}</h2>
        </div>
        <div class="time-box">
            <strong>${isRomanian ? 'Timp:' : 'Time:'}</strong> 20 ${isRomanian ? 'minute' : 'minutes'}<br>
            <strong>${isRomanian ? 'Participanți:' : 'Participants:'}</strong> ${isRomanian ? 'Perechi' : 'Pairs'}<br>
            <strong>${isRomanian ? 'Obiectiv:' : 'Objective:'}</strong> ${isRomanian ? 'Exersarea competențelor practice' : 'Practice practical skills'}
        </div>
        
        <div class="instructions">
            <h3>${isRomanian ? 'Roluri:' : 'Roles:'}</h3>
            <ul>
                <li><strong>${isRomanian ? 'Persoana A:' : 'Person A:'}</strong> Manager/Facilitator</li>
                <li><strong>${isRomanian ? 'Persoana B:' : 'Person B:'}</strong> ${isRomanian ? 'Angajat/Participant' : 'Employee/Participant'}</li>
            </ul>
            
            <p><strong>${isRomanian ? 'Scenariul:' : 'Scenario:'}</strong> ${isRomanian ? 'Simulați o situație în care trebuie să aplicați principiile învățate...' : 'Simulate a situation where you need to apply the learned principles...'}</p>
        </div>
    </div>

    <div class="materials">
        <h2>${isRomanian ? 'MATERIALE NECESARE:' : 'REQUIRED MATERIALS:'}</h2>
        <ul>
            <li>${isRomanian ? 'Flipchart și markere' : 'Flipchart and markers'}</li>
            <li>${isRomanian ? 'Post-it-uri colorate' : 'Colored post-it notes'}</li>
            <li>${isRomanian ? 'Cronometru' : 'Timer'}</li>
            <li>${isRomanian ? 'Fișe de evaluare' : 'Evaluation sheets'}</li>
            <li>${isRomanian ? 'Premii simbolice pentru activități' : 'Symbolic prizes for activities'}</li>
        </ul>
    </div>
</body>
</html>`;
}

function generateEvaluationHtml(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  const title = isRomanian ? `INSTRUMENTE DE EVALUARE: ${subject}` : `EVALUATION TOOLS: ${subject}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #9b59b6; padding-bottom: 10px; }
        h2 { color: #8e44ad; margin-top: 30px; }
        .eval-section { background: #f4f1fb; padding: 20px; margin: 20px 0; border-left: 4px solid #9b59b6; border-radius: 5px; }
        .question { background: #ffffff; padding: 15px; margin: 15px 0; border: 1px solid #d5dbdb; border-radius: 5px; }
        .scale { display: flex; justify-content: space-between; align-items: center; margin: 10px 0; }
        .scale-item { text-align: center; flex: 1; }
        .checkbox-group { display: flex; flex-wrap: wrap; gap: 15px; margin: 10px 0; }
        .checkbox-item { display: flex; align-items: center; gap: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
        .fill-line { border-bottom: 1px solid #000; min-width: 300px; display: inline-block; margin: 0 5px; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <div class="eval-section">
        <h2>${isRomanian ? 'EVALUARE INIȚIALĂ (PRE-CURS)' : 'INITIAL EVALUATION (PRE-COURSE)'}</h2>
        
        <div class="question">
            <p><strong>1. ${isRomanian ? `Cât de familiar sunteți cu ${subject}?` : `How familiar are you with ${subject}?`}</strong></p>
            <div class="scale">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
                <span>8</span>
                <span>9</span>
                <span>10</span>
            </div>
            <div class="scale">
                <small>${isRomanian ? 'Deloc familiar' : 'Not familiar at all'}</small>
                <small>${isRomanian ? 'Foarte familiar' : 'Very familiar'}</small>
            </div>
        </div>

        <div class="question">
            <p><strong>2. ${isRomanian ? 'Ce experiență aveți în domeniu?' : 'What experience do you have in the field?'}</strong></p>
            <div class="checkbox-group">
                <div class="checkbox-item">
                    <input type="checkbox"> ${isRomanian ? 'Începător (0-1 ani)' : 'Beginner (0-1 years)'}
                </div>
                <div class="checkbox-item">
                    <input type="checkbox"> ${isRomanian ? 'Intermediar (2-5 ani)' : 'Intermediate (2-5 years)'}
                </div>
                <div class="checkbox-item">
                    <input type="checkbox"> ${isRomanian ? 'Avansat (5+ ani)' : 'Advanced (5+ years)'}
                </div>
            </div>
        </div>

        <div class="question">
            <p><strong>3. ${isRomanian ? 'Care sunt așteptările dvs. de la acest curs?' : 'What are your expectations from this course?'}</strong></p>
            <span class="fill-line"></span><br><br>
            <span class="fill-line"></span><br><br>
        </div>
    </div>

    <div class="eval-section">
        <h2>${isRomanian ? 'EVALUARE FINALĂ (POST-CURS)' : 'FINAL EVALUATION (POST-COURSE)'}</h2>
        
        <div class="question">
            <p><strong>1. ${isRomanian ? `Definiți conceptul principal al ${subject}:` : `Define the main concept of ${subject}:`}</strong></p>
            <span class="fill-line"></span><br><br>
            <span class="fill-line"></span><br><br>
        </div>

        <div class="question">
            <p><strong>2. ${isRomanian ? 'Enumerați 3 beneficii ale aplicării acestor principii:' : 'List 3 benefits of applying these principles:'}</strong></p>
            <p>a) <span class="fill-line"></span></p>
            <p>b) <span class="fill-line"></span></p>
            <p>c) <span class="fill-line"></span></p>
        </div>

        <div class="question">
            <p><strong>3. ${isRomanian ? 'Descrieți un scenariu de aplicare practică:' : 'Describe a practical application scenario:'}</strong></p>
            <span class="fill-line"></span><br><br>
            <span class="fill-line"></span><br><br>
        </div>
    </div>

    <div class="eval-section">
        <h2>${isRomanian ? 'EVALUAREA CURSULUI' : 'COURSE EVALUATION'}</h2>
        
        <table>
            <tr>
                <th>${isRomanian ? 'Aspect' : 'Aspect'}</th>
                <th>${isRomanian ? 'Excelent' : 'Excellent'}</th>
                <th>${isRomanian ? 'Bun' : 'Good'}</th>
                <th>${isRomanian ? 'Satisfăcător' : 'Satisfactory'}</th>
                <th>${isRomanian ? 'Nesatisfăcător' : 'Unsatisfactory'}</th>
            </tr>
            <tr>
                <td>${isRomanian ? 'Conținutul cursului' : 'Course content'}</td>
                <td><input type="radio" name="content"></td>
                <td><input type="radio" name="content"></td>
                <td><input type="radio" name="content"></td>
                <td><input type="radio" name="content"></td>
            </tr>
            <tr>
                <td>${isRomanian ? 'Facilitatorul' : 'Facilitator'}</td>
                <td><input type="radio" name="facilitator"></td>
                <td><input type="radio" name="facilitator"></td>
                <td><input type="radio" name="facilitator"></td>
                <td><input type="radio" name="facilitator"></td>
            </tr>
            <tr>
                <td>${isRomanian ? 'Materialele' : 'Materials'}</td>
                <td><input type="radio" name="materials"></td>
                <td><input type="radio" name="materials"></td>
                <td><input type="radio" name="materials"></td>
                <td><input type="radio" name="materials"></td>
            </tr>
        </table>

        <div class="question">
            <p><strong>${isRomanian ? 'Sugestii de îmbunătățire:' : 'Improvement suggestions:'}</strong></p>
            <span class="fill-line"></span><br><br>
            <span class="fill-line"></span><br><br>
        </div>
    </div>
</body>
</html>`;
}

function generateResourcesHtml(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  const title = isRomanian ? `RESURSE SUPLIMENTARE: ${subject}` : `ADDITIONAL RESOURCES: ${subject}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #16a085; padding-bottom: 10px; }
        h2 { color: #138d75; margin-top: 30px; }
        .resource-section { background: #e8f8f5; padding: 20px; margin: 20px 0; border-left: 4px solid #16a085; border-radius: 5px; }
        .resource-item { background: #ffffff; padding: 15px; margin: 10px 0; border: 1px solid #a9dfbf; border-radius: 5px; }
        .book { border-left: 4px solid #3498db; }
        .website { border-left: 4px solid #e74c3c; }
        .course { border-left: 4px solid #f39c12; }
        .tool { border-left: 4px solid #9b59b6; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
        .checkbox { margin-right: 10px; }
        .link { color: #3498db; text-decoration: underline; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <div class="resource-section">
        <h2>${isRomanian ? 'CĂRȚI RECOMANDATE' : 'RECOMMENDED BOOKS'}</h2>
        
        <div class="resource-item book">
            <h3>${isRomanian ? 'Nivel începător:' : 'Beginner level:'}</h3>
            <p><strong>"${isRomanian ? `Introducere în ${subject}` : `Introduction to ${subject}`}" - ${isRomanian ? 'Autor Principal' : 'Main Author'}</strong></p>
            <ul>
                <li>${isRomanian ? 'Concepte de bază explicate simplu' : 'Basic concepts explained simply'}</li>
                <li>${isRomanian ? 'Exemple practice din viața reală' : 'Real-life practical examples'}</li>
                <li>${isRomanian ? 'Exerciții pas cu pas' : 'Step-by-step exercises'}</li>
            </ul>
        </div>

        <div class="resource-item book">
            <h3>${isRomanian ? 'Nivel intermediar:' : 'Intermediate level:'}</h3>
            <p><strong>"${isRomanian ? `${subject} avansat` : `Advanced ${subject}`}" - ${isRomanian ? 'Specialist în domeniu' : 'Domain Specialist'}</strong></p>
            <ul>
                <li>${isRomanian ? 'Tehnici sofisticate' : 'Sophisticated techniques'}</li>
                <li>${isRomanian ? 'Analize aprofundate' : 'In-depth analyses'}</li>
                <li>${isRomanian ? 'Strategii complexe' : 'Complex strategies'}</li>
            </ul>
        </div>
    </div>

    <div class="resource-section">
        <h2>${isRomanian ? 'RESURSE ONLINE' : 'ONLINE RESOURCES'}</h2>
        
        <div class="resource-item website">
            <h3>${isRomanian ? 'Site-uri web utile:' : 'Useful websites:'}</h3>
            <ul>
                <li><span class="link">www.${subject.toLowerCase().replace(/\s+/g, '')}.org</span> - ${isRomanian ? 'Resurse oficiale' : 'Official resources'}</li>
                <li><span class="link">www.${context}academy.com</span> - ${isRomanian ? 'Cursuri online' : 'Online courses'}</li>
                <li><span class="link">www.expertsin${subject.toLowerCase().replace(/\s+/g, '')}.net</span> - ${isRomanian ? 'Comunitate de experți' : 'Expert community'}</li>
            </ul>
        </div>

        <div class="resource-item website">
            <h3>${isRomanian ? 'Bloguri și articole:' : 'Blogs and articles:'}</h3>
            <ul>
                <li>${isRomanian ? `Blog-ul ${subject}` : `${subject} Blog`} - ${isRomanian ? 'Articole săptămânale' : 'Weekly articles'}</li>
                <li>${isRomanian ? `Revista ${context}` : `${context} Magazine`} - ${isRomanian ? 'Studii de caz lunare' : 'Monthly case studies'}</li>
                <li>${isRomanian ? `Newsletter ${subject} Trends` : `${subject} Trends Newsletter`} - ${isRomanian ? 'Tendințe și noutăți' : 'Trends and news'}</li>
            </ul>
        </div>
    </div>

    <div class="resource-section">
        <h2>${isRomanian ? 'CURSURI ȘI CERTIFICĂRI' : 'COURSES AND CERTIFICATIONS'}</h2>
        
        <div class="resource-item course">
            <h3>${isRomanian ? 'Cursuri online:' : 'Online courses:'}</h3>
            <ul>
                <li><input type="checkbox" class="checkbox">${subject} Fundamentals (40 ${isRomanian ? 'ore' : 'hours'})</li>
                <li><input type="checkbox" class="checkbox">Advanced ${subject} Techniques (60 ${isRomanian ? 'ore' : 'hours'})</li>
                <li><input type="checkbox" class="checkbox">${subject} for ${audience} (30 ${isRomanian ? 'ore' : 'hours'})</li>
                <li><input type="checkbox" class="checkbox">${context} ${subject} Specialization (80 ${isRomanian ? 'ore' : 'hours'})</li>
            </ul>
        </div>

        <div class="resource-item course">
            <h3>${isRomanian ? 'Certificări profesionale:' : 'Professional certifications:'}</h3>
            <ul>
                <li><input type="checkbox" class="checkbox">Certified ${subject} Practitioner</li>
                <li><input type="checkbox" class="checkbox">Advanced ${subject} Specialist</li>
                <li><input type="checkbox" class="checkbox">${subject} Master Certification</li>
                <li><input type="checkbox" class="checkbox">${context} ${subject} Expert</li>
            </ul>
        </div>
    </div>

    <div class="resource-section">
        <h2>${isRomanian ? 'INSTRUMENTE ȘI SOFTWARE' : 'TOOLS AND SOFTWARE'}</h2>
        
        <div class="resource-item tool">
            <h3>${isRomanian ? 'Instrumente gratuite:' : 'Free tools:'}</h3>
            <ul>
                <li><input type="checkbox" class="checkbox">${subject} Calculator - ${isRomanian ? 'Calcule rapide' : 'Quick calculations'}</li>
                <li><input type="checkbox" class="checkbox">${subject} Planner - ${isRomanian ? 'Planificare proiecte' : 'Project planning'}</li>
                <li><input type="checkbox" class="checkbox">${subject} Tracker - ${isRomanian ? 'Monitorizare progres' : 'Progress monitoring'}</li>
            </ul>
        </div>

        <div class="resource-item tool">
            <h3>${isRomanian ? 'Software profesional:' : 'Professional software:'}</h3>
            <ul>
                <li><input type="checkbox" class="checkbox">${subject} Pro Suite - ${isRomanian ? 'Soluție completă' : 'Complete solution'}</li>
                <li><input type="checkbox" class="checkbox">Advanced ${subject} Tools - ${isRomanian ? 'Instrumente avansate' : 'Advanced tools'}</li>
                <li><input type="checkbox" class="checkbox">${subject} Analytics - ${isRomanian ? 'Analiză și raportare' : 'Analysis and reporting'}</li>
            </ul>
        </div>
    </div>

    <div class="resource-section">
        <h2>${isRomanian ? 'DEZVOLTARE CONTINUĂ' : 'CONTINUOUS DEVELOPMENT'}</h2>
        
        <h3>${isRomanian ? 'Plan de învățare pe 6 luni:' : '6-month learning plan:'}</h3>
        <p><strong>${isRomanian ? 'Luna 1-2: Consolidarea fundamentelor' : 'Month 1-2: Foundation consolidation'}</strong></p>
        <ul>
            <li>${isRomanian ? 'Recitirea materialelor cursului' : 'Re-reading course materials'}</li>
            <li>${isRomanian ? 'Aplicarea în proiecte mici' : 'Application in small projects'}</li>
            <li>${isRomanian ? 'Participarea la webinare' : 'Webinar participation'}</li>
        </ul>

        <p><strong>${isRomanian ? 'Luna 3-4: Aprofundarea cunoștințelor' : 'Month 3-4: Knowledge deepening'}</strong></p>
        <ul>
            <li>${isRomanian ? 'Citirea unei cărți avansate' : 'Reading an advanced book'}</li>
            <li>${isRomanian ? 'Participarea la workshop-uri' : 'Workshop participation'}</li>
            <li>${isRomanian ? 'Networking cu experți' : 'Expert networking'}</li>
        </ul>

        <p><strong>${isRomanian ? 'Luna 5-6: Specializarea' : 'Month 5-6: Specialization'}</strong></p>
        <ul>
            <li>${isRomanian ? 'Alegerea unei nișe specifice' : 'Choosing a specific niche'}</li>
            <li>${isRomanian ? 'Dezvoltarea unui proiect complex' : 'Developing a complex project'}</li>
            <li>${isRomanian ? 'Pregătirea pentru certificare' : 'Certification preparation'}</li>
        </ul>
    </div>
</body>
</html>`;
}

// Generate PPTX slides content
function generatePptxSlides(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean) {
  const slides = [];
  
  // Slide 1: Title
  slides.push({
    title: subject,
    content: [
      `${isRomanian ? 'Curs pentru' : 'Course for'} ${audience}`,
      `${isRomanian ? 'Nivel' : 'Level'}: ${level}`,
      `${isRomanian ? 'Durată' : 'Duration'}: ${duration}`
    ]
  });

  // Slide 2: Objectives
  slides.push({
    title: isRomanian ? 'Obiectivele cursului' : 'Course Objectives',
    content: [
      isRomanian ? 'Înțelegerea conceptelor de bază' : 'Understanding basic concepts',
      isRomanian ? 'Aplicarea practică a cunoștințelor' : 'Practical application of knowledge',
      isRomanian ? 'Dezvoltarea competențelor specifice' : 'Development of specific skills',
      isRomanian ? 'Evaluarea progresului personal' : 'Personal progress evaluation'
    ]
  });

  // Slide 3: Agenda
  slides.push({
    title: isRomanian ? 'Agenda' : 'Agenda',
    content: [
      `1. ${isRomanian ? 'Introducere' : 'Introduction'} (15 min)`,
      `2. ${isRomanian ? 'Concepte fundamentale' : 'Fundamental concepts'} (45 min)`,
      `3. ${isRomanian ? 'Pauză' : 'Break'} (15 min)`,
      `4. ${isRomanian ? 'Aplicații practice' : 'Practical applications'} (60 min)`,
      `5. ${isRomanian ? 'Exerciții' : 'Exercises'} (30 min)`,
      `6. ${isRomanian ? 'Evaluare și închidere' : 'Evaluation and closing'} (15 min)`
    ]
  });

  // Slide 4: Key Concepts
  slides.push({
    title: isRomanian ? 'Concepte cheie' : 'Key Concepts',
    content: [
      isRomanian ? 'Definiții importante' : 'Important definitions',
      isRomanian ? 'Principii fundamentale' : 'Fundamental principles',
      isRomanian ? 'Teorii relevante' : 'Relevant theories',
      isRomanian ? 'Best practices' : 'Best practices'
    ]
  });

  // Slide 5: Practical Applications
  slides.push({
    title: isRomanian ? 'Aplicații practice' : 'Practical Applications',
    content: [
      isRomanian ? 'Studii de caz reale' : 'Real case studies',
      isRomanian ? 'Exemple din industrie' : 'Industry examples',
      isRomanian ? 'Exerciții hands-on' : 'Hands-on exercises',
      isRomanian ? 'Simulări' : 'Simulations'
    ]
  });

  // Slide 6: Activities
  slides.push({
    title: isRomanian ? 'Activități' : 'Activities',
    content: [
      isRomanian ? 'Lucru în echipă' : 'Teamwork',
      isRomanian ? 'Brainstorming' : 'Brainstorming',
      isRomanian ? 'Role-playing' : 'Role-playing',
      isRomanian ? 'Prezentări' : 'Presentations'
    ]
  });

  // Slide 7: Evaluation
  slides.push({
    title: isRomanian ? 'Evaluare' : 'Evaluation',
    content: [
      isRomanian ? 'Teste de cunoștințe' : 'Knowledge tests',
      isRomanian ? 'Exerciții practice' : 'Practical exercises',
      isRomanian ? 'Feedback peer-to-peer' : 'Peer-to-peer feedback',
      isRomanian ? 'Auto-evaluare' : 'Self-assessment'
    ]
  });

  // Slide 8: Resources
  slides.push({
    title: isRomanian ? 'Resurse' : 'Resources',
    content: [
      isRomanian ? 'Materiale suplimentare' : 'Additional materials',
      isRomanian ? 'Cărți recomandate' : 'Recommended books',
      isRomanian ? 'Site-uri web utile' : 'Useful websites',
      isRomanian ? 'Comunități online' : 'Online communities'
    ]
  });

  // Slide 9: Q&A
  slides.push({
    title: isRomanian ? 'Întrebări și răspunsuri' : 'Questions & Answers',
    content: [
      isRomanian ? 'Sesiune de Q&A' : 'Q&A Session',
      isRomanian ? 'Clarificări' : 'Clarifications',
      isRomanian ? 'Discuții' : 'Discussions'
    ]
  });

  // Slide 10: Thank You
  slides.push({
    title: isRomanian ? 'Mulțumiri' : 'Thank You',
    content: [
      isRomanian ? 'Vă mulțumim pentru participare!' : 'Thank you for your participation!',
      isRomanian ? 'Contact: contact@automator.ro' : 'Contact: contact@automator.ro'
    ]
  });

  return slides;
}

// Create and upload DOCX file
async function createAndUploadDocx(
  supabase: any,
  htmlContent: string,
  fileName: string
): Promise<string | null> {
  try {
    console.log(`Creating DOCX file: ${fileName}`);
    
    // Convert HTML to DOCX using html-docx-js
    const docxBuffer = htmlDocx.asBlob(htmlContent);
    
    if (!docxBuffer) {
      console.error('Failed to generate DOCX buffer');
      return null;
    }

    // Convert blob to array buffer then to Uint8Array
    const arrayBuffer = await docxBuffer.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log(`DOCX file size: ${uint8Array.length} bytes`);
    
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

// Create and upload PPTX file
async function createAndUploadPptx(
  supabase: any,
  slides: any[],
  fileName: string
): Promise<string | null> {
  try {
    console.log(`Creating PPTX file: ${fileName}`);
    
    // Create new presentation
    const pptx = new PptxGenJS();
    
    // Add slides
    slides.forEach((slideData, index) => {
      const slide = pptx.addSlide();
      
      // Add slide number
      slide.addText(`${index + 1}`, {
        x: 9.0,
        y: 6.5,
        w: 1.0,
        h: 0.5,
        fontSize: 12,
        color: '666666'
      });
      
      // Add title
      slide.addText(slideData.title, {
        x: 0.5,
        y: 0.5,
        w: 9.0,
        h: 1.0,
        fontSize: 24,
        bold: true,
        color: '2c3e50'
      });
      
      // Add content
      if (slideData.content && slideData.content.length > 0) {
        slideData.content.forEach((item: string, itemIndex: number) => {
          slide.addText(`• ${item}`, {
            x: 1.0,
            y: 2.0 + (itemIndex * 0.6),
            w: 8.0,
            h: 0.5,
            fontSize: 16,
            color: '34495e'
          });
        });
      }
    });
    
    // Generate PPTX as array buffer
    const pptxBuffer = await pptx.write({ outputType: 'arraybuffer' });
    const uint8Array = new Uint8Array(pptxBuffer);
    
    console.log(`PPTX file size: ${uint8Array.length} bytes`);
    
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
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseServiceKey?.length || 0
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      return createErrorResponse('Missing Supabase configuration', 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase client initialized successfully');

    // Parse request body
    const requestBody = await req.json();
    console.log('Request body received:', Object.keys(requestBody));
    
    const { jobId, ...metadata } = requestBody;

    if (!jobId) {
      console.error('Missing jobId parameter');
      return createErrorResponse('Missing jobId parameter', 400);
    }

    console.log('Processing job:', { jobId, metadata });

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

    console.log('Job found:', { id: job.id, status: job.status, userId: job.userId });

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

    console.log(`Starting generation of ${materialsToGenerate.length} materials`);

    // Generate each material
    for (let i = 0; i < materialsToGenerate.length; i++) {
      const material = materialsToGenerate[i];
      const progress = Math.round(((i + 1) / materialsToGenerate.length) * 100);
      
      console.log(`Generating material ${i + 1}/7: ${material.name} (${material.format})`);
      
      // Update progress
      await updateJobProgress(
        supabase, 
        jobId, 
        Math.max(progress - 15, 5), 
        'processing', 
        `Generează ${material.name}...`,
        material.stepNumber,
        material.name
      );

      let storagePath: string | null = null;

      try {
        if (material.format === 'pptx') {
          // Generate PPTX slides
          const slides = generatePptxSlides(
            metadata.subject || 'Course Subject',
            metadata.level || 'intermediate',
            metadata.audience || 'professionals',
            metadata.duration || '2h',
            metadata.tone || 'professional',
            metadata.context || 'corporate',
            metadata.language === 'ro'
          );
          
          storagePath = await createAndUploadPptx(supabase, slides, material.name);
        } else {
          // Generate HTML content for DOCX
          let htmlContent = '';
          
          switch (material.type) {
            case 'foundation':
              htmlContent = generateFoundationHtml(
                metadata.subject || 'Course Subject',
                metadata.level || 'intermediate',
                metadata.audience || 'professionals',
                metadata.duration || '2h',
                metadata.tone || 'professional',
                metadata.context || 'corporate',
                metadata.language === 'ro'
              );
              break;
            case 'facilitator':
              htmlContent = generateFacilitatorHtml(
                metadata.subject || 'Course Subject',
                metadata.level || 'intermediate',
                metadata.audience || 'professionals',
                metadata.duration || '2h',
                metadata.tone || 'professional',
                metadata.context || 'corporate',
                metadata.language === 'ro'
              );
              break;
            case 'participant':
              htmlContent = generateParticipantHtml(
                metadata.subject || 'Course Subject',
                metadata.level || 'intermediate',
                metadata.audience || 'professionals',
                metadata.duration || '2h',
                metadata.tone || 'professional',
                metadata.context || 'corporate',
                metadata.language === 'ro'
              );
              break;
            case 'activities':
              htmlContent = generateActivitiesHtml(
                metadata.subject || 'Course Subject',
                metadata.level || 'intermediate',
                metadata.audience || 'professionals',
                metadata.duration || '2h',
                metadata.tone || 'professional',
                metadata.context || 'corporate',
                metadata.language === 'ro'
              );
              break;
            case 'evaluation':
              htmlContent = generateEvaluationHtml(
                metadata.subject || 'Course Subject',
                metadata.level || 'intermediate',
                metadata.audience || 'professionals',
                metadata.duration || '2h',
                metadata.tone || 'professional',
                metadata.context || 'corporate',
                metadata.language === 'ro'
              );
              break;
            case 'resources':
              htmlContent = generateResourcesHtml(
                metadata.subject || 'Course Subject',
                metadata.level || 'intermediate',
                metadata.audience || 'professionals',
                metadata.duration || '2h',
                metadata.tone || 'professional',
                metadata.context || 'corporate',
                metadata.language === 'ro'
              );
              break;
            default:
              htmlContent = '<html><body><h1>Content not available</h1></body></html>';
          }
          
          storagePath = await createAndUploadDocx(supabase, htmlContent, material.name);
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
            content: material.format === 'pptx' ? 'PPTX presentation content' : 'DOCX document content',
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

      } catch (materialError) {
        console.error(`Error generating material ${material.name}:`, materialError);
        await updateJobProgress(supabase, jobId, progress, 'failed', `Eroare la generarea ${material.name}: ${materialError.message}`);
        return createErrorResponse(`Failed to generate ${material.name}: ${materialError.message}`, 500);
      }
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