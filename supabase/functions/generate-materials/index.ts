import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

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

// Helper function to generate content using a simple template system
function generateContent(type: string, metadata: any): string {
  const { subject, language, level, audience, duration, tone, context } = metadata;
  
  const isRomanian = language === 'ro';
  
  switch (type) {
    case 'foundation':
      return generateFoundationContent(subject, level, audience, duration, tone, context, isRomanian);
    case 'slides':
      return generateSlidesContent(subject, level, audience, duration, tone, context, isRomanian);
    case 'facilitator':
      return generateFacilitatorContent(subject, level, audience, duration, tone, context, isRomanian);
    case 'participant':
      return generateParticipantContent(subject, level, audience, duration, tone, context, isRomanian);
    case 'activities':
      return generateActivitiesContent(subject, level, audience, duration, tone, context, isRomanian);
    case 'evaluation':
      return generateEvaluationContent(subject, level, audience, duration, tone, context, isRomanian);
    case 'resources':
      return generateResourcesContent(subject, level, audience, duration, tone, context, isRomanian);
    default:
      return 'Content not available';
  }
}

function generateFoundationContent(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `STRUCTURA ȘI OBIECTIVELE CURSULUI: ${subject}

INFORMAȚII GENERALE
- Subiect: ${subject}
- Nivel: ${level}
- Public țintă: ${audience}
- Durată: ${duration}
- Context: ${context}
- Ton: ${tone}

OBIECTIVE DE ÎNVĂȚARE
La sfârșitul acestui curs, participanții vor fi capabili să:
1. Înțeleagă conceptele fundamentale ale ${subject}
2. Aplice principiile de bază în situații practice
3. Analizeze și rezolve probleme specifice domeniului
4. Dezvolte competențe practice relevante
5. Evalueze și îmbunătățească performanța proprie

AGENDA DETALIATĂ
1. Introducere și prezentări (15 minute)
2. Concepte fundamentale (30% din timp)
3. Aplicații practice (40% din timp)
4. Exerciții și activități (20% din timp)
5. Evaluare și feedback (10% din timp)

METODOLOGIE
- Prezentări interactive
- Studii de caz
- Exerciții practice
- Discuții în grup
- Evaluare continuă

RESURSE NECESARE
- Materiale de prezentare
- Fișe de lucru
- Studii de caz
- Instrumente de evaluare
- Resurse suplimentare pentru dezvoltare continuă`;
  } else {
    return `COURSE STRUCTURE AND OBJECTIVES: ${subject}

GENERAL INFORMATION
- Subject: ${subject}
- Level: ${level}
- Target Audience: ${audience}
- Duration: ${duration}
- Context: ${context}
- Tone: ${tone}

LEARNING OBJECTIVES
By the end of this course, participants will be able to:
1. Understand fundamental concepts of ${subject}
2. Apply basic principles in practical situations
3. Analyze and solve domain-specific problems
4. Develop relevant practical skills
5. Evaluate and improve their own performance

DETAILED AGENDA
1. Introduction and presentations (15 minutes)
2. Fundamental concepts (30% of time)
3. Practical applications (40% of time)
4. Exercises and activities (20% of time)
5. Evaluation and feedback (10% of time)

METHODOLOGY
- Interactive presentations
- Case studies
- Practical exercises
- Group discussions
- Continuous evaluation

REQUIRED RESOURCES
- Presentation materials
- Worksheets
- Case studies
- Evaluation tools
- Additional resources for continuous development`;
  }
}

function generateSlidesContent(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
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

SLIDE 4: CONCEPTE CHEIE
• Definiții importante
• Principii fundamentale
• Teorii relevante
• Best practices

SLIDE 5: APLICAȚII PRACTICE
• Studii de caz reale
• Exemple din industrie
• Exerciții hands-on
• Simulări

SLIDE 6: ACTIVITĂȚI
• Lucru în echipă
• Brainstorming
• Role-playing
• Prezentări

SLIDE 7: EVALUARE
• Teste de cunoștințe
• Exerciții practice
• Feedback peer-to-peer
• Auto-evaluare

SLIDE 8: RESURSE
• Materiale suplimentare
• Cărți recomandate
• Site-uri web utile
• Comunități online

SLIDE 9: ÎNTREBĂRI ȘI RĂSPUNSURI
Sesiune de Q&A

SLIDE 10: MULȚUMIRI
Vă mulțumim pentru participare!
Contact: [email/telefon]

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

SLIDE 4: KEY CONCEPTS
• Important definitions
• Fundamental principles
• Relevant theories
• Best practices

SLIDE 5: PRACTICAL APPLICATIONS
• Real case studies
• Industry examples
• Hands-on exercises
• Simulations

SLIDE 6: ACTIVITIES
• Teamwork
• Brainstorming
• Role-playing
• Presentations

SLIDE 7: EVALUATION
• Knowledge tests
• Practical exercises
• Peer-to-peer feedback
• Self-assessment

SLIDE 8: RESOURCES
• Additional materials
• Recommended books
• Useful websites
• Online communities

SLIDE 9: Q&A
Questions and Answers Session

SLIDE 10: THANK YOU
Thank you for your participation!
Contact: [email/phone]

PRESENTER NOTES:
- Maintain a dynamic pace
- Encourage active participation
- Use concrete examples
- Adapt content to audience`;
  }
}

function generateFacilitatorContent(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `MANUAL FACILITATOR: ${subject}

PREGĂTIREA CURSULUI

Înainte de curs:
□ Verificați echipamentele tehnice
□ Pregătiți materialele pentru participanți
□ Testați prezentarea
□ Pregătiți activitățile interactive
□ Planificați pauzele

GHID DE FACILITARE

Introducerea (15 minute):
- Salutați participanții
- Prezentați-vă pe scurt
- Explicați obiectivele cursului
- Stabiliți regulile de bază
- Creați o atmosferă relaxată

Concepte fundamentale (45 minute):
- Prezentați teoria pas cu pas
- Folosiți exemple concrete
- Verificați înțelegerea regulat
- Încurajați întrebările
- Adaptați ritmul la audiență

Aplicații practice (60 minute):
- Introduceți studiile de caz
- Formați grupuri de lucru
- Monitorizați progresul
- Oferiți feedback constructiv
- Facilitați discuțiile

MANAGEMENTUL GRUPULUI

Tehnici de facilitare:
• Ascultare activă
• Întrebări deschise
• Reformularea ideilor
• Gestionarea conflictelor
• Încurajarea participării

Situații dificile:
• Participanți dominatori
• Persoane timide
• Întrebări dificile
• Tensiuni în grup
• Probleme tehnice

EVALUAREA PROGRESULUI

Metode de evaluare:
- Observarea comportamentului
- Întrebări de verificare
- Exerciții practice
- Feedback verbal
- Auto-evaluarea participanților

ÎNCHIDEREA CURSULUI

Ultimele 15 minute:
- Rezumați punctele cheie
- Verificați atingerea obiectivelor
- Colectați feedback
- Distribuiți certificatele
- Planificați follow-up-ul

RESURSE PENTRU FACILITATOR

Materiale necesare:
□ Laptop și proiector
□ Flipchart și markere
□ Post-it-uri
□ Materiale printate
□ Certificate de participare

Backup plan:
- Activități alternative
- Exerciții fără tehnologie
- Materiale suplimentare
- Contacte de urgență`;
  } else {
    return `FACILITATOR MANUAL: ${subject}

COURSE PREPARATION

Before the course:
□ Check technical equipment
□ Prepare participant materials
□ Test the presentation
□ Prepare interactive activities
□ Plan breaks

FACILITATION GUIDE

Introduction (15 minutes):
- Greet participants
- Introduce yourself briefly
- Explain course objectives
- Establish ground rules
- Create a relaxed atmosphere

Fundamental concepts (45 minutes):
- Present theory step by step
- Use concrete examples
- Check understanding regularly
- Encourage questions
- Adapt pace to audience

Practical applications (60 minutes):
- Introduce case studies
- Form working groups
- Monitor progress
- Provide constructive feedback
- Facilitate discussions

GROUP MANAGEMENT

Facilitation techniques:
• Active listening
• Open questions
• Idea reformulation
• Conflict management
• Encouraging participation

Difficult situations:
• Dominating participants
• Shy people
• Difficult questions
• Group tensions
• Technical problems

PROGRESS EVALUATION

Evaluation methods:
- Behavior observation
- Verification questions
- Practical exercises
- Verbal feedback
- Participant self-assessment

COURSE CLOSING

Last 15 minutes:
- Summarize key points
- Check objective achievement
- Collect feedback
- Distribute certificates
- Plan follow-up

FACILITATOR RESOURCES

Required materials:
□ Laptop and projector
□ Flipchart and markers
□ Post-it notes
□ Printed materials
□ Participation certificates

Backup plan:
- Alternative activities
- Technology-free exercises
- Additional materials
- Emergency contacts`;
  }
}

function generateParticipantContent(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `MANUAL PARTICIPANT: ${subject}

BINE ATI VENIT!

Acest manual vă va ghida prin cursul de ${subject}. Vă rugăm să îl folosiți pentru a lua notițe și a urmări progresul dvs.

OBIECTIVELE CURSULUI

La sfârșitul acestui curs veți fi capabili să:
□ Înțelegeți conceptele fundamentale
□ Aplicați cunoștințele în practică
□ Rezolvați probleme specifice
□ Evaluați propriul progres

SECȚIUNEA 1: CONCEPTE FUNDAMENTALE

Definiții importante:
_________________________________
_________________________________
_________________________________

Principii de bază:
1. _____________________________
2. _____________________________
3. _____________________________

Notițe personale:
_________________________________
_________________________________
_________________________________

SECȚIUNEA 2: APLICAȚII PRACTICE

Studiul de caz 1:
Situația: ________________________
Soluția propusă: _________________
Rezultate: ______________________

Studiul de caz 2:
Situația: ________________________
Soluția propusă: _________________
Rezultate: ______________________

SECȚIUNEA 3: EXERCIȚII

Exercițiul 1:
Sarcina: _________________________
Răspunsul meu: ___________________
Feedback: _______________________

Exercițiul 2:
Sarcina: _________________________
Răspunsul meu: ___________________
Feedback: _______________________

SECȚIUNEA 4: PLANUL MEU DE ACȚIUNE

Ce voi aplica imediat:
1. _____________________________
2. _____________________________
3. _____________________________

Ce voi dezvolta pe termen lung:
1. _____________________________
2. _____________________________
3. _____________________________

RESURSE SUPLIMENTARE

Cărți recomandate:
• _____________________________
• _____________________________
• _____________________________

Site-uri web utile:
• _____________________________
• _____________________________
• _____________________________

EVALUAREA CURSULUI

Nota generală: ___________________
Cel mai util aspect: ______________
Sugestii de îmbunătățire: _________
_________________________________

CERTIFICATE

Felicitări pentru finalizarea cursului!
Data: ___________________________
Semnătura facilitatorului: ________`;
  } else {
    return `PARTICIPANT MANUAL: ${subject}

WELCOME!

This manual will guide you through the ${subject} course. Please use it to take notes and track your progress.

COURSE OBJECTIVES

By the end of this course you will be able to:
□ Understand fundamental concepts
□ Apply knowledge in practice
□ Solve specific problems
□ Evaluate your own progress

SECTION 1: FUNDAMENTAL CONCEPTS

Important definitions:
_________________________________
_________________________________
_________________________________

Basic principles:
1. _____________________________
2. _____________________________
3. _____________________________

Personal notes:
_________________________________
_________________________________
_________________________________

SECTION 2: PRACTICAL APPLICATIONS

Case study 1:
Situation: _______________________
Proposed solution: _______________
Results: ________________________

Case study 2:
Situation: _______________________
Proposed solution: _______________
Results: ________________________

SECTION 3: EXERCISES

Exercise 1:
Task: ___________________________
My answer: ______________________
Feedback: _______________________

Exercise 2:
Task: ___________________________
My answer: ______________________
Feedback: _______________________

SECTION 4: MY ACTION PLAN

What I will apply immediately:
1. _____________________________
2. _____________________________
3. _____________________________

What I will develop long-term:
1. _____________________________
2. _____________________________
3. _____________________________

ADDITIONAL RESOURCES

Recommended books:
• _____________________________
• _____________________________
• _____________________________

Useful websites:
• _____________________________
• _____________________________
• _____________________________

COURSE EVALUATION

Overall rating: __________________
Most useful aspect: ______________
Improvement suggestions: _________
_________________________________

CERTIFICATE

Congratulations on completing the course!
Date: ___________________________
Facilitator signature: ____________`;
  }
}

function generateActivitiesContent(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `ACTIVITĂȚI ȘI EXERCIȚII: ${subject}

ACTIVITATEA 1: BRAINSTORMING
Timp: 15 minute
Participanți: Toți
Obiectiv: Generarea de idei creative

Instrucțiuni:
1. Formați grupuri de 4-5 persoane
2. Alegeți un moderator pentru fiecare grup
3. Generați cât mai multe idei în 10 minute
4. Prezentați cele mai bune 3 idei (5 minute)

Întrebarea: "Cum putem aplica ${subject} în activitatea noastră zilnică?"

ACTIVITATEA 2: STUDIU DE CAZ
Timp: 30 minute
Participanți: Grupuri de 3-4 persoane
Obiectiv: Aplicarea practică a conceptelor

Scenariul:
O companie din domeniul ${context} se confruntă cu următoarea provocare...
[Descrierea detaliată a situației]

Sarcini:
1. Analizați situația (10 minute)
2. Propuneți soluții (15 minute)
3. Prezentați soluția (5 minute)

ACTIVITATEA 3: ROLE-PLAYING
Timp: 20 minute
Participanți: Perechi
Obiectiv: Exersarea competențelor practice

Roluri:
- Persoana A: Manager/Facilitator
- Persoana B: Angajat/Participant

Scenariul:
Simulați o situație în care trebuie să aplicați principiile învățate...

ACTIVITATEA 4: QUIZ INTERACTIV
Timp: 15 minute
Participanți: Individual
Obiectiv: Verificarea cunoștințelor

Întrebări:
1. Care sunt cele 3 principii fundamentale ale ${subject}?
2. Dați un exemplu de aplicare practică
3. Care sunt principalele provocări în implementare?
4. Cum măsurați succesul?
5. Ce resurse sunt necesare?

ACTIVITATEA 5: PLANUL DE ACȚIUNE
Timp: 25 minute
Participanți: Individual apoi în perechi
Obiectiv: Planificarea implementării

Pași:
1. Identificați 3 obiective SMART (10 minute)
2. Planificați acțiunile concrete (10 minute)
3. Împărtășiți cu partenerul pentru feedback (5 minute)

Template plan de acțiune:
- Obiectiv 1: ________________
- Acțiuni: __________________
- Termen: ___________________
- Resurse: __________________

ACTIVITATEA 6: FEEDBACK 360°
Timp: 20 minute
Participanți: Grupuri de 6 persoane
Obiectiv: Dezvoltarea competențelor de feedback

Proces:
1. Fiecare prezintă o situație (2 minute)
2. Ceilalți oferă feedback constructiv (3 minute)
3. Rotația continuă până toți au prezentat

MATERIALE NECESARE:
□ Flipchart și markere
□ Post-it-uri colorate
□ Cronometru
□ Fișe de evaluare
□ Premii simbolice pentru activități`;
  } else {
    return `ACTIVITIES AND EXERCISES: ${subject}

ACTIVITY 1: BRAINSTORMING
Time: 15 minutes
Participants: Everyone
Objective: Generate creative ideas

Instructions:
1. Form groups of 4-5 people
2. Choose a moderator for each group
3. Generate as many ideas as possible in 10 minutes
4. Present the best 3 ideas (5 minutes)

Question: "How can we apply ${subject} in our daily activities?"

ACTIVITY 2: CASE STUDY
Time: 30 minutes
Participants: Groups of 3-4 people
Objective: Practical application of concepts

Scenario:
A company in the ${context} field faces the following challenge...
[Detailed situation description]

Tasks:
1. Analyze the situation (10 minutes)
2. Propose solutions (15 minutes)
3. Present the solution (5 minutes)

ACTIVITY 3: ROLE-PLAYING
Time: 20 minutes
Participants: Pairs
Objective: Practice practical skills

Roles:
- Person A: Manager/Facilitator
- Person B: Employee/Participant

Scenario:
Simulate a situation where you need to apply the learned principles...

ACTIVITY 4: INTERACTIVE QUIZ
Time: 15 minutes
Participants: Individual
Objective: Knowledge verification

Questions:
1. What are the 3 fundamental principles of ${subject}?
2. Give an example of practical application
3. What are the main implementation challenges?
4. How do you measure success?
5. What resources are needed?

ACTIVITY 5: ACTION PLAN
Time: 25 minutes
Participants: Individual then in pairs
Objective: Implementation planning

Steps:
1. Identify 3 SMART objectives (10 minutes)
2. Plan concrete actions (10 minutes)
3. Share with partner for feedback (5 minutes)

Action plan template:
- Objective 1: _______________
- Actions: __________________
- Deadline: _________________
- Resources: ________________

ACTIVITY 6: 360° FEEDBACK
Time: 20 minutes
Participants: Groups of 6 people
Objective: Develop feedback skills

Process:
1. Each presents a situation (2 minutes)
2. Others provide constructive feedback (3 minutes)
3. Rotation continues until everyone has presented

REQUIRED MATERIALS:
□ Flipchart and markers
□ Colored post-it notes
□ Timer
□ Evaluation sheets
□ Symbolic prizes for activities`;
  }
}

function generateEvaluationContent(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `INSTRUMENTE DE EVALUARE: ${subject}

EVALUARE INIȚIALĂ (PRE-CURS)

Întrebări de evaluare a cunoștințelor:
1. Cât de familiar sunteți cu ${subject}? (1-10)
2. Ce experiență aveți în domeniu?
3. Care sunt așteptările dvs. de la acest curs?
4. Ce provocări întâmpinați în prezent?
5. Cum măsurați succesul în acest domeniu?

EVALUARE CONTINUĂ (DURANTE CURS)

Checkpoint 1 (după 30 minute):
□ Conceptele sunt clare
□ Ritmul este potrivit
□ Exemplele sunt relevante
□ Am întrebări despre: ___________

Checkpoint 2 (după exerciții):
□ Am înțeles aplicațiile practice
□ Pot să aplic cunoștințele
□ Am nevoie de clarificări la: ____
□ Mă simt confortabil cu materialul

EVALUARE FINALĂ (POST-CURS)

Test de cunoștințe:

1. Definiți conceptul principal al ${subject}:
_________________________________

2. Enumerați 3 beneficii ale aplicării acestor principii:
a) ____________________________
b) ____________________________
c) ____________________________

3. Descrieți un scenariu de aplicare practică:
_________________________________
_________________________________

4. Care sunt principalele provocări în implementare?
_________________________________

5. Cum veți măsura progresul dvs.?
_________________________________

EVALUAREA COMPETENȚELOR PRACTICE

Exercițiul practic:
Sarcina: Aplicați principiile învățate într-o situație simulată

Criterii de evaluare:
□ Înțelegerea conceptelor (25%)
□ Aplicarea corectă (25%)
□ Creativitatea soluției (25%)
□ Comunicarea rezultatelor (25%)

Scala de notare:
- Excelent (9-10): Depășește așteptările
- Bun (7-8): Îndeplinește așteptările
- Satisfăcător (5-6): Îndeplinește parțial
- Nesatisfăcător (1-4): Nu îndeplinește

AUTO-EVALUAREA

Reflecție personală:
1. Ce am învățat cel mai important?
_________________________________

2. Cum voi aplica aceste cunoștințe?
_________________________________

3. Ce competențe vreau să dezvolt mai mult?
_________________________________

4. Care este următorul meu pas?
_________________________________

EVALUAREA CURSULUI

Conținutul cursului:
□ Foarte util □ Util □ Parțial util □ Nu prea util

Facilitatorul:
□ Excelent □ Bun □ Satisfăcător □ Nesatisfăcător

Materialele:
□ Foarte bune □ Bune □ Satisfăcătoare □ Slabe

Recomandări:
□ Recomand cu căldură
□ Recomand
□ Recomand cu rezerve
□ Nu recomand

Sugestii de îmbunătățire:
_________________________________
_________________________________

PLANUL DE DEZVOLTARE CONTINUĂ

Obiective pe termen scurt (1-3 luni):
1. ____________________________
2. ____________________________
3. ____________________________

Obiective pe termen lung (6-12 luni):
1. ____________________________
2. ____________________________
3. ____________________________

Resurse pentru dezvoltare:
□ Cărți suplimentare
□ Cursuri avansate
□ Mentoring
□ Practică ghidată
□ Comunități de practică`;
  } else {
    return `EVALUATION TOOLS: ${subject}

INITIAL EVALUATION (PRE-COURSE)

Knowledge assessment questions:
1. How familiar are you with ${subject}? (1-10)
2. What experience do you have in the field?
3. What are your expectations from this course?
4. What challenges are you currently facing?
5. How do you measure success in this domain?

CONTINUOUS EVALUATION (DURING COURSE)

Checkpoint 1 (after 30 minutes):
□ Concepts are clear
□ Pace is appropriate
□ Examples are relevant
□ I have questions about: ________

Checkpoint 2 (after exercises):
□ I understood practical applications
□ I can apply the knowledge
□ I need clarifications on: _______
□ I feel comfortable with the material

FINAL EVALUATION (POST-COURSE)

Knowledge test:

1. Define the main concept of ${subject}:
_________________________________

2. List 3 benefits of applying these principles:
a) ____________________________
b) ____________________________
c) ____________________________

3. Describe a practical application scenario:
_________________________________
_________________________________

4. What are the main implementation challenges?
_________________________________

5. How will you measure your progress?
_________________________________

PRACTICAL SKILLS EVALUATION

Practical exercise:
Task: Apply learned principles in a simulated situation

Evaluation criteria:
□ Concept understanding (25%)
□ Correct application (25%)
□ Solution creativity (25%)
□ Results communication (25%)

Grading scale:
- Excellent (9-10): Exceeds expectations
- Good (7-8): Meets expectations
- Satisfactory (5-6): Partially meets
- Unsatisfactory (1-4): Does not meet

SELF-EVALUATION

Personal reflection:
1. What did I learn that was most important?
_________________________________

2. How will I apply this knowledge?
_________________________________

3. What skills do I want to develop more?
_________________________________

4. What is my next step?
_________________________________

COURSE EVALUATION

Course content:
□ Very useful □ Useful □ Partially useful □ Not very useful

Facilitator:
□ Excellent □ Good □ Satisfactory □ Unsatisfactory

Materials:
□ Very good □ Good □ Satisfactory □ Poor

Recommendations:
□ Highly recommend
□ Recommend
□ Recommend with reservations
□ Do not recommend

Improvement suggestions:
_________________________________
_________________________________

CONTINUOUS DEVELOPMENT PLAN

Short-term objectives (1-3 months):
1. ____________________________
2. ____________________________
3. ____________________________

Long-term objectives (6-12 months):
1. ____________________________
2. ____________________________
3. ____________________________

Development resources:
□ Additional books
□ Advanced courses
□ Mentoring
□ Guided practice
□ Communities of practice`;
  }
}

function generateResourcesContent(subject: string, level: string, audience: string, duration: string, tone: string, context: string, isRomanian: boolean): string {
  if (isRomanian) {
    return `RESURSE SUPLIMENTARE: ${subject}

CĂRȚI RECOMANDATE

Nivel începător:
1. "Introducere în ${subject}" - Autor Principal
   - Concepte de bază explicate simplu
   - Exemple practice din viața reală
   - Exerciții pas cu pas

2. "${subject} pentru toți" - Expert Recunoscut
   - Abordare accesibilă
   - Studii de caz diverse
   - Ghid practic de implementare

Nivel intermediar:
3. "${subject} avansat" - Specialist în domeniu
   - Tehnici sofisticate
   - Analize aprofundate
   - Strategii complexe

4. "Masterizarea ${subject}" - Autoritate în domeniu
   - Perspective inovatoare
   - Cercetări recente
   - Aplicații avansate

RESURSE ONLINE

Site-uri web utile:
• www.${subject.toLowerCase().replace(/\s+/g, '')}.org - Resurse oficiale
• www.${context}academy.com - Cursuri online
• www.expertsin${subject.toLowerCase().replace(/\s+/g, '')}.net - Comunitate de experți

Bloguri și articole:
• Blog-ul ${subject} - Articole săptămânale
• Revista ${context} - Studii de caz lunare
• Newsletter ${subject} Trends - Tendințe și noutăți

Podcasturi:
• "${subject} în practică" - Episoade săptămânale
• "Experți în ${subject}" - Interviuri cu specialiști
• "${context} și ${subject}" - Discuții tematice

CURSURI ȘI CERTIFICĂRI

Cursuri online:
□ ${subject} Fundamentals (40 ore)
□ Advanced ${subject} Techniques (60 ore)
□ ${subject} for ${audience} (30 ore)
□ ${context} ${subject} Specialization (80 ore)

Certificări profesionale:
□ Certified ${subject} Practitioner
□ Advanced ${subject} Specialist
□ ${subject} Master Certification
□ ${context} ${subject} Expert

COMUNITĂȚI ȘI NETWORKING

Grupuri profesionale:
• Asociația ${subject} România
• Grupul LinkedIn "${subject} Professionals"
• Comunitatea Facebook "${subject} în ${context}"

Evenimente și conferințe:
• Conferința Anuală ${subject}
• Workshop-uri lunare ${subject}
• Meetup-uri locale ${subject}
• Webinare săptămânale

INSTRUMENTE ȘI SOFTWARE

Instrumente gratuite:
□ ${subject} Calculator - Calcule rapide
□ ${subject} Planner - Planificare proiecte
□ ${subject} Tracker - Monitorizare progres

Software profesional:
□ ${subject} Pro Suite - Soluție completă
□ Advanced ${subject} Tools - Instrumente avansate
□ ${subject} Analytics - Analiză și raportare

TEMPLATE-URI ȘI MODELE

Documente utile:
□ Template plan de implementare ${subject}
□ Checklist evaluare ${subject}
□ Model raport progres ${subject}
□ Ghid best practices ${subject}

DEZVOLTARE CONTINUĂ

Plan de învățare pe 6 luni:
Luna 1-2: Consolidarea fundamentelor
- Recitirea materialelor cursului
- Aplicarea în proiecte mici
- Participarea la webinare

Luna 3-4: Aprofundarea cunoștințelor
- Citirea unei cărți avansate
- Participarea la workshop-uri
- Networking cu experți

Luna 5-6: Specializarea
- Alegerea unei nișe specifice
- Dezvoltarea unui proiect complex
- Pregătirea pentru certificare

CONTACTE UTILE

Mentori și consultanți:
• Nume Expert 1 - email@expert1.com
• Nume Expert 2 - email@expert2.com
• Nume Consultant - email@consultant.com

Organizații de sprijin:
• Centrul de Excelență ${subject}
• Institutul ${context} ${subject}
• Fundația pentru ${subject}

ACTUALIZĂRI ȘI TENDINȚE

Surse de informații actuale:
□ Newsletter-e specializate
□ Rapoarte anuale din industrie
□ Studii de cercetare recente
□ Analize de piață

Tendințe emergente în ${subject}:
1. Digitalizarea proceselor
2. Automatizarea activităților
3. Integrarea AI și ML
4. Sustenabilitatea și responsabilitatea
5. Personalizarea experiențelor`;
  } else {
    return `ADDITIONAL RESOURCES: ${subject}

RECOMMENDED BOOKS

Beginner level:
1. "Introduction to ${subject}" - Main Author
   - Basic concepts explained simply
   - Real-life practical examples
   - Step-by-step exercises

2. "${subject} for Everyone" - Recognized Expert
   - Accessible approach
   - Diverse case studies
   - Practical implementation guide

Intermediate level:
3. "Advanced ${subject}" - Domain Specialist
   - Sophisticated techniques
   - In-depth analyses
   - Complex strategies

4. "Mastering ${subject}" - Domain Authority
   - Innovative perspectives
   - Recent research
   - Advanced applications

ONLINE RESOURCES

Useful websites:
• www.${subject.toLowerCase().replace(/\s+/g, '')}.org - Official resources
• www.${context}academy.com - Online courses
• www.expertsin${subject.toLowerCase().replace(/\s+/g, '')}.net - Expert community

Blogs and articles:
• ${subject} Blog - Weekly articles
• ${context} Magazine - Monthly case studies
• ${subject} Trends Newsletter - Trends and news

Podcasts:
• "${subject} in Practice" - Weekly episodes
• "${subject} Experts" - Specialist interviews
• "${context} and ${subject}" - Thematic discussions

COURSES AND CERTIFICATIONS

Online courses:
□ ${subject} Fundamentals (40 hours)
□ Advanced ${subject} Techniques (60 hours)
□ ${subject} for ${audience} (30 hours)
□ ${context} ${subject} Specialization (80 hours)

Professional certifications:
□ Certified ${subject} Practitioner
□ Advanced ${subject} Specialist
□ ${subject} Master Certification
□ ${context} ${subject} Expert

COMMUNITIES AND NETWORKING

Professional groups:
• ${subject} Association
• LinkedIn Group "${subject} Professionals"
• Facebook Community "${subject} in ${context}"

Events and conferences:
• Annual ${subject} Conference
• Monthly ${subject} Workshops
• Local ${subject} Meetups
• Weekly webinars

TOOLS AND SOFTWARE

Free tools:
□ ${subject} Calculator - Quick calculations
□ ${subject} Planner - Project planning
□ ${subject} Tracker - Progress monitoring

Professional software:
□ ${subject} Pro Suite - Complete solution
□ Advanced ${subject} Tools - Advanced tools
□ ${subject} Analytics - Analysis and reporting

TEMPLATES AND MODELS

Useful documents:
□ ${subject} implementation plan template
□ ${subject} evaluation checklist
□ ${subject} progress report model
□ ${subject} best practices guide

CONTINUOUS DEVELOPMENT

6-month learning plan:
Month 1-2: Foundation consolidation
- Re-reading course materials
- Application in small projects
- Webinar participation

Month 3-4: Knowledge deepening
- Reading an advanced book
- Workshop participation
- Expert networking

Month 5-6: Specialization
- Choosing a specific niche
- Developing a complex project
- Certification preparation

USEFUL CONTACTS

Mentors and consultants:
• Expert Name 1 - email@expert1.com
• Expert Name 2 - email@expert2.com
• Consultant Name - email@consultant.com

Support organizations:
• ${subject} Center of Excellence
• ${context} ${subject} Institute
• Foundation for ${subject}

UPDATES AND TRENDS

Current information sources:
□ Specialized newsletters
□ Annual industry reports
□ Recent research studies
□ Market analyses

Emerging trends in ${subject}:
1. Process digitalization
2. Activity automation
3. AI and ML integration
4. Sustainability and responsibility
5. Experience personalization`;
  }
}

// Helper function to create and upload file to Supabase Storage
async function createAndUploadFile(
  supabase: any,
  content: string,
  fileName: string,
  format: string
): Promise<string | null> {
  try {
    // Create a simple text file (in a real implementation, you'd create proper DOCX/PPTX files)
    const fileContent = new TextEncoder().encode(content);
    
    // Generate unique file path
    const timestamp = Date.now();
    const filePath = `materials/${timestamp}/${fileName}.${format}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-materials')
      .upload(filePath, fileContent, {
        contentType: format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain',
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

      // Generate content
      const content = generateContent(material.type, metadata);
      
      // Create and upload file
      const storagePath = await createAndUploadFile(
        supabase,
        content,
        material.name,
        material.format
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