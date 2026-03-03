# Project Estimation - FUTURE
Date: 03/05

Version: V2


# Estimation approach
Consider the EZElectronics  project in FUTURE version (as proposed by your team in requirements V2), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch (not from V1)
# Estimate by size
### 
|             | Estimate                        |             
| ----------- | ------------------------------- |  
| NC =  Estimated number of classes to be developed   |   32 (numero di classi che si svilupperebbero )                        |             
|  A = Estimated average size per class, in LOC       |   60 (media delle linee di codice)                       | 
| S = Estimated size of project, in LOC (= NC * A) | 1920| 
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)  | 192                                  |   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro) | 5760 | 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) |  6 person day                   |               

# Estimate by product decomposition
### 
|         component name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
|requirement document    | 25 |
| GUI prototype | 20 |
|design document | 29 |
|code | 192|
| unit tests |36|
| api tests | 20 |
| management documents  |20|



# Estimate by activity decomposition
### 
|         Activity name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
| Definizione stakeholders| 2 |
| Context Diagram e Interfacce| 3 |
| Stories and Personas| 3 |
| Functional requirements| 9 |
| Non Functional requirements| 6 |
| Use Case and Scenario | 15 |
| Use Case Diagram| 6 |
| Glossario | 6 |
| Access Table| 1 |
| System Design| 2 |
| Deployment Diagram| 2  |
| GUI Autenticazione e Registrazione | 5 |
| GUI Pagina Principale cliente e manager| 8 |
| GUI Gestione Prodotti| 5  |
| GUI Gestione Utenti | 4 |
| GUI Carrello e Cronologia| 4 |
| GUI Recensione | 4|
| GUI Pagamento e Consegna| 3|
| Analisi dei requisiti | 8 |
| Definizione architettura di sistema| 20 |
| Scrittura design document| 9 |
| Definizione ambiente di sviluppo| 6 |
| Scrittura codice| 100 |
| Revisione codice |40 |
| Debugging e risoluzione errori|  25|
| Scrittura test| 20 |
| Esecuzione test | 7 |
| Risoluzione errori test | 12 |
| Riprovare i test | 7|
| Scrittura test case API| 12 |
| Esecuzione test e analisi risultati| 5 |
| Debugging e risoluzione errori| 8 |
| Creazione piani di progetto e schedule| 8 |
| Decisioni e modalità di implementazione| 6 |
| Aggiornamento documenti del progetto|6 |


###
Insert here Gantt chart with above activities

![GanttV2](./Immagini/Estimation/GanttV2.png)

Il Gantt diagram è stato rappresentato considerando il lavoro di una persona, in base alle attività precedentemenete indicate

# Summary

Report here the results of the three estimation approaches. The  estimates may differ. Discuss here the possible reasons for the difference

|             | Estimated effort                        |   Estimated duration |          
| ----------- | ------------------------------- | ---------------|
| estimate by size | 192 person hour|  6 person days -> 1 settimana e 1 giorno lavorativo |
| estimate by product decomposition | 342 person hour | 10.68 person day -> 2 settimane e 1 giorno lavorativi |
| estimate by activity decomposition | 387 person hour| 12,09 person day -> 2 settimane e 3 giorni lavorativi |

Le tre stime presentano differenze abbastanza importanti, specialmente tra l'estimation by size e le altre estimation.
L'estimation by size è stata realizzando considerando tutte le classi che devono essere realizzate per gestire le feature importanti, gli errori e le funzionalità in generale. Tale estimation considera solamente le linee di codice e non il processo di analisi dei requisiti e le varie fasi di idealizzazione.
Sono state considerate le 27 classi del V2 + un component, un controller, un dao, un error and un router class per la recenzione.
L'estimation by product decomposition è una stima più dettagliata poichè va a considerare le varie fasi del progetto. Le varie fasi possono mostrare informazioni riguardo la gestione delle singole sezioni in maniera più precisa e con enfasi anche su eventuali problemi che si hanno in fase di sviluppo.
L'estimation by activity decomposition è la stima più dettagliata. Presenta la stima in person hour di ogni singola attività, con eventuali ritardi a causa dei vari test da rifare e problemi da risolvere. 






