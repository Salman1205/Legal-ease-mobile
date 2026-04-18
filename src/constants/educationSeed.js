// Local seed data for Learning / Education section — used when the Python
// backend is unreachable OR returns empty, so the UI is never blank.
// Shape matches /api/education/courses and /api/education/library responses.

export const SEED_COURSES = [
    {
        id: 'pk-crpc-arrest-bail',
        category: 'Criminal Law',
        level: 'beginner',
        law_name: 'Code of Criminal Procedure, 1898',
        title: 'Arrest & Bail Rights Under Pakistani Law',
        desc: 'Know exactly what the police can and cannot do, when you are entitled to bail, and how to apply for it.',
        overview:
            'The Code of Criminal Procedure, 1898 (CrPC) governs arrest, investigation, and bail in Pakistan. This course walks you through your rights at every stage — from the moment of arrest to release on bail — with references to the exact sections and landmark case law.',
        key_topics: [
            'Powers of arrest (Sections 46, 54, 55 CrPC)',
            'Rights of an arrested person (Article 10 of the Constitution)',
            'Bailable vs non-bailable offences',
            'Anticipatory bail under Section 498-A',
            'Remand and the 14-day rule',
        ],
        hours: 1.5,
        lessons: [
            {
                index: 0,
                title: 'When can police arrest you without a warrant?',
                summary: 'Section 54 CrPC and the cognizable-offence framework explained in plain language.',
                content:
                    'Under Section 54 of the Code of Criminal Procedure, 1898, a police officer may arrest any person without a warrant if that person is reasonably suspected of a cognizable offence (serious offences like murder, robbery, rape, kidnapping). For non-cognizable offences — including most defamation, public-nuisance, and minor assault cases — the officer MUST first obtain a warrant from a magistrate. The moment of arrest triggers Article 10 of the Constitution: the arrestee must be informed of the grounds of arrest as soon as possible and produced before a magistrate within 24 hours.',
                key_points: [
                    'Cognizable offences allow warrantless arrest; non-cognizable do not.',
                    'Article 10 guarantees you must be told the grounds of arrest.',
                    'You must be produced before a magistrate within 24 hours.',
                    'You have the right to consult a lawyer of your choice immediately.',
                ],
            },
            {
                index: 1,
                title: 'Bailable vs non-bailable offences',
                summary: 'Why bail is a right in some cases and a court discretion in others.',
                content:
                    'Schedule II of the CrPC classifies every offence as bailable or non-bailable. In a bailable offence (e.g., simple hurt under Section 337-A(i) PPC), bail is a matter of RIGHT — the police or court MUST release you on furnishing surety. In a non-bailable offence (e.g., murder under Section 302 PPC), bail is a matter of DISCRETION and the court weighs factors like prima-facie evidence, likelihood of tampering, and whether you are a flight risk. Section 497 CrPC is the key provision for bail in non-bailable cases.',
                key_points: [
                    'Bailable offence: bail as of right (Section 496 CrPC).',
                    'Non-bailable offence: bail at court discretion (Section 497 CrPC).',
                    'Further-inquiry bail (497(2)) if evidence is weak at prima-facie stage.',
                    'Women, minors under 16, and the sick/infirm get favourable treatment.',
                ],
            },
            {
                index: 2,
                title: 'Anticipatory (pre-arrest) bail',
                summary: 'Applying for bail BEFORE arrest under Section 498-A CrPC.',
                content:
                    'Section 498-A allows a person who apprehends arrest in a non-bailable offence to approach the High Court or Sessions Court for "pre-arrest bail". The court looks at whether the FIR shows mala fide intent, whether the applicant is cooperating with the investigation, and whether there is any evidence of tampering. The landmark case Khalid Javed v. State (PLD 2003 SC 396) sets out the test courts still apply today.',
                key_points: [
                    'File in Sessions Court first; High Court is an alternative forum.',
                    'Show mala fides, improbability of the charge, or humiliating arrest.',
                    'Bail is confirmed or cancelled on a short-date hearing.',
                    'Breach of conditions (e.g., tampering) leads to immediate cancellation.',
                ],
            },
        ],
    },
    {
        id: 'pk-family-khula',
        category: 'Family Law',
        level: 'intermediate',
        law_name: 'Muslim Family Laws Ordinance, 1961',
        title: 'Khula & Divorce Procedure in Pakistan',
        desc: 'The exact steps, documents, and timelines for a woman seeking khula through the Family Court.',
        overview:
            'Pakistani family law gives women the right to dissolve marriage through khula, even without the husband\'s consent. This course covers filing procedure, iddat, dower recovery, and post-dissolution rights.',
        key_topics: [
            'Grounds for khula under Dissolution of Muslim Marriages Act, 1939',
            'Family Court jurisdiction',
            'Iddat period and its legal consequences',
            'Dower (haq mehr) recovery',
            'Child custody (Guardian & Wards Act, 1890)',
        ],
        hours: 1.25,
        lessons: [
            {
                index: 0,
                title: 'The right to khula — legal basis',
                summary: 'Khula is a constitutional and Quranic right, not a favour.',
                content:
                    'The Federal Shariat Court in Mst. Khurshid Bibi v. Baboo Muhammad Amin (PLD 1967 SC 97) established that a Muslim woman has an unqualified right to dissolve her marriage through khula where the matrimonial bond has broken down, even if the husband does not consent. The Family Court decides khula petitions under the Family Courts Act, 1964.',
                key_points: [
                    'Khula does not require the husband\'s consent.',
                    'File in the Family Court where the wife resides.',
                    'The court must attempt reconciliation first (Section 10 Family Courts Act).',
                    'Decree of khula is followed by issuance to Union Council for Talaq-e-Khula registration.',
                ],
            },
            {
                index: 1,
                title: 'Filing a khula petition — step by step',
                summary: 'Documents, court fee, and hearing timeline.',
                content:
                    'A khula petition is filed under the Family Courts Act, 1964. Required documents: Nikahnama, CNIC copies, list of dower/dowry articles, and a statement of facts. Court fee is nominal. The Family Court issues summons to the husband, holds pre-trial reconciliation, and if failed, records evidence and decrees khula. Typical timeline: 3–9 months.',
                key_points: [
                    'Attach original or certified Nikahnama.',
                    'List all dower (haq mehr) and dowry articles for recovery.',
                    'Pre-trial reconciliation is mandatory — failure is recorded.',
                    'Decree is sent to Union Council; iddat runs from decree date.',
                ],
            },
        ],
    },
    {
        id: 'pk-property-transfer',
        category: 'Property Law',
        level: 'beginner',
        law_name: 'Transfer of Property Act, 1882',
        title: 'Buying Property Safely in Pakistan',
        desc: 'Verify title, avoid frauds, and complete transfer legally — from Fard to Registry.',
        overview:
            'Property fraud is the single most-litigated civil matter in Pakistan. This course walks you through title verification, sale deed drafting, registration, and post-transfer mutation in the land record (Patwari/Tehsildar).',
        key_topics: [
            'Fard-e-Malkiat verification',
            'Token money vs bayana (earnest money)',
            'Sale deed and registration (Registration Act, 1908)',
            'Mutation (intiqal) in revenue record',
            'Stamp duty and CVT',
        ],
        hours: 2,
        lessons: [
            {
                index: 0,
                title: 'Verifying title before you pay',
                summary: 'Get the Fard, run encumbrance checks, and confirm boundaries.',
                content:
                    'Before handing over any money, obtain a Fard-e-Malkiat (extract from the Record of Rights) from the Patwari. Cross-check the seller\'s name on CNIC, confirm khasra numbers and area, and get a boundary verification from the Tehsildar. For urban property, check the Excise & Taxation record and the housing society\'s NDC (No Demand Certificate).',
                key_points: [
                    'Fard from Patwari must match seller\'s CNIC exactly.',
                    'Check for mortgages, attachments, or pending litigation.',
                    'For DHA/Bahria etc., get an NDC and transfer letter.',
                    'Never pay more than 10% as bayana before title verification.',
                ],
            },
            {
                index: 1,
                title: 'Stamp duty, registration, and mutation',
                summary: 'The three taxes and filings that complete a legal transfer.',
                content:
                    'A sale deed must be (1) drafted on stamp paper of the correct denomination — currently around 3% of DC value in most provinces, (2) registered at the Sub-Registrar\'s office under the Registration Act, 1908, and (3) followed by mutation (intiqal) in the revenue record. Skipping mutation is the single biggest mistake — without it, the Patwari record still shows the old owner and the new buyer cannot sell, mortgage, or inherit without reopening the case.',
                key_points: [
                    'Stamp duty varies by province — verify current rate.',
                    'Sub-Registrar requires both parties in person with CNICs and witnesses.',
                    'Mutation must be recorded in Jamabandi and signed by Tehsildar.',
                    'Keep certified copies of the sale deed, registration receipt, and mutation order.',
                ],
            },
        ],
    },
    {
        id: 'pk-labor-termination',
        category: 'Labour Law',
        level: 'beginner',
        law_name: 'Industrial & Commercial Employment (Standing Orders) Ordinance, 1968',
        title: 'Unfair Dismissal & Employee Rights',
        desc: 'Know when a termination is illegal and how to claim reinstatement or compensation.',
        overview:
            'Pakistani labour law offers strong protections for permanent workers. This course covers the definition of "workman", grounds for valid termination, notice periods, gratuity, and the NIRC (National Industrial Relations Commission) forum.',
        key_topics: [
            'Definition of workman (Section 2 IRA 2012)',
            'Valid vs invalid grounds for termination',
            'Notice period and pay in lieu',
            'Gratuity and provident fund',
            'Filing before Labour Court / NIRC',
        ],
        hours: 1,
        lessons: [
            {
                index: 0,
                title: 'Are you a "workman" under the law?',
                summary: 'Only workmen get the full protection of Standing Orders.',
                content:
                    'Standing Order 1(iii) defines a "workman" as any person employed in an industrial or commercial establishment on terms of monthly wages — with explicit exclusions for supervisory roles earning above a threshold. Managers, HR heads, and senior executives are typically outside the definition and fall back on contract terms. For workmen, Standing Order 12 governs termination and requires one month\'s notice or pay in lieu, plus gratuity at one month\'s wage per completed year of service.',
                key_points: [
                    'Workmen get Standing Order protection; non-workmen rely on contract.',
                    'One month\'s notice or pay in lieu is mandatory for workmen.',
                    'Gratuity = last drawn wage × years of service (min 1 year).',
                    'Termination without reason is presumptively illegal.',
                ],
            },
            {
                index: 1,
                title: 'Valid vs invalid grounds for termination',
                summary: 'Misconduct, redundancy, and the defined list of permissible grounds.',
                content:
                    'Standing Order 15 lists the specific misconduct grounds that justify dismissal: habitual absence, wilful insubordination, theft/fraud, habitual neglect of work, strike in contravention of law, and similar. For any of these, the employer must issue a show-cause notice, give the worker a fair hearing, and record a reasoned inquiry report. Economic redundancy is also permissible but triggers retrenchment compensation of 30 days\' wage per year of service under Standing Order 12 and the IRA 2012. Any termination without notice AND without a valid ground recorded in writing is "colourable" and reversible.',
                key_points: [
                    'Misconduct dismissal requires a show-cause notice and a recorded inquiry.',
                    'Redundancy needs retrenchment compensation (≈30 days\' wage per year).',
                    'Last in, first out (LIFO) is the default retrenchment rule.',
                    'Re-employment preference applies if the employer rehires within a year.',
                ],
            },
            {
                index: 2,
                title: 'Filing before the Labour Court / NIRC',
                summary: 'Forum, limitation, and typical reliefs.',
                content:
                    'For provincial-scope workers, grievance petitions are filed before the Labour Court under the provincial Industrial Relations Act. For trans-provincial establishments, the forum is the National Industrial Relations Commission (NIRC). Limitation is 30 days from the date of the impugned order (extendable for sufficient cause). The court can order reinstatement with back wages, compensation in lieu, or modify the penalty. Appeals from the Labour Court lie to the Labour Appellate Tribunal; from NIRC, to its Full Bench and then the High Court.',
                key_points: [
                    'Limitation is 30 days — act fast on termination letters.',
                    'Reinstatement + back wages is the flagship remedy.',
                    'NIRC covers trans-provincial, Labour Court covers provincial-scope.',
                    'Appeal rights are statutory — check the specific Act in your province.',
                ],
            },
        ],
    },
    {
        id: 'pk-consumer-rights',
        category: 'Consumer Law',
        level: 'beginner',
        law_name: 'Punjab Consumer Protection Act, 2005 (and provincial equivalents)',
        title: 'Consumer Rights: Refunds, Warranties & Complaints',
        desc: 'File a consumer complaint, recover your money for defective goods, and get damages.',
        overview:
            'Each province has its own Consumer Protection Act with a dedicated Consumer Court that hears cases quickly. This course covers grounds, procedure, and typical awards.',
        key_topics: [
            'Defective goods and deficient services',
            'Misleading advertisements',
            'Filing before Consumer Court',
            'Damages and compensation awards',
            'Limitation period (usually 30 days from cause of action)',
        ],
        hours: 0.75,
        lessons: [
            {
                index: 0,
                title: 'When to file a consumer complaint',
                summary: 'Grounds, forum, and timeline.',
                content:
                    'You can file a consumer complaint if goods are defective, services are deficient, an advertisement is misleading, or a seller refuses refund within a promised window. In Punjab, the limitation is 30 days from the cause of action (Section 28). Complaints are filed with the District Consumer Court, court fee is nominal, and courts typically decide within 6 months. Typical remedies: refund, replacement, removal of defects, and compensation (including for mental agony).',
                key_points: [
                    'Keep the invoice, warranty card, and all correspondence.',
                    'File within 30 days (Punjab); check your province\'s limit.',
                    'Consumer Court fee is nominal — no lawyer strictly required.',
                    'Compensation can include mental agony and punitive damages.',
                ],
            },
            {
                index: 1,
                title: 'Drafting the complaint & evidence checklist',
                summary: 'What to attach, what to prove, and how to quantify.',
                content:
                    'A persuasive consumer complaint contains: (1) identities of complainant and respondent with CNIC/registration numbers; (2) the transaction record — invoice, contract, advertisement; (3) a chronology showing defect, intimation, and refusal; (4) expert or lab evidence of the defect if it is technical (food contamination, electronics failure); (5) quantified loss — purchase price, repair estimate, and consequential damages like missed work or mental agony; (6) the specific relief sought. The Consumer Court is empowered to appoint its own expert if the parties dispute the defect. Under Section 29 (Punjab), the court may award compensation without proof of actual damage where the seller\'s conduct is egregious.',
                key_points: [
                    'Attach invoice, warranty card, photos, and expert reports.',
                    'Quantify loss — vague prayers reduce awards.',
                    'Section 29 allows compensation for mental agony absent specific proof.',
                    'Seller\'s refusal to refund within promised time is itself actionable.',
                ],
            },
            {
                index: 2,
                title: 'Appeal and enforcement of the decree',
                summary: 'What happens after you win — and if the seller stalls.',
                content:
                    'A Consumer Court decree is executable like a civil decree. If the respondent appeals (to the District Judge in Punjab), execution is not automatically stayed — you may press for deposit of the decretal amount as a precondition. On non-compliance, the court can attach bank accounts, property, and order arrest in execution. Chronic non-compliance exposes the respondent to contempt under Section 35 of the Punjab Act. For repeat offenders (sellers with a pattern of complaints), the regulator may be informed under the trading licence framework.',
                key_points: [
                    'Decree is enforceable like a civil decree — attachment, arrest available.',
                    'Appeal does not stay execution automatically — ask for deposit.',
                    'Repeat offenders risk trading licence action by the regulator.',
                    'Non-compliance attracts contempt — separate punishment.',
                ],
            },
        ],
    },
    {
        id: 'pk-constitution-fundamental',
        category: 'Constitutional Law',
        level: 'intermediate',
        law_name: 'Constitution of Pakistan, 1973 — Chapter 1 (Articles 8–28)',
        title: 'Your Fundamental Rights in Pakistan',
        desc: 'The constitutional guarantees every Pakistani has — and how to enforce them in the High Court.',
        overview:
            'Chapter 1 of Part II of the Constitution contains the Fundamental Rights. This course introduces each right and the writ jurisdiction of the High Courts under Article 199.',
        key_topics: [
            'Right to life (Article 9)',
            'Safeguards as to arrest and detention (Article 10)',
            'Right to fair trial (Article 10-A)',
            'Freedom of speech and information (Articles 19, 19-A)',
            'Writ jurisdiction (Article 199)',
        ],
        hours: 1.5,
        lessons: [
            {
                index: 0,
                title: 'Article 10-A: The right to fair trial',
                summary: 'Inserted by the 18th Amendment — a game-changer.',
                content:
                    'Article 10-A, inserted by the 18th Constitutional Amendment in 2010, guarantees that "for the determination of his civil rights and obligations or in any criminal charge against him a person shall be entitled to a fair trial and due process". The Supreme Court has repeatedly used Article 10-A to set aside convictions obtained through coerced confessions, to strike down secret-evidence procedures, and to insist on reasoned judgments.',
                key_points: [
                    'Applies to BOTH civil and criminal proceedings.',
                    'Includes the right to be heard, to cross-examine, and to reasons.',
                    'Violations are directly enforceable under Article 199 (writ jurisdiction).',
                    'Courts have used it to quash convictions based on coerced confessions.',
                ],
            },
            {
                index: 1,
                title: 'Writ jurisdiction under Article 199',
                summary: 'When and how to move the High Court directly.',
                content:
                    'Article 199 empowers any High Court to issue five classical writs: (1) mandamus — to compel a public authority to do its duty, (2) prohibition — to stop an inferior court exceeding jurisdiction, (3) certiorari — to quash an illegal order, (4) habeas corpus — to produce an illegally detained person, (5) quo warranto — to question the authority of a public office-holder. The petitioner must be an aggrieved person (except for quo warranto and habeas corpus, where locus is liberal) and must show the order impugned is without lawful authority.',
                key_points: [
                    'Writ petitions are filed directly in the High Court, not lower courts.',
                    'Habeas corpus is entertained even on a postcard from a family member.',
                    'Alternate remedy rule: ordinarily exhaust statutory appeals first.',
                    'Court fee is modest (~Rs. 500–2,000); lawyer fees vary widely.',
                ],
            },
        ],
    },
    {
        id: 'pk-peca-cybercrime',
        category: 'Cyber Law',
        level: 'beginner',
        law_name: 'Prevention of Electronic Crimes Act, 2016 (PECA)',
        title: 'Cyber Crime, Harassment & Digital Privacy',
        desc: 'File an FIA complaint, remove non-consensual content, and defend against fake-account abuse.',
        overview:
            'PECA 2016 criminalises unauthorised access, cyber-stalking, non-consensual intimate imagery, hate speech, and electronic fraud. The Federal Investigation Agency (FIA) Cyber Crime Wing is the investigating authority. This course covers what is an offence, how to file, and expected timelines.',
        key_topics: [
            'Unauthorised access (Section 3 PECA)',
            'Electronic forgery & fraud (Sections 13, 14)',
            'Cyber stalking (Section 24) & child pornography (Section 22)',
            'Dignity of natural persons / non-consensual content (Section 20)',
            'Filing a complaint with FIA Cyber Crime Wing',
        ],
        hours: 1.25,
        lessons: [
            {
                index: 0,
                title: 'What counts as a cyber crime under PECA?',
                summary: 'The offences that matter most to an ordinary citizen.',
                content:
                    'PECA criminalises a wide range of conduct, but the most common complaints involve: (a) hacking of WhatsApp/Facebook/Instagram accounts (Section 3 — up to 3 months imprisonment or Rs. 50,000 fine), (b) blackmail using intimate imagery (Section 21 — up to 5 years and Rs. 5 million), (c) impersonation through fake profiles (Section 16 — up to 3 years), and (d) cyber-stalking including persistent unwanted contact (Section 24 — up to 3 years). Section 20 protects against content that "harms reputation" of natural persons and is frequently used against viral defamatory posts.',
                key_points: [
                    'Screenshot everything with timestamps before filing — the FIA will ask.',
                    'Section 20 covers defamation; Section 21 covers intimate imagery.',
                    'Complaint can be online at complaint.fia.gov.pk or in person at a Cyber Crime Circle.',
                    'Takedown of content is sought through PTA under Section 37.',
                ],
            },
            {
                index: 1,
                title: 'Filing an FIA complaint — step by step',
                summary: 'What to attach, where to go, what to expect.',
                content:
                    'Start at complaint.fia.gov.pk or at the nearest FIA Cyber Crime Reporting Centre (Islamabad, Lahore, Karachi, Peshawar, Quetta, Gilgit, Multan, Rawalpindi, Faisalabad). Attach: CNIC copy, URLs or screenshots with timestamps, a plain-language chronology, and any witness statements. The FIA registers an enquiry first; if prima facie evidence exists, it converts to an FIR under the Schedule to PECA. Investigation is digital (device seizure, ISP logs, platform data) and typically takes 3–6 weeks for straightforward cases.',
                key_points: [
                    'Online complaint is faster than in person for initial filing.',
                    'Preserve original devices — do not format or reset anything.',
                    'FIA can request platform data (Meta, Google) through MLAT requests.',
                    'Follow up every 15 days; escalate to the DG Cyber Crime if unresponsive.',
                ],
            },
        ],
    },
    {
        id: 'pk-fir-registration',
        category: 'Criminal Law',
        level: 'beginner',
        law_name: 'Code of Criminal Procedure, 1898 — Section 154',
        title: 'FIR Registration: Your Rights at the Police Station',
        desc: 'Force the police to register your FIR, handle refusals, and what to do if the SHO stalls.',
        overview:
            'A First Information Report (FIR) is the starting point of any cognizable criminal investigation in Pakistan. Section 154 CrPC obliges the officer in charge of a police station to register the FIR — but in practice, refusals and delays are common. This course walks you through the law, the remedies, and the Supreme Court case law that protects your right to registration.',
        key_topics: [
            'Duty of the SHO under Section 154 CrPC',
            'Contents of a valid FIR',
            'Remedies on refusal (Section 22-A, 22-B CrPC)',
            'Role of the Justice of Peace (Ex-Officio)',
            'Quashing an FIR (Section 561-A CrPC / Article 199)',
        ],
        hours: 1,
        lessons: [
            {
                index: 0,
                title: 'When the SHO refuses — your three remedies',
                summary: 'Justice of Peace, writ petition, and SP/DPO complaint.',
                content:
                    'If the Station House Officer refuses to register your FIR in a cognizable offence, you have three layers of remedy. (1) Approach the Superintendent of Police (SP) / DPO in writing — under Section 154(3) CrPC, they may investigate the matter themselves or direct registration. (2) File an application before the Justice of Peace (the Sessions Judge) under Section 22-A(6) and 22-B CrPC; the court can issue directions to register the FIR. (3) As a last resort, file a writ petition in the High Court under Article 199 — this is slower but often decisive.',
                key_points: [
                    'SP/DPO application is the fastest administrative remedy.',
                    'Justice of Peace can issue binding directions to the police.',
                    'Supreme Court in Muhammad Bashir v. SHO (PLD 2007 SC 539) held refusal to register FIR violates fundamental rights.',
                    'False FIR can be quashed under Article 199 or Section 561-A CrPC.',
                ],
            },
            {
                index: 1,
                title: 'Contents of a good FIR',
                summary: 'Dates, names, and chronology that hold up in court.',
                content:
                    'A well-drafted FIR should include: exact date, time, and place of the incident; names and addresses of accused, witnesses, and complainant; detailed chronology of events; list of stolen or damaged property with values; any injuries with medico-legal references; and a clear narration of the offence. Avoid vague language — details absent from the FIR often cannot be introduced later without attracting the presumption of improvement under Article 151(2) Qanun-e-Shahadat. The FIR is the cornerstone of prosecution evidence.',
                key_points: [
                    'Write in chronological order with specific times where possible.',
                    'Name ALL witnesses present — you cannot add new eyewitnesses later easily.',
                    'Keep a certified copy — you are entitled to it free of cost.',
                    'Changes/additions made by police are called "ziman" and must be initialed.',
                ],
            },
        ],
    },
    {
        id: 'pk-cheque-bounce',
        category: 'Banking & Commercial',
        level: 'beginner',
        law_name: 'Pakistan Penal Code — Section 489-F',
        title: 'Cheque Bounce: Recovery Under Section 489-F PPC',
        desc: 'Turn a dishonoured cheque into a criminal complaint and recover your money.',
        overview:
            'Section 489-F PPC criminalises the issuance of a cheque that is dishonoured on presentation — provided the cheque was issued with dishonest intent or to repay a loan. This course covers the ingredients of the offence, the criminal complaint procedure, and parallel civil recovery.',
        key_topics: [
            'Ingredients of Section 489-F PPC',
            'Bank memo & notice of demand',
            'Criminal complaint procedure',
            'Parallel civil suit under Order 37 CPC',
            'Compromise and quashing',
        ],
        hours: 0.75,
        lessons: [
            {
                index: 0,
                title: 'What makes a cheque bounce case stick?',
                summary: 'Dishonest intent + dishonour + purpose (loan or obligation).',
                content:
                    'Section 489-F requires three ingredients: (1) the cheque was issued towards repayment of a loan or fulfilment of an obligation, (2) the cheque was dishonoured on presentation, and (3) it was issued with dishonest intent. The prosecution must prove all three. "Security cheques" given as collateral — without an existing liability — are often held outside the scope. Punishment is up to three years, fine, or both.',
                key_points: [
                    'Get a bank memo (cheque return slip) as primary evidence.',
                    'Send a legal notice by registered post before filing complaint.',
                    'The complaint is filed before the Judicial Magistrate, Section 30.',
                    'File a simultaneous civil suit under Order 37 CPC for summary recovery.',
                ],
            },
            {
                index: 1,
                title: 'Civil vs criminal — run them in parallel',
                summary: 'Criminal complaint pressures; civil decree recovers the money.',
                content:
                    'A Section 489-F complaint can put the accused in jail but does not automatically recover your money. For recovery, file a simultaneous civil suit for recovery of amount under Order 37 CPC (summary procedure) in the competent court — the city Senior Civil Judge for amounts within pecuniary jurisdiction. Order 37 CPC is fast: the defendant must obtain leave to defend, failing which the decree passes in default. The Supreme Court has confirmed that parallel criminal and civil proceedings are not barred (PLD 2019 SC 64). Many complainants use the criminal case as leverage and settle the civil case with a compromise application under Section 345 CrPC for quashing.',
                key_points: [
                    'Order 37 CPC gives summary recovery — faster than a regular suit.',
                    'Parallel criminal + civil is permitted.',
                    'Compromise under Section 345 CrPC ends the criminal case cleanly.',
                    'Always get the cheque produced in court — do not hand over originals.',
                ],
            },
        ],
    },
    {
        id: 'pk-inheritance-succession',
        category: 'Family Law',
        level: 'intermediate',
        law_name: 'Muslim Personal Law (Shariat) Application Act, 1962 + Succession Act, 1925',
        title: 'Inheritance: Shares, Succession Certificates & Mutation',
        desc: 'Calculate your share, get a succession certificate, and transfer bank accounts and land after a death.',
        overview:
            'Muslim inheritance in Pakistan is governed by Islamic law for Muslims and by the Succession Act for non-Muslims. This course covers share calculation, NADRA succession certificates (for movable assets), court-issued succession certificates, and post-death mutation of immovable property.',
        key_topics: [
            'Quranic shares (Quran 4:11, 4:12, 4:176)',
            'NADRA succession certificate (movables)',
            'Court succession certificate (disputed/complex)',
            'Letters of administration vs succession certificate',
            'Inheritance mutation (viraasat intiqal) in revenue record',
        ],
        hours: 1.25,
        lessons: [
            {
                index: 0,
                title: 'Islamic shares in plain language',
                summary: 'Wife, daughter, son, parents — the default distribution.',
                content:
                    'Under Sunni Hanafi law followed by most Pakistani Muslims, a typical distribution when a man dies leaving a wife, one son, and two daughters is: wife gets 1/8, the remaining 7/8 is divided among children in the ratio 2:1:1 (son gets double a daughter). Parents, if alive, each get 1/6 before the residue. Sisters, brothers, and more distant relatives may inherit under residuary rules if closer heirs are absent. Shia law has different rules — consult a specialist.',
                key_points: [
                    'Son : daughter = 2 : 1 in residue under Quran 4:11.',
                    'Surviving spouse takes 1/8 (wife) or 1/4 (husband) when children exist.',
                    'Parents each take 1/6 when children exist.',
                    'A will can dispose only 1/3 of the estate; beyond that needs heirs\' consent.',
                ],
            },
            {
                index: 1,
                title: 'NADRA succession certificate (movables)',
                summary: 'The fast-track certificate for bank accounts, shares, vehicles.',
                content:
                    'Since 2021, NADRA issues Succession Certificates for movable assets (bank balances, savings certificates, shares, vehicles) in uncontested cases, typically within 14–21 days. Apply at any NADRA Registration Centre or online. Requirements: death certificate, family tree/Form B, CNICs of all heirs, and a list of assets. Fee is Rs. 6,400. For contested estates or immovable property, the Civil Court still has exclusive jurisdiction.',
                key_points: [
                    'NADRA covers movables only, not land or houses.',
                    'All heirs must be identified on the family tree and agree.',
                    'For land, apply for viraasat intiqal in the revenue record (Patwari).',
                    'Objections force the matter into Civil Court under Succession Act.',
                ],
            },
        ],
    },
    {
        id: 'pk-tenant-rights',
        category: 'Property Law',
        level: 'beginner',
        law_name: 'Punjab Rented Premises Act, 2009 (and provincial equivalents)',
        title: 'Tenant Rights: Rent, Eviction & Deposits',
        desc: 'Resist unlawful eviction, recover your security deposit, and handle rent increases.',
        overview:
            'Each province has its own Rented Premises / Rent Restriction law establishing a Rent Tribunal with exclusive jurisdiction over residential and commercial tenancies. This course covers registration, grounds of eviction, and the fair-rent doctrine.',
        key_topics: [
            'Registration of tenancy agreement',
            'Grounds for eviction (non-payment, personal need, bona fide use)',
            'Security deposit refund',
            'Fair rent determination',
            'Rent Tribunal forum & procedure',
        ],
        hours: 0.75,
        lessons: [
            {
                index: 0,
                title: 'When can a landlord evict you?',
                summary: 'Five grounds; everything else is unlawful.',
                content:
                    'In Punjab, the landlord can evict only on grounds listed in Section 15 of the Punjab Rented Premises Act, 2009: (1) default in rent for two consecutive months, (2) subletting without consent, (3) using the premises for a purpose different from what was let, (4) bona fide personal need, and (5) material alteration or damage. Verbal notice is insufficient — the landlord must file a petition before the Rent Tribunal and prove the ground. Self-help eviction (changing locks, disconnecting utilities) is a criminal offence under Section 21 of the Act.',
                key_points: [
                    'Only five grounds of eviction — others fail.',
                    'Landlord must file before Rent Tribunal; cannot self-help.',
                    'Deposit must be refunded within 15 days of vacation (Section 6).',
                    'Tenant can deposit rent in the Tribunal if landlord refuses.',
                ],
            },
            {
                index: 1,
                title: 'Rent increase, fair rent, and deposit recovery',
                summary: 'What the landlord can and cannot demand.',
                content:
                    'Under the Punjab Act, rent can be increased only as provided in the written tenancy or by a determination of fair rent by the Rent Tribunal. In practice, a 10% annual increase after the first year is customary in written leases. Security deposits are typically 2–3 months\' rent; the landlord must refund within 15 days of vacation after adjusting verified damages. To recover an unjustly withheld deposit, file a petition before the Rent Tribunal — the procedure is summary and free-form, a lawyer is not strictly required. Written tenancy agreements, if above 1 year, should be registered to carry full evidentiary weight; unregistered agreements are still admissible for collateral purposes.',
                key_points: [
                    'Rent increase must be per agreement OR fair-rent determination.',
                    '2–3 months\' rent is a typical security deposit ceiling.',
                    'Deposit refund within 15 days; adjust only verified damage.',
                    'Register tenancy if duration exceeds 12 months.',
                ],
            },
            {
                index: 2,
                title: 'Rent Tribunal procedure and appeals',
                summary: 'Timelines, evidence, and appellate forum.',
                content:
                    'The Rent Tribunal is presided over by a Civil Judge sitting as a tribunal. Filing a petition costs a nominal court fee; pleadings are exchanged, evidence recorded summarily, and the matter is decided within a statutory timeline of 4 months (extendable). Either party can appeal to the District Judge within 30 days. Execution of eviction orders is through court bailiffs with police assistance if needed. For tenants, the most common winning defence is tender of full rent into court under Section 13 — stops default-based eviction cold. For landlords, thorough documentation (rent receipts, notice copies, evidence of personal need) is decisive.',
                key_points: [
                    'Tribunal must decide within 4 months; appeal to District Judge within 30 days.',
                    'Tendering full rent into court defeats default-based eviction.',
                    'Landlord must produce receipts + notices to succeed on default ground.',
                    'Execution uses bailiffs + police — self-help still never lawful.',
                ],
            },
        ],
    },
    {
        id: 'pk-harassment-workplace',
        category: 'Women\'s Rights',
        level: 'beginner',
        law_name: 'Protection Against Harassment of Women at the Workplace Act, 2010',
        title: 'Workplace Harassment: Filing & Remedies',
        desc: 'File an internal complaint, escalate to the Ombudsman, and claim compensation.',
        overview:
            'The 2010 Act applies to every workplace in Pakistan — private, public, formal, informal. Every organisation with 10+ employees must have an Inquiry Committee, a Code of Conduct on display, and an independent complaint mechanism. This course covers filing internally, escalating to the Federal/Provincial Ombudsman, and appellate remedies.',
        key_topics: [
            'Definition of harassment (Section 2(h))',
            'Inquiry Committee composition',
            'Ombudsman jurisdiction',
            'Burden of proof & retaliation protection',
            'Penalties, compensation, and reinstatement',
        ],
        hours: 1,
        lessons: [
            {
                index: 0,
                title: 'What counts as workplace harassment?',
                summary: 'Unwelcome advances + power differential + work nexus.',
                content:
                    'Section 2(h) defines harassment broadly: any unwelcome sexual advance, request for sexual favour, or verbal/physical/visual conduct of a sexual nature that creates a hostile work environment OR is used to condition employment decisions. Importantly, the Act was amended in 2022 to cover all genders and all forms of harassment — not only sexual. Power asymmetry (supervisor-subordinate, senior-junior) magnifies the offence but is not strictly required.',
                key_points: [
                    'Post-2022 amendment covers all genders and all forms of harassment.',
                    'Includes verbal, electronic (WhatsApp, email), and physical conduct.',
                    'Retaliation against complainant is itself a separate offence.',
                    'Complaint can be filed up to 3 years after the incident.',
                ],
            },
            {
                index: 1,
                title: 'Internal Inquiry vs Ombudsman — which first?',
                summary: 'You can choose the forum; you are not forced to exhaust internal.',
                content:
                    'The complainant has a statutory choice: file with the Inquiry Committee inside the organisation, OR directly approach the Federal Ombudsperson (or Provincial Ombudsperson where notified). Both forums are bound by a 30-day decision timeline. Penalties range from censure to dismissal without benefits, plus compensation up to Rs. 1 million. Appeals from the Ombudsperson lie with the President/Governor; judicial review is available in the High Court.',
                key_points: [
                    'Internal committee OR Ombudsperson — complainant chooses.',
                    '30-day decision deadline; extendable with reasons.',
                    'Penalties include dismissal, forfeiture, and cash compensation.',
                    'Retaliation is punishable separately with dismissal.',
                ],
            },
        ],
    },
    {
        id: 'pk-rti-information',
        category: 'Constitutional Law',
        level: 'beginner',
        law_name: 'Right of Access to Information Act, 2017 (+ provincial RTI Acts)',
        title: 'Right to Information: Getting Records from the Government',
        desc: 'Use Article 19-A and the RTI laws to extract public records and hold authorities accountable.',
        overview:
            'Article 19-A of the Constitution guarantees every citizen the right to information in matters of public importance. The Federal RTI Act 2017, Punjab Transparency & Right to Information Act 2013, KP RTI Act 2013, and Sindh Transparency & RTI Act 2016 implement this right. This course covers drafting RTI requests, the 10-day deadline, and escalation to the Information Commission.',
        key_topics: [
            'Article 19-A and the right to information',
            'Drafting an RTI request',
            'Public Information Officer duties',
            'Information Commission appeal',
            'Exceptions (national security, privacy, cabinet deliberations)',
        ],
        hours: 0.5,
        lessons: [
            {
                index: 0,
                title: 'Writing an RTI request that gets answered',
                summary: 'Specificity + correct addressee + 10-day clock.',
                content:
                    'A successful RTI request names the specific record sought (date range, file numbers, subject line), cites the applicable Act, is addressed to the Public Information Officer of the body, and includes the applicant\'s CNIC and contact details. Under the Federal RTI Act, the PIO must respond within 10 working days. If the PIO refuses or stays silent, the applicant appeals to the Pakistan Information Commission within 30 days. Commission orders are binding and enforceable through contempt jurisdiction.',
                key_points: [
                    'Cite the Act section in your application (Section 11 of Federal Act).',
                    'PIO must reply within 10 working days — silence = constructive refusal.',
                    'Appeal to the Information Commission is free of fee.',
                    'Exemptions are narrow — read Sections 7 & 16 carefully before accepting a refusal.',
                ],
            },
            {
                index: 1,
                title: 'Refusals, exemptions, and the public-interest override',
                summary: 'What the government can legally withhold — and what it cannot.',
                content:
                    'The RTI laws list narrow exemptions: national security, foreign relations, ongoing investigation, cabinet deliberations, commercial trade secrets, and personal privacy. Even within these, a public-interest override applies — the Commission can still order disclosure if the public benefit outweighs the harm. Commonly refused-then-ordered records include: appointments and promotions, government contract awards, audit reports, public sector company expenses, and welfare scheme beneficiary lists. The body must show actual harm, not a generic blanket claim, to sustain a refusal. The burden is on the public body, not the citizen.',
                key_points: [
                    'Exemptions are narrow and purpose-specific.',
                    'Public-interest override can still compel disclosure.',
                    'Public body must prove actual harm — generic claims fail.',
                    'Commission can order partial disclosure with redactions.',
                ],
            },
            {
                index: 2,
                title: 'Information Commission appeal — practical guide',
                summary: 'Drafting the appeal, hearing, and enforcement.',
                content:
                    'File a second appeal with the Pakistan Information Commission (Islamabad) within 30 days of the PIO\'s refusal or expiry of the 10-day deadline. Attach: the original request, proof of delivery (courier receipt or email acknowledgement), any intermediate reply, and a concise ground of appeal. Hearings are typically scheduled within 30–60 days; the Commission sits in panels and may hear by video link. Orders are binding — the Commission can impose daily fines on recalcitrant PIOs and recommend disciplinary action. Enforcement via contempt is rare but potent.',
                key_points: [
                    'Second appeal goes to the Pakistan Information Commission within 30 days.',
                    'Video-link hearings make nationwide access practical.',
                    'Commission can impose daily fines on non-complying PIOs.',
                    'A favourable order is directly enforceable — no further court step needed.',
                ],
            },
        ],
    },
    {
        id: 'pk-contract-essentials',
        category: 'Contract Law',
        level: 'beginner',
        law_name: 'Contract Act, 1872',
        title: 'Contracts: Formation, Breach & Remedies',
        desc: 'Know when a deal becomes legally binding, what counts as breach, and what you can recover.',
        overview:
            'The Contract Act, 1872 still governs every contract in Pakistan from a handshake sale to a multi-crore deal. This course covers offer, acceptance, consideration, capacity, free consent, lawful object, and remedies — damages, specific performance, and rescission.',
        key_topics: [
            'Essentials of a valid contract (Section 10)',
            'Free consent and vitiating factors (coercion, undue influence, fraud, mistake)',
            'Void and voidable contracts',
            'Breach and damages (Section 73)',
            'Specific performance under Specific Relief Act, 1877',
        ],
        hours: 1.5,
        lessons: [
            {
                index: 0,
                title: 'What makes an enforceable contract?',
                summary: 'Section 10: offer + acceptance + consideration + capacity + lawful object.',
                content:
                    'Section 10 lists six essentials: (1) a valid offer, (2) unqualified acceptance, (3) lawful consideration, (4) capacity (age of majority, sound mind, not disqualified by law), (5) free consent, and (6) lawful object. Missing any one makes the agreement either void (no effect from the start) or voidable (valid until avoided by the aggrieved party). Oral contracts are generally enforceable but require writing for sale of immovable property worth over Rs. 100 (Section 54 Transfer of Property Act) and certain other transactions.',
                key_points: [
                    'Sale of immovable property above Rs. 100 must be written and registered.',
                    'A minor\'s contract is void, not voidable (Mohori Bibee rule).',
                    'Promise without consideration is void unless falling under Section 25 exceptions.',
                    'Illegal object (e.g., smuggling agreement) makes contract void.',
                ],
            },
            {
                index: 1,
                title: 'Damages for breach — how much can you recover?',
                summary: 'Hadley v. Baxendale as codified in Section 73.',
                content:
                    'Section 73 codifies the Hadley v. Baxendale rule: the aggrieved party recovers (a) direct losses that naturally arose from the breach, plus (b) consequential losses that were reasonably foreseeable at the time of the contract. Remote or speculative losses are not recoverable. The claimant must also mitigate — make reasonable efforts to reduce loss. Liquidated damages clauses in the contract are enforceable if they are a genuine pre-estimate; penalties beyond genuine loss are capped at actual damages (Section 74).',
                key_points: [
                    'Recover direct + foreseeable consequential losses only.',
                    'Duty to mitigate — unreasonable inaction reduces recovery.',
                    'Liquidated damages OK if genuine pre-estimate; penalties capped.',
                    'Specific performance for unique goods/immovable property (Specific Relief Act).',
                ],
            },
        ],
    },
    {
        id: 'pk-motor-traffic',
        category: 'Administrative',
        level: 'beginner',
        law_name: 'Motor Vehicles Ordinance, 1965 + Provincial Traffic Rules',
        title: 'Traffic Challans & Driving Offences',
        desc: 'Contest an unfair challan, handle an accident legally, and understand demerit points.',
        overview:
            'Traffic policing in Pakistan is now run by provincial forces (Motorway Police, NH&MP, Punjab Traffic Police, KP Traffic, Sindh Traffic). Each province has its own schedule of fines. E-challaning and demerit points are rolled out in major cities. This course covers contesting a challan, accident SOPs, and licence suspension.',
        key_topics: [
            'E-challan system & payment channels',
            'Grounds to contest a challan',
            'Accident SOP (FIR, medico-legal, insurance)',
            'Licence suspension under Section 35 MVO',
            'Safe Cities & speed cameras',
        ],
        hours: 0.5,
        lessons: [
            {
                index: 0,
                title: 'Contesting a challan at the Traffic Court',
                summary: 'Paying is not the only option — you can contest.',
                content:
                    'A challan is a complaint filed by the traffic officer in the Traffic Court. Paying the fine is a guilty plea; you can instead attend the hearing and contest on grounds like: wrong vehicle number, absent signage, malfunctioning camera, or emergency justification. Bring photos, witness contact, and any medical or emergency documents. Courts routinely reduce or set aside challans with a credible explanation. Unpaid challans above a threshold trigger a court warrant and can block vehicle transfer and annual token fee.',
                key_points: [
                    'Paying = guilty plea; contesting is your right.',
                    'Unpaid challans eventually block token/transfer — don\'t ignore.',
                    'E-challan photos and GPS timestamps are available on demand.',
                    'Demerit points above threshold lead to licence suspension (Section 35 MVO).',
                ],
            },
            {
                index: 1,
                title: 'Accident SOP — the first 24 hours matter most',
                summary: 'FIR, medico-legal, insurance, and photos.',
                content:
                    'At an accident scene: (1) ensure safety and call 1122 for emergency medical response; (2) do not move vehicles until police photograph the scene unless they block traffic; (3) note down the other party\'s CNIC, vehicle registration, licence number, and insurance; (4) take wide, medium, and close-up photos plus a short video; (5) get witness phone numbers; (6) file an FIR at the nearest police station for any significant damage or injury — this is essential for insurance recovery under Section 95 MVO; (7) obtain the medico-legal certificate (MLC) from a government hospital if injured. Insurance claims without an FIR and MLC are routinely rejected.',
                key_points: [
                    'Call 1122 first; then police for FIR.',
                    'Photos + videos from multiple angles preserve evidence.',
                    'FIR is essential for insurance recovery.',
                    'MLC from a govt hospital within 24 hours is gold-standard.',
                ],
            },
            {
                index: 2,
                title: 'Licence suspension, demerit points, and recovery',
                summary: 'When your licence is at risk and how to get it back.',
                content:
                    'Under Section 35 of the Motor Vehicles Ordinance and provincial rules, a licensing authority may suspend or revoke a licence for: accumulating demerit points above the threshold, driving under the influence, reckless driving causing grievous hurt, or medical unfitness. A suspension order is appealable to the Licensing Appellate Authority within 30 days. Demerit points typically expire after 2 years. To restore a suspended licence after the period, you may be required to re-take the written and practical test and complete a road-safety course. Driving on a suspended licence is a separate cognizable offence.',
                key_points: [
                    'Suspension is appealable to the Licensing Appellate Authority within 30 days.',
                    'Demerit points expire (usually 2 years) — request the record.',
                    'Restoration may require re-testing and a safety course.',
                    'Driving on a suspended licence is a separate cognizable offence.',
                ],
            },
        ],
    },
];

export const SEED_LIBRARY = [
    {
        id: 'lib-ppc-376',
        title: 'PPC Section 376: Rape — Definition & Punishment',
        category: 'Criminal Law',
        section_count: 6,
        tags: ['ppc', 'criminal', 'sexual-offences'],
    },
    {
        id: 'lib-qanun-shahadat',
        title: 'Qanun-e-Shahadat Order, 1984: Rules of Evidence',
        category: 'Evidence Law',
        section_count: 12,
        tags: ['evidence', 'procedure'],
    },
    {
        id: 'lib-contract-act',
        title: 'Contract Act, 1872: Essentials of a Valid Contract',
        category: 'Contract Law',
        section_count: 10,
        tags: ['contract', 'civil'],
    },
    {
        id: 'lib-specific-relief',
        title: 'Specific Relief Act, 1877: Injunctions & Specific Performance',
        category: 'Civil Remedies',
        section_count: 8,
        tags: ['civil', 'injunction'],
    },
    {
        id: 'lib-women-protection',
        title: 'Protection Against Harassment of Women at the Workplace Act, 2010',
        category: 'Women\'s Rights',
        section_count: 7,
        tags: ['women', 'harassment', 'workplace'],
    },
    {
        id: 'lib-cybercrime',
        title: 'Prevention of Electronic Crimes Act, 2016 (PECA)',
        category: 'Cyber Law',
        section_count: 9,
        tags: ['cyber', 'digital'],
    },
    {
        id: 'lib-ppc-302',
        title: 'PPC Section 302: Punishment for Qatl-e-Amd',
        category: 'Criminal Law',
        section_count: 5,
        tags: ['ppc', 'murder', 'criminal'],
    },
    {
        id: 'lib-crpc-154',
        title: 'CrPC Section 154: Information in Cognizable Cases (FIR)',
        category: 'Criminal Procedure',
        section_count: 3,
        tags: ['fir', 'procedure'],
    },
    {
        id: 'lib-family-courts-act',
        title: 'Family Courts Act, 1964',
        category: 'Family Law',
        section_count: 15,
        tags: ['family', 'procedure'],
    },
    {
        id: 'lib-mflo-1961',
        title: 'Muslim Family Laws Ordinance, 1961',
        category: 'Family Law',
        section_count: 8,
        tags: ['family', 'nikah', 'talaq'],
    },
    {
        id: 'lib-transfer-of-property',
        title: 'Transfer of Property Act, 1882',
        category: 'Property Law',
        section_count: 14,
        tags: ['property', 'civil'],
    },
    {
        id: 'lib-registration-act',
        title: 'Registration Act, 1908',
        category: 'Property Law',
        section_count: 9,
        tags: ['property', 'registration'],
    },
    {
        id: 'lib-stamp-act',
        title: 'Stamp Act, 1899',
        category: 'Revenue & Tax',
        section_count: 11,
        tags: ['stamp', 'revenue'],
    },
    {
        id: 'lib-constitution-part-II',
        title: 'Constitution of Pakistan — Part II (Fundamental Rights)',
        category: 'Constitutional Law',
        section_count: 21,
        tags: ['constitution', 'rights'],
    },
    {
        id: 'lib-cpc-1908',
        title: 'Code of Civil Procedure, 1908',
        category: 'Civil Procedure',
        section_count: 30,
        tags: ['cpc', 'civil-procedure'],
    },
    {
        id: 'lib-nira-2012',
        title: 'Industrial Relations Act, 2012',
        category: 'Labour Law',
        section_count: 12,
        tags: ['labour', 'union'],
    },
    {
        id: 'lib-peca-2016',
        title: 'Prevention of Electronic Crimes Act, 2016 — Full Text',
        category: 'Cyber Law',
        section_count: 51,
        tags: ['peca', 'cyber'],
    },
    {
        id: 'lib-motor-ordinance',
        title: 'Motor Vehicles Ordinance, 1965',
        category: 'Administrative',
        section_count: 22,
        tags: ['traffic', 'vehicle'],
    },
    {
        id: 'lib-rent-punjab',
        title: 'Punjab Rented Premises Act, 2009',
        category: 'Property Law',
        section_count: 25,
        tags: ['rent', 'tenant'],
    },
    {
        id: 'lib-consumer-punjab',
        title: 'Punjab Consumer Protection Act, 2005',
        category: 'Consumer Law',
        section_count: 32,
        tags: ['consumer', 'refund'],
    },
    {
        id: 'lib-arbitration-act',
        title: 'Arbitration Act, 1940',
        category: 'Alternative Dispute Resolution',
        section_count: 17,
        tags: ['arbitration', 'adr'],
    },
    {
        id: 'lib-limitation-act',
        title: 'Limitation Act, 1908',
        category: 'Civil Procedure',
        section_count: 29,
        tags: ['limitation', 'time-bar'],
    },
    {
        id: 'lib-succession-act',
        title: 'Succession Act, 1925',
        category: 'Inheritance',
        section_count: 18,
        tags: ['succession', 'probate'],
    },
    {
        id: 'lib-companies-2017',
        title: 'Companies Act, 2017',
        category: 'Corporate Law',
        section_count: 45,
        tags: ['company', 'secp'],
    },
];

export const SEED_QUIZZES = [
    {
        id: 'quiz-crpc-basics',
        course_id: 'pk-crpc-arrest-bail',
        title: 'CrPC Basics — Arrest & Bail',
        description: 'Test your understanding of warrantless arrest and bail procedure.',
        pass_score: 70,
        questions: [
            {
                question: 'Under which section can police arrest a person without a warrant?',
                options: ['Section 54 CrPC', 'Section 302 PPC', 'Section 10 Constitution', 'Section 144 CrPC'],
                correct_index: 0,
            },
            {
                question: 'How soon must an arrested person be produced before a magistrate?',
                options: ['48 hours', '24 hours', '72 hours', 'Immediately'],
                correct_index: 1,
            },
            {
                question: 'In a bailable offence, bail is granted as a matter of:',
                options: ['Discretion', 'Right', 'Favour', 'Plea bargain'],
                correct_index: 1,
            },
            {
                question: 'Pre-arrest (anticipatory) bail is sought under which CrPC section?',
                options: ['497', '498', '498-A', '561-A'],
                correct_index: 2,
            },
        ],
    },
    {
        id: 'quiz-khula',
        course_id: 'pk-family-khula',
        title: 'Khula & Family Law Quiz',
        description: 'Check your knowledge of khula procedure.',
        pass_score: 70,
        questions: [
            {
                question: 'Does khula require the husband\'s consent?',
                options: ['Yes, always', 'No', 'Only in some schools', 'Only if marriage is under 6 months'],
                correct_index: 1,
            },
            {
                question: 'Which court has jurisdiction over khula petitions?',
                options: ['High Court', 'Family Court', 'Federal Shariat Court', 'Session Court'],
                correct_index: 1,
            },
            {
                question: 'Iddat period after khula decree is typically:',
                options: ['One month', 'Three menstrual cycles', 'Three months', 'Six months'],
                correct_index: 1,
            },
        ],
    },
    {
        id: 'quiz-peca',
        course_id: 'pk-peca-cybercrime',
        title: 'PECA 2016 — Cyber Crime Quiz',
        description: 'Test your knowledge of PECA offences and procedure.',
        pass_score: 70,
        questions: [
            {
                question: 'Which authority investigates PECA offences?',
                options: ['Local Police', 'FIA Cyber Crime Wing', 'NAB', 'ISI'],
                correct_index: 1,
            },
            {
                question: 'Non-consensual sharing of intimate imagery falls under:',
                options: ['Section 3 PECA', 'Section 20 PECA', 'Section 21 PECA', 'Section 37 PECA'],
                correct_index: 2,
            },
            {
                question: 'Takedown of harmful content is sought from:',
                options: ['PTA', 'FIA', 'PEMRA', 'Supreme Court'],
                correct_index: 0,
            },
        ],
    },
    {
        id: 'quiz-fir',
        course_id: 'pk-fir-registration',
        title: 'FIR Registration Quiz',
        description: 'Know your rights at the police station.',
        pass_score: 70,
        questions: [
            {
                question: 'If the SHO refuses to register an FIR in a cognizable offence, one remedy is:',
                options: [
                    'Wait for the next shift',
                    'File before the Justice of Peace',
                    'Pay a bribe',
                    'Nothing can be done',
                ],
                correct_index: 1,
            },
            {
                question: 'Section 154 CrPC obliges the SHO to:',
                options: [
                    'Verify the complaint first',
                    'Record the information in a cognizable offence',
                    'Refer to higher authority',
                    'Ignore anonymous complaints',
                ],
                correct_index: 1,
            },
            {
                question: 'You can obtain a certified copy of the FIR:',
                options: ['For a fee', 'Free of cost', 'Only through a lawyer', 'Only after investigation'],
                correct_index: 1,
            },
        ],
    },
    {
        id: 'quiz-cheque',
        course_id: 'pk-cheque-bounce',
        title: 'Cheque Bounce Quiz',
        description: 'Section 489-F PPC essentials.',
        pass_score: 70,
        questions: [
            {
                question: 'Maximum imprisonment under Section 489-F PPC is:',
                options: ['1 year', '3 years', '5 years', '7 years'],
                correct_index: 1,
            },
            {
                question: 'The complaint is filed before:',
                options: ['Civil Court', 'Judicial Magistrate', 'High Court', 'Banking Ombudsman'],
                correct_index: 1,
            },
        ],
    },
    {
        id: 'quiz-inheritance',
        course_id: 'pk-inheritance-succession',
        title: 'Inheritance Quiz',
        description: 'Shares, certificates, and mutation.',
        pass_score: 70,
        questions: [
            {
                question: 'Under Hanafi law, a son\'s residuary share compared to a daughter\'s is:',
                options: ['1:1', '2:1', '3:1', 'Equal when a wife is alive'],
                correct_index: 1,
            },
            {
                question: 'NADRA succession certificate covers:',
                options: ['Land only', 'Movable assets only', 'Both movable & immovable', 'Only foreign assets'],
                correct_index: 1,
            },
            {
                question: 'A valid will can dispose of at most:',
                options: ['The entire estate', '1/2 of the estate', '1/3 of the estate', '1/4 of the estate'],
                correct_index: 2,
            },
        ],
    },
    {
        id: 'quiz-tenant',
        course_id: 'pk-tenant-rights',
        title: 'Tenant Rights Quiz',
        description: 'Rent Tribunal essentials.',
        pass_score: 70,
        questions: [
            {
                question: 'A landlord wanting to evict a tenant must:',
                options: [
                    'Change the locks',
                    'Cut utilities',
                    'File a petition in the Rent Tribunal',
                    'Send police directly',
                ],
                correct_index: 2,
            },
            {
                question: 'Default in rent becomes an eviction ground after:',
                options: ['One month', 'Two consecutive months', 'Six months', 'One year'],
                correct_index: 1,
            },
        ],
    },
    {
        id: 'quiz-harassment',
        course_id: 'pk-harassment-workplace',
        title: 'Workplace Harassment Quiz',
        description: 'Filing and remedies under the 2010 Act.',
        pass_score: 70,
        questions: [
            {
                question: 'Post-2022, the Harassment Act covers:',
                options: [
                    'Only women',
                    'All genders and forms',
                    'Only sexual harassment',
                    'Only public sector employees',
                ],
                correct_index: 1,
            },
            {
                question: 'Complaint can be filed up to:',
                options: ['30 days', '6 months', '1 year', '3 years'],
                correct_index: 3,
            },
            {
                question: 'Retaliation against complainant is:',
                options: [
                    'Allowed',
                    'A separate offence under the Act',
                    'Required during investigation',
                    'Not regulated',
                ],
                correct_index: 1,
            },
        ],
    },
    {
        id: 'quiz-rti',
        course_id: 'pk-rti-information',
        title: 'Right to Information Quiz',
        description: 'Accessing government records.',
        pass_score: 70,
        questions: [
            {
                question: 'Article guaranteeing right to information in the Constitution:',
                options: ['Article 19', 'Article 19-A', 'Article 10', 'Article 25'],
                correct_index: 1,
            },
            {
                question: 'Federal RTI Act response deadline is:',
                options: ['5 working days', '10 working days', '30 days', '60 days'],
                correct_index: 1,
            },
        ],
    },
    {
        id: 'quiz-contract',
        course_id: 'pk-contract-essentials',
        title: 'Contract Law Quiz',
        description: 'Formation and breach under the 1872 Act.',
        pass_score: 70,
        questions: [
            {
                question: 'A minor\'s contract in Pakistan is:',
                options: ['Valid', 'Voidable', 'Void', 'Enforceable with consent'],
                correct_index: 2,
            },
            {
                question: 'Section 73 of the Contract Act deals with:',
                options: [
                    'Capacity',
                    'Offer & acceptance',
                    'Damages for breach',
                    'Free consent',
                ],
                correct_index: 2,
            },
            {
                question: 'Sale of immovable property above Rs. 100 requires:',
                options: ['Oral agreement', 'Written and registered instrument', 'SMS confirmation', 'No formality'],
                correct_index: 1,
            },
        ],
    },
    {
        id: 'quiz-property-transfer',
        course_id: 'pk-property-transfer',
        title: 'Property Transfer Quiz',
        description: 'Title verification, registration, and mutation basics.',
        pass_score: 70,
        questions: [
            {
                question: 'Before paying token money, the buyer should first obtain:',
                options: ['A verbal promise', 'Fard-e-Malkiat', 'Electricity bill only', 'Police NOC'],
                correct_index: 1,
            },
            {
                question: 'After sale deed registration, the next critical legal step is:',
                options: ['Social media announcement', 'Mutation (intiqal)', 'Token repayment', 'New CNIC'],
                correct_index: 1,
            },
            {
                question: 'Sale of immovable property is completed through:',
                options: ['Oral transfer', 'Registered instrument', 'Witness WhatsApp message', 'Newspaper notice'],
                correct_index: 1,
            },
        ],
    },
    {
        id: 'quiz-labor-rights',
        course_id: 'pk-labor-termination',
        title: 'Labour Rights Quiz',
        description: 'Termination, notice, and grievance forum essentials.',
        pass_score: 70,
        questions: [
            {
                question: 'For a protected workman, termination generally requires:',
                options: ['No notice', 'One month notice or pay in lieu', 'Three years notice', 'Only verbal warning'],
                correct_index: 1,
            },
            {
                question: 'A dismissal for misconduct must include:',
                options: ['Show-cause and inquiry', 'Instant police arrest', 'Union approval only', 'Director signature only'],
                correct_index: 0,
            },
            {
                question: 'In many labour disputes, a common core remedy is:',
                options: ['Passport seizure', 'Reinstatement with back wages', 'Property confiscation', 'Travel ban'],
                correct_index: 1,
            },
        ],
    },
    {
        id: 'quiz-consumer-rights',
        course_id: 'pk-consumer-rights',
        title: 'Consumer Rights Quiz',
        description: 'Consumer complaint filing and remedies in Pakistan.',
        pass_score: 70,
        questions: [
            {
                question: 'Consumer Courts can order which remedy?',
                options: ['Refund/replacement', 'Jail for every dispute', 'Passport cancellation', 'Land mutation'],
                correct_index: 0,
            },
            {
                question: 'Best evidence for a consumer complaint includes:',
                options: ['Only oral claim', 'Invoice and warranty records', 'No documents needed', 'Friend opinion'],
                correct_index: 1,
            },
            {
                question: 'If the seller ignores a decree, the decree is:',
                options: ['Automatically cancelled', 'Executable like a civil decree', 'Void after 7 days', 'Converted to FIR only'],
                correct_index: 1,
            },
        ],
    },
    {
        id: 'quiz-traffic-law',
        course_id: 'pk-motor-traffic',
        title: 'Traffic Challan Quiz',
        description: 'Challan contesting and road accident SOP basics.',
        pass_score: 70,
        questions: [
            {
                question: 'Paying an e-challan usually means:',
                options: ['Automatic acquittal', 'A guilty plea', 'Transfer to civil court', 'No legal effect'],
                correct_index: 1,
            },
            {
                question: 'For an insurance claim after a serious accident, key documents include:',
                options: ['FIR and MLC', 'Only a selfie', 'Vehicle color certificate', 'Tax return'],
                correct_index: 0,
            },
            {
                question: 'Licence suspension orders are generally:',
                options: ['Never appealable', 'Appealable before competent authority', 'Handled by union council only', 'Automatically permanent'],
                correct_index: 1,
            },
        ],
    },
    {
        id: 'quiz-constitution',
        course_id: 'pk-constitution-fundamental',
        title: 'Fundamental Rights Quiz',
        description: 'Articles 8–28 and writ jurisdiction.',
        pass_score: 70,
        questions: [
            {
                question: 'Article 10-A was inserted by:',
                options: ['17th Amendment', '18th Amendment', '19th Amendment', '21st Amendment'],
                correct_index: 1,
            },
            {
                question: 'Writ jurisdiction of the High Court is conferred by:',
                options: ['Article 184(3)', 'Article 199', 'Article 203', 'Article 212'],
                correct_index: 1,
            },
            {
                question: 'Habeas corpus aims to:',
                options: [
                    'Produce an illegally detained person',
                    'Quash an order',
                    'Compel a public duty',
                    'Question an appointment',
                ],
                correct_index: 0,
            },
        ],
    },
];
