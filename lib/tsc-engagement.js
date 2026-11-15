// Pure policy for consent, topic matching and learning. Opens and redirect GETs are not intent.
import { PROCEDURES, procedureLabel } from './tsc-catalog.js';
import { procedureContext } from './tsc-procedure-context.js';
const IDS = new Set(PROCEDURES.map(p => p.id));
export const CONSENT_VERSION = 'daily-topics-2026-11-15';
export const STAGES = ['exploring', 'comparing', 'consult'];
export const TOPIC_LIMIT = 8;
export function selectedTopics(a) {
 const raw = Array.isArray(a.topics) ? a.topics : a.ingreep ? [a.ingreep] : [];
 return [...new Set(raw.filter(id => IDS.has(id) || id === 'all'))].slice(0, TOPIC_LIMIT);
}
export function signupPreferences(b) {
 const topics = selectedTopics(b);
 if (!topics.length) return { ok:false, fout:'topics' };
 if (b.consent !== true) return { ok:false, fout:'consent' };
 return { ok:true, topics, ingreep:topics[0], frequency:b.frequency === 'changes' ? 'changes' : 'daily', stage:STAGES.includes(b.stage) ? b.stage : null, learn:b.learn === true, consent_version:CONSENT_VERSION };
}
export function matchesTopics(it, a) {
 const topics = selectedTopics(a), tags = it.ingreep || ['*'];
 return topics.includes('all') || tags.some(id => id === '*' || topics.includes(id));
}
export function dueToday(a, day, news) {
 if (!a?.actief || a.laatst === day) return false;
 // Legacy subscribers retain their changes-only consent.
 return a.frequency === 'daily' && a.consent_version === CONSENT_VERSION || news.length > 0;
}
export function warmth(a) {
 return { stage: STAGES.includes(a.stage) ? a.stage : 'unknown', basis:'self_declared', updated_at:a.stage_at || null, consult_request:false, clinical_suitability:null };
}
export function experimentVerdict(aSeen, aYes, bSeen, bYes) {
 const n1=Number(aSeen)||0,n2=Number(bSeen)||0,x1=Number(aYes)||0,x2=Number(bYes)||0;
 if(n1<200||n2<200||x1+x2<30||x1>n1||x2>n2) return {winner:null,reason:'insufficient_sample'};
 const p=(x1+x2)/(n1+n2),se=Math.sqrt(p*(1-p)*(1/n1+1/n2)),difference=x2/n2-x1/n1,z=se?Math.abs(difference)/se:0;
 return {winner:z>=2.58?(difference>0?'B':'A'):null,reason:z>=2.58?'99_percent_comparison':'no_clear_difference',rates:{A:x1/n1,B:x2/n2},z};
}
export function learningCohort(a) { return (a.taal || 'en')+':'+(selectedTopics(a)[0] || 'all'); }
export function dailyLesson(a, day) {
 const language=['nl','de'].includes(a.taal)?a.taal:'en',topics=selectedTopics(a), topic=topics.includes('all') ? PROCEDURES[0].id : topics[(Math.floor(Date.parse(day+'T00:00:00Z')/864e5))%topics.length];
 const labels={nl:['Wie behandelt je?','Wat zegt een review?','Wat kost het hele traject?','Wie helpt tijdens je herstel?','Welke keuze past bij jou?','Welke alternatieven zijn er?','Wat wil je in het consult weten?'],en:['Who will treat you?','What does a review tell you?','What does the whole journey cost?','Who helps during recovery?','Which choice fits you?','What are the alternatives?','What should you ask at the consultation?'],de:['Wer behandelt Sie?','Was sagt eine Bewertung aus?','Was kostet der gesamte Ablauf?','Wer hilft bei der Erholung?','Welche Wahl passt zu Ihnen?','Welche Alternativen gibt es?','Was möchten Sie in der Beratung wissen?']};
 const lessons={nl:['Vraag de naam van je eigen behandelaar, diens actuele registratie en ervaring met deze ingreep. Een naam op de klinieksite bevestigt nog niet wie jou behandelt.','Lees recente positieve én kritische ervaringen. Controleer over welke arts, locatie en behandeling ze gaan. Een hoge ervaringsscore bewijst geen veiligheid of beter behandelresultaat.','Vraag één gespecificeerde offerte: behandeling, anesthesie, controles, medicijnen, verblijf en mogelijk extra herstel of vervolgbehandeling.','Vraag wie je na thuiskomst bereikt, wie complicaties beoordeelt en wie extra behandeling betaalt. Laat het plan schriftelijk vastleggen.','Noteer wat voor jou telt: gewenst resultaat, herstel, afstand, kosten en vragen. Je mag besluiten nog te wachten of geen behandeling te kiezen.','Vraag je behandelaar naar alternatieven, inclusief afwachten, en naar de voor- en nadelen voor jouw situatie. De website kan je medische geschiktheid niet bepalen.','Maak vooraf een korte vragenlijst en neem iemand mee als je dat prettig vindt. Beslis pas wanneer je de antwoorden begrijpt.'],en:['Ask for your treating doctor’s name, current registration and experience with this procedure. A published staff name does not confirm who will treat you.','Read recent positive and critical experiences. Check which doctor, location and treatment they concern. A high experience score does not prove safety or better clinical outcomes.','Request one itemised quote covering treatment, anaesthesia, check-ups, medicines, accommodation and possible extra recovery or follow-up treatment.','Ask who is reachable after you return home, who assesses complications and who pays for further treatment. Get the plan in writing.','Write down what matters: your hoped-for outcome, recovery, travel, cost and unanswered questions. Waiting or choosing no treatment remains an option.','Ask your clinician about alternatives, including waiting, and the advantages and disadvantages in your circumstances. The website cannot determine medical suitability.','Prepare a short question list and bring someone if useful. Decide when you understand the answers.'],de:['Fragen Sie nach dem Namen, der aktuellen Registrierung und der Erfahrung Ihres behandelnden Arztes. Ein veröffentlichter Name bestätigt noch nicht, wer Sie behandelt.','Lesen Sie aktuelle positive und kritische Erfahrungen. Prüfen Sie Arzt, Standort und Behandlung. Eine hohe Erfahrungsbewertung beweist weder Sicherheit noch bessere Behandlungsergebnisse.','Fordern Sie einen aufgeschlüsselten Kostenvoranschlag für Behandlung, Anästhesie, Kontrollen, Medikamente, Aufenthalt und mögliche Nachbehandlung an.','Fragen Sie, wer nach der Heimkehr erreichbar ist, Komplikationen beurteilt und weitere Behandlungen bezahlt. Lassen Sie den Plan schriftlich festhalten.','Notieren Sie Ihre Ziele und offenen Fragen zu Erholung, Reise und Kosten. Abwarten oder keine Behandlung bleiben mögliche Entscheidungen.','Fragen Sie nach Alternativen einschließlich Abwarten und deren Vor- und Nachteilen. Die Website kann Ihre medizinische Eignung nicht bestimmen.','Bereiten Sie eine kurze Fragenliste vor und nehmen Sie bei Bedarf jemanden mit. Entscheiden Sie, wenn Sie die Antworten verstehen.']};
 const i=(Math.floor(Date.parse(day+'T00:00:00Z')/864e5)+(a.stage==='comparing'?2:a.stage==='consult'?4:0))%7;
 const context=procedureContext(topic,language);
 if(context&&i%2===0)return {id:'lesson-'+day+'-'+topic,topic,label:procedureLabel(topic,language),title:context.questions[Math.floor(i/2)%context.questions.length],text:{nl:'Neem deze vraag mee naar je eigen behandelaar. Noteer het antwoord en wat je nog wilt begrijpen vóór je beslist.',en:'Take this question to your own clinician. Write down the answer and what you still need to understand before deciding.',de:'Besprechen Sie diese Frage mit Ihrem behandelnden Arzt. Notieren Sie die Antwort und offene Punkte vor Ihrer Entscheidung.'}[language],source:context.source,not_news:true};
 return {id:'lesson-'+day+'-'+topic,topic,label:procedureLabel(topic,language),title:labels[language][i],text:lessons[language][i],source:'https://www.nhs.uk/tests-and-treatments/cosmetic-procedures/advice/choosing-who-will-do-your-procedure/',not_news:true};
}
