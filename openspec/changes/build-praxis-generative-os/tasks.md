## 1. Repository Setup And Guardrails

- [x] 1.1 Inizializzare Git nel progetto, creare il branch `main`, creare il branch `prebuild`, e creare il repository GitHub remoto per Praxis
- [x] 1.2 Creare `.gitignore` iniziale includendo almeno `.env`, `.env.*`, `node_modules/`, output di build, file temporanei e verificare che `.env` non sia tracciato
- [x] 1.3 Creare un `README.md` iniziale che descriva Praxis, la distinzione PRE-BUILD vs CORE e il requisito che le chiavi API restino solo nel backend
- [x] 1.4 Aggiungere una regola operativa al flusso di lavoro del progetto: prima di ogni commit verificare che `.gitignore` protegga `.env` e che nessuna chiave API o secret sia staged
- [x] 1.5 Verificare che la cartella `openspec/` sia versionata insieme agli artifact del change come prova del processo di sviluppo
- [x] 1.6 Dopo il completamento di ciascun task eseguire un commit atomico con conventional commit, usando prefisso `[prebuild]` per i task di scaffolding e `[core]` per i task hackathon
- [ ] 1.7 Creare il commit marcatore vuoto `"[core] HACKATHON START"` con `git commit --allow-empty` all'inizio del lavoro CORE
- [ ] 1.8 Creare il commit marcatore vuoto `"[core] HACKATHON END"` con `git commit --allow-empty` alla chiusura del lavoro CORE

## 2. PRE-BUILD Shell Foundations

- [x] 2.1 Inizializzare l'app frontend con React, Vite, TypeScript e TailwindCSS, definendo una struttura component-based coerente con shell, finestre, panel e runtime
- [x] 2.2 Implementare il layout full-screen della shell Praxis con desktop dark navy, top bar con logo Praxis e prompt bar centrata in basso con il copy MVP richiesto
- [x] 2.3 Definire il linguaggio visivo tech-magic con gradienti cyan-violet, tipografia, superfici e token CSS/Tailwind riutilizzabili
- [x] 2.4 Creare il design system Praxis con classi condivise come `.praxis-btn`, `.praxis-card`, `.praxis-input`, `.praxis-display` e relative linee guida d'uso

## 3. PRE-BUILD Windowing And Runtime Scaffold

- [x] 3.1 Modellare lo stato del window manager per id finestra, titolo, bounds, z-index, stato minimizzato, stato generazione e contenuto HTML
- [x] 3.2 Implementare componenti finestra con titolo, controlli minimizza/chiudi, focus, drag e resize in modo stabile sia su desktop che su viewport ridotti
- [x] 3.3 Implementare il runtime delle app generate tramite `iframe srcdoc` sandboxato senza iniettare HTML generato nel DOM della shell
- [x] 3.4 Aggiungere una pipeline mock di generazione che crei una finestra app e mostri una progressione visiva di scrittura anche senza provider reale
- [x] 3.5 Definire il contratto dati frontend per richieste utente, spec interpretata, documento HTML generato e storico errori/fix

## 4. PRE-BUILD Backend And Comparison Scaffold

- [ ] 4.1 Inizializzare il backend Node/Express con struttura minima, configurazione ambiente e separazione chiara fra API server e client
- [ ] 4.2 Implementare un placeholder di `callModel({ role, messages, stream })` che legga provider e model da variabili d'ambiente ma possa restituire risposte mock in assenza di integrazione reale
- [ ] 4.3 Definire endpoint backend stub per interpretazione, build e fix che rispettino gia' il contratto multi-ruolo senza dipendere da provider live
- [ ] 4.4 Implementare il pannello `Speed Compare` nella shell con layout finale e dati placeholder per provider veloce vs provider lento
- [ ] 4.5 Verificare il flusso PRE-BUILD end-to-end: prompt mock -> finestra generata -> iframe visibile -> pannello Speed renderizzato

## 5. CORE Prompting And Provider Integration

- [ ] 5.1 Scrivere i system prompt reali per i ruoli INTERPRETER, BUILDER e FIXER, includendo il vincolo di usare obbligatoriamente il design system Praxis nel codice generato
- [ ] 5.2 Collegare `callModel({ role, messages, stream })` a un endpoint OpenAI-compatible reale con provider/model configurabili da environment per Cerebras o GLM
- [ ] 5.3 Implementare la normalizzazione backend delle risposte provider e la gestione sicura degli errori senza esporre chiavi o dettagli sensibili al client
- [ ] 5.4 Implementare streaming reale del BUILDER fino alla UI, rendendo visibile a schermo l'effetto "l'app si scrive da sola"

## 6. CORE Multi-Agent Generation Flow

- [ ] 6.1 Collegare il submit della prompt bar al ruolo INTERPRETER e validare che l'output sia una spec JSON strutturata e riusabile
- [ ] 6.2 Collegare l'output dell'INTERPRETER al ruolo BUILDER e renderizzare gli aggiornamenti incrementali in una finestra app dedicata
- [ ] 6.3 Implementare la logica FIXER per ricevere HTML piu' contesto errore e sostituire il documento della finestra con una versione corretta
- [ ] 6.4 Aggiungere controlli di validazione minima sul documento HTML generato prima di marcarlo come completato nel runtime

## 7. CORE Speed Compare And Multimodality

- [ ] 7.1 Misurare token/s o metrica equivalente per il provider veloce e quello lento durante chiamate reali e collegare i dati al pannello `Speed Compare`
- [ ] 7.2 Aggiornare il pannello `Speed Compare` per distinguere chiaramente dati live da placeholder e mostrare eventuali stati di caricamento o errore
- [ ] 7.3 Se il provider scelto lo consente, implementare drag-and-drop di screenshot e il passaggio multimodale al ruolo INTERPRETER
- [ ] 7.4 Definire un fallback text-only che mantenga operativo il flusso MVP quando la multimodalita' non e' disponibile o fallisce

## 8. Validation And Demo Readiness

- [ ] 8.1 Verificare che shell, window manager, prompt flow e iframe funzionino correttamente su desktop e su viewport mobile/ridotta senza rotture evidenti
- [ ] 8.2 Verificare che nessuna chiave API, file `.env` o secret sia tracciato o incluso nei commit prima della condivisione del repository
- [ ] 8.3 Eseguire una demo completa con almeno un'app generata, un caso di fix, e una visualizzazione del pannello `Speed Compare`
- [ ] 8.4 Aggiornare README e documentazione operativa con setup locale, variabili richieste, branch strategy e istruzioni per demo/hackathon
