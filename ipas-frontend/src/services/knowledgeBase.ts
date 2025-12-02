// Knowledge Base Service for RAG
export interface DocumentChunk {
  id: string;
  content: string;
  source: string;
  caseId: string;
  documentType: string;
  filename?: string;
  metadata?: Record<string, any>;
}

export interface KnowledgeBase {
  caseId: string;
  chunks: DocumentChunk[];
  lastUpdated: string;
  documentCount: number;
}

class KnowledgeBaseService {
  private readonly STORAGE_KEY = 'ipas_knowledge_base';
  private cache: Map<string, KnowledgeBase> = new Map();

  // Get or build knowledge base (PERSISTENT - builds only once)
  async getKnowledgeBase(caseId: string): Promise<KnowledgeBase> {
    if (this.cache.has(caseId)) {
      console.log(`⚡ KB from cache for ${caseId}`);
      return this.cache.get(caseId)!;
    }

    const stored = this.getStoredKnowledgeBase(caseId);
    if (stored && stored.chunks.length > 0) {
      console.log(`💾 KB from storage for ${caseId} (${stored.chunks.length} chunks)`);
      this.cache.set(caseId, stored);
      return stored;
    }

    console.log(`🔨 Building KB for ${caseId}...`);
    const kb = await this.buildKnowledgeBase(caseId);
    this.saveKnowledgeBase(kb);
    this.cache.set(caseId, kb);
    console.log(`✅ KB saved: ${kb.chunks.length} chunks`);
    return kb;
  }

  private async buildKnowledgeBase(caseId: string): Promise<KnowledgeBase> {
    const chunks: DocumentChunk[] = [];
    const caseFolder = this.getCaseFolderPath(caseId);
    
    console.log(`🔨 Building KB for ${caseId}...`);
    const startTime = Date.now();
    
    // Add case-specific guidelines FIRST (high priority)
    chunks.push(...this.getCaseSpecificGuidelines(caseId));
    
    // Define all files to load - comprehensive list to ensure all documents are included
    const jsonFiles = [
      'medical_records.json', 'MedicalRecords.json', 'medical-records.json',
      'doctor-notes.json', 'physician-notes.json', 'cardiology-notes.json',
      'polysomnography.json', 'lab-results.json', 'laboratory-study.json',
      '2d-doppler-study.json', 'electrocardiogram.json', 
      'observability_and_explanation.json', 'clinical-criteria-evaluation.json',
      'LCDClinicalSummary-criteriaeval.json', 'prior-auth-form-extracted.json',
      'prior-auth-request-form.json', 'AuthReq.json', 'PAP-policy.json',
      'PAP_Device_Policy.json', 'insurance-card.json', 
      'patient-medical-history.json', 'medical-history.json', 'patient-history.json',
      'operative-report.json', 'discharge-summary.json', 'stress-test-results.json',
      'clinical-summary.json', 'patient-demographics.json', 'medications.json',
      'allergies.json', 'vital-signs.json', 'progress-notes.json',
      'consultation-notes.json', 'radiology-report.json', 'pathology-report.json'
    ];

    const txtFiles = [
      'EMR007.txt', 'EMR008.txt', 'EMR.txt', 'AuthReq.txt',
      'MedicalRecordJson.txt', 'clinical-notes.txt', 'medical-history.txt',
      'patient-history.txt', 'doctor-notes.txt', 'physician-notes.txt'
    ];

    const pdfFiles = [
      'medical_records.pdf', 'medical-records.pdf', 'doctor-notes.pdf',
      'polysomnography.pdf', 'lab-results.pdf', 'laboratory-study.pdf',
      'operative-report.pdf', 'discharge-summary.pdf', '2d-doppler-study.pdf',
      'electrocardiogram.pdf', 'prior-auth-form-original.pdf', 'insurance-card.pdf',
      'patient-medical-history.pdf', 'medical-history.pdf', 'patient-history.pdf',
      'cardiology-notes.pdf', 'physician-notes.pdf', 'clinical-summary.pdf',
      'radiology-report.pdf', 'pathology-report.pdf'
    ];

    // Load all files in PARALLEL for speed
    const loadPromises: Promise<{chunks: DocumentChunk[], filename: string} | null>[] = [];
    
    // JSON files
    jsonFiles.forEach(file => {
      loadPromises.push(
        fetch(`/sample-documents/cases/${caseFolder}/${file}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => data ? {
            chunks: this.extractJSON(data, file, caseId),
            filename: file
          } : null)
          .catch(() => null)
      );
    });
    
    // TXT files
    txtFiles.forEach(file => {
      loadPromises.push(
        fetch(`/sample-documents/cases/${caseFolder}/${file}`)
          .then(res => res.ok ? res.text() : null)
          .then(text => text ? {
            chunks: this.chunkText(text, file, caseId),
            filename: file
          } : null)
          .catch(() => null)
      );
    });
    
    // PDF files
    pdfFiles.forEach(file => {
      loadPromises.push(
        this.extractPDFText(`/sample-documents/cases/${caseFolder}/${file}`)
          .then(text => text ? {
            chunks: this.chunkText(text, file, caseId),
            filename: file
          } : null)
          .catch(() => null)
      );
    });

    // Wait for all files to load in parallel
    const results = await Promise.all(loadPromises);
    
    let documentCount = 0;
    const loadedFiles: string[] = [];
    
    results.forEach(result => {
      if (result && result.chunks.length > 0) {
        chunks.push(...result.chunks);
        documentCount++;
        loadedFiles.push(result.filename);
      }
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ KB built in ${elapsed}s: ${chunks.length} chunks from ${documentCount} docs`);
    console.log(`📁 Loaded:`, loadedFiles.join(', '));

    return {
      caseId,
      chunks,
      lastUpdated: new Date().toISOString(),
      documentCount
    };
  }

  // Extract text from PDF files using pdf.js
  private async extractPDFText(pdfUrl: string): Promise<string> {
    try {
      // @ts-ignore - pdfjsLib is loaded globally from CDN
      const pdfjsLib = (window as any).pdfjsLib;
      
      if (!pdfjsLib) {
        console.warn('⚠️ PDF.js not loaded, skipping PDF extraction');
        return '';
      }

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `\n--- Page ${pageNum} ---\n${pageText}`;
      }
      
      return fullText.trim();
    } catch (error) {
      // Silent fail - PDF might not exist or be readable
      return '';
    }
  }

  // Chunk text files efficiently - comprehensive but not excessive
  private chunkText(text: string, filename: string, caseId: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const chunkSize = 2000; // Balanced chunk size
    const overlap = 300; // Enough overlap for context
    
    // Full document chunk for broad searches
    chunks.push({
      id: `${caseId}-${filename}-full`,
      content: `${filename}: ${text}`,
      source: filename,
      caseId,
      documentType: filename,
      filename,
      metadata: { type: 'full_text', priority: 'high' }
    });

    // Split into overlapping chunks for detailed searches
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      const chunk = text.slice(i, i + chunkSize);
      if (chunk.trim().length > 50) { // Skip tiny chunks
        chunks.push({
          id: `${caseId}-${filename}-${chunks.length}`,
          content: `${filename} (section ${Math.floor(i / (chunkSize - overlap)) + 1}): ${chunk}`,
          source: filename,
          caseId,
          documentType: filename,
          filename,
          metadata: { 
            type: 'text_chunk', 
            start: i, 
            end: i + chunkSize,
            priority: 'high' 
          }
        });
      }
    }

    return chunks;
  }

  private extractJSON(data: any, filename: string, caseId: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const allText: string[] = []; // Collect all text for full-text search
    
    // Extract content recursively - capture EVERYTHING
    const extract = (obj: any, path: string = '', depth: number = 0): void => {
      if (obj === null || obj === undefined) return;
      
      if (typeof obj === 'string' && obj.trim()) {
        const text = obj.trim();
        allText.push(text); // Collect for full-text chunk
        
        chunks.push({
          id: `${caseId}-${filename}-${chunks.length}`,
          content: path ? `${path}: ${text}` : text,
          source: filename,
          caseId,
          documentType: filename,
          filename,
          metadata: { path, depth, type: 'string' }
        });
      } else if (typeof obj === 'number' || typeof obj === 'boolean') {
        allText.push(String(obj));
        chunks.push({
          id: `${caseId}-${filename}-${chunks.length}`,
          content: `${path}: ${obj}`,
          source: filename,
          caseId,
          documentType: filename,
          filename,
          metadata: { path, depth, type: typeof obj }
        });
      } else if (Array.isArray(obj)) {
        // Array summary for simple types
        const arrayContent = obj.filter(item => 
          typeof item === 'string' || typeof item === 'number'
        ).join(', ');
        
        if (arrayContent) {
          allText.push(arrayContent);
          chunks.push({
            id: `${caseId}-${filename}-${chunks.length}`,
            content: `${path}: [${arrayContent}]`,
            source: filename,
            caseId,
            documentType: filename,
            filename,
            metadata: { path, depth, type: 'array' }
          });
        }
        
        // Process array items (no depth limit - extract everything)
        obj.forEach((item, i) => extract(item, `${path}[${i}]`, depth + 1));
      } else if (typeof obj === 'object') {
        const summary: string[] = [];
        
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            summary.push(`${key}: ${value}`);
          }
          // Extract nested objects recursively (no depth limit)
          extract(value, path ? `${path}.${key}` : key, depth + 1);
        });
        
        // Object summary for all levels
        if (summary.length > 0) {
          const summaryText = summary.join('; ');
          allText.push(summaryText);
          chunks.push({
            id: `${caseId}-${filename}-${chunks.length}`,
            content: `${path || filename} - ${summaryText}`,
            source: filename,
            caseId,
            documentType: filename,
            filename,
            metadata: { path, depth, type: 'object_summary' }
          });
        }
      }
    };

    extract(data);
    
    // Full document as JSON for structure-based search
    const fullJSON = JSON.stringify(data, null, 2);
    const jsonChunkSize = 5000;
    
    // Create multiple full-document chunks if JSON is large
    for (let i = 0; i < fullJSON.length; i += jsonChunkSize) {
      const chunk = fullJSON.slice(i, i + jsonChunkSize);
      chunks.push({
        id: `${caseId}-${filename}-json-${i}`,
        content: `${filename} JSON (part ${Math.floor(i / jsonChunkSize) + 1}): ${chunk}`,
        source: filename,
        caseId,
        documentType: filename,
        filename,
        metadata: { type: 'full_json', start: i, priority: 'medium' }
      });
    }
    
    // Full-text chunk (all extracted text concatenated)
    const fullText = allText.join(' ');
    const textChunkSize = 3000;
    
    for (let i = 0; i < fullText.length; i += textChunkSize) {
      const chunk = fullText.slice(i, i + textChunkSize);
      if (chunk.trim()) {
        chunks.push({
          id: `${caseId}-${filename}-text-${i}`,
          content: `${filename} content (part ${Math.floor(i / textChunkSize) + 1}): ${chunk}`,
          source: filename,
          caseId,
          documentType: filename,
          filename,
          metadata: { type: 'full_text', start: i, priority: 'high' }
        });
      }
    }
    
    return chunks;
  }

  searchKnowledgeBase(kb: KnowledgeBase, query: string, topK: number = 80): DocumentChunk[] {
    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/).filter(w => w.length > 2); // Skip very short words
    
    const scored = kb.chunks.map(chunk => {
      let score = 0;
      const content = chunk.content.toLowerCase();
      const source = chunk.source.toLowerCase();
      
      // Exact phrase match - highest priority
      if (content.includes(queryLower)) score += 100;
      
      // Individual word matches with frequency
      words.forEach(w => {
        const matches = (content.match(new RegExp(w, 'g')) || []).length;
        score += matches * 10;
        if (content.startsWith(w)) score += 5;
      });
      
      // Source-based priority boosts
      if (source.includes('.pdf')) {
        score *= 4.0; // PDF files (original documents - highest priority)
      } else if (source.includes('emr') || source.includes('.txt')) {
        score *= 3.5; // TXT/EMR files (raw medical records)
      } else if (source.includes('medical') || source.includes('record') || 
                 source.includes('physician') || source.includes('doctor') || 
                 source.includes('clinical') || source.includes('patient')) {
        score *= 3.0; // Medical records JSON
      } else if (source.includes('guideline') || source.includes('policy') || 
                 source.includes('lcd') || source.includes('cms') || source.includes('aafp')) {
        score *= 2.5; // Guidelines
      } else if (source.includes('lab') || source.includes('polysomnography') || 
                 source.includes('operative') || source.includes('discharge')) {
        score *= 2.0; // Diagnostic & surgical reports
      }
      
      // Metadata boosts
      if (chunk.metadata?.priority === 'high') score *= 1.4;
      if (chunk.metadata?.category === 'Medicare Coverage Policy' || 
          chunk.metadata?.category === 'Clinical Practice Guidelines') score *= 1.3;
      
      return { chunk, score };
    });

    // Return top scored chunks
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.chunk);
  }

  private getCaseSpecificGuidelines(caseId: string): DocumentChunk[] {
    if (caseId === 'PA-2024-006') {
      return [
        {
          id: 'cms-lcd-full-1',
          content: 'CMS LCD L33611 - Oral Appliances for Obstructive Sleep Apnea (OSA). OFFICIAL MEDICARE COVERAGE POLICY. Effective Date: 08/08/2021. Coverage Requirements: 1) Diagnosis of OSA must be established by polysomnography (sleep study) showing Apnea-Hypopnea Index (AHI) or Respiratory Disturbance Index (RDI) ≥15 events/hour, OR AHI/RDI ≥5 and <15 with documented symptoms (excessive daytime sleepiness, impaired cognition, mood disorders, insomnia, or documented hypertension, ischemic heart disease, or history of stroke). 2) Patient has tried and failed CPAP therapy OR CPAP is contraindicated. Failure documented as: inability to use CPAP due to intolerance, inadequate response despite optimal titration, or documented medical contraindication. 3) Custom-fabricated oral appliance prescribed by treating physician (MD/DO) and fabricated by qualified dental professional. 4) FDA-approved device specifically for OSA treatment. 5) Follow-up sleep study required after oral appliance to document therapeutic response. 6) Ongoing monitoring required at least annually. Coverage Limitations: Non-custom prefabricated appliances not covered, over-the-counter devices excluded, devices for snoring without documented OSA diagnosis not covered, replacement only covered every 5 years or with significant weight change. Medicare contractors: CGS Administrators LLC, Noridian Healthcare Solutions LLC. LCD ID: L33611. Source: https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=33611',
          source: 'CMS LCD L33611 - Official Medicare Policy',
          caseId,
          documentType: 'Clinical Guidelines',
          metadata: { category: 'Medicare Coverage Policy', priority: 'critical', source_url: 'https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=33611' }
        },
        {
          id: 'cms-lcd-full-2',
          content: 'CMS LCD L33611 Continued: Medical Necessity Documentation Requirements: Initial prescription must include: OSA diagnosis with sleep study results (AHI/RDI values), symptoms and clinical presentation, CPAP trial results or contraindication documentation, medical necessity statement from treating physician (MD/DO), dental evaluation confirming patient is appropriate candidate for oral appliance. Oral appliance must be: Custom-fabricated (not prefabricated), adjustable for titration, FDA-cleared for OSA, fitted and adjusted by qualified dental professional. Follow-up Requirements: Objective testing (sleep study) within 3-6 months to verify therapeutic benefit, clinical evaluation for side effects (TMJ problems, tooth movement, bite changes), documentation of compliance and effectiveness, annual evaluation for continued medical necessity. Replacement: Covered every 5 years if device is damaged beyond repair or patient has significant weight change affecting fit. Source: https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=33611',
          source: 'CMS LCD L33611',
          caseId,
          documentType: 'Clinical Guidelines',
          metadata: { category: 'Medicare Coverage Policy', priority: 'high' }
        },
        {
          id: 'cms-lcd-full-3',
          content: 'CMS LCD L33611 Clinical Context: Obstructive Sleep Apnea (OSA) is characterized by repetitive episodes of complete (apnea) or partial (hypopnea) upper airway obstruction during sleep. Continuous Positive Airway Pressure (CPAP) is first-line treatment. Oral appliances are alternative for patients unable to tolerate CPAP. Oral appliances work by: advancing mandible to increase airway space, preventing tongue from falling back, repositioning soft tissues. Common types: Mandibular advancement devices (MADs), tongue-retaining devices. Evidence shows: 50-70% effective in mild-moderate OSA, less effective than CPAP but higher compliance rates in some patients, significant improvement in daytime sleepiness and quality of life. Contraindications: Insufficient teeth for retention, active temporomandibular joint (TMJ) disorder, severe periodontal disease, central sleep apnea, severe obesity (BMI >35). Source: https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=33611',
          source: 'CMS LCD L33611',
          caseId,
          documentType: 'Clinical Guidelines',
          metadata: { category: 'Medicare Coverage Policy', priority: 'high' }
        }
      ];
    } else if (caseId === 'PA-2024-007') {
      return [
        {
          id: 'pmc-diverticulitis-1',
          content: 'Acute Diverticulitis Management Guidelines - Published PMC7904336. EVIDENCE-BASED CLINICAL PRACTICE GUIDELINES. Acute diverticulitis classified by Hinchey staging system: Stage 0 (mild clinical diverticulitis) - confined inflammation, no complications, normal CT or mild wall thickening. Stage Ia (phlegmon) - confined pericolic inflammation/phlegmon without abscess formation. Stage Ib (pericolic/mesenteric abscess) - confined pericolic or mesenteric abscess, localized collection <4cm. Stage II (pelvic abscess) - distant abscess in pelvis or retroperitoneum, collection >4cm requiring drainage. Stage III (purulent peritonitis) - generalized purulent peritonitis from microperforation, free fluid. Stage IV (fecal peritonitis) - generalized fecal peritonitis from macroperforation, free air and fecal contamination. Treatment approach based on severity classification: Uncomplicated diverticulitis (Hinchey 0-Ia): Outpatient management appropriate for most immunocompetent patients, clear liquid diet initially progressing to low-residue diet as tolerated, oral antibiotics (ciprofloxacin 500mg BID + metronidazole 500mg TID OR amoxicillin-clavulanate 875mg BID) for 7-10 days traditionally used but recent evidence shows selective non-antibiotic approach safe in select patients, close follow-up required within 2-3 days, success rate 90-95% for outpatient management. Complicated diverticulitis (Hinchey Ib-IV): Immediate hospitalization required, IV broad-spectrum antibiotics, strict bowel rest (NPO), IV fluid resuscitation, CT scan with IV contrast preferred imaging modality, surgical consultation, interventional radiology for abscess drainage if indicated. Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC7904336/',
          source: 'PMC Clinical Practice Guidelines - Diverticulitis',
          caseId,
          documentType: 'Clinical Guidelines',
          metadata: { category: 'Clinical Practice Guidelines', priority: 'critical', source_url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7904336/' }
        },
        {
          id: 'pmc-diverticulitis-2',
          content: 'Diverticulitis Hospitalization Criteria and Inpatient Management - PMC7904336. ADMISSION CRITERIA (when hospitalization required): Clinical indicators: Inability to tolerate oral intake due to persistent nausea and vomiting, severe clinical symptoms (temperature >102°F/38.9°C, severe abdominal pain requiring parenteral analgesia, signs of peritoneal irritation), immunocompromised state (chronic corticosteroid use, active chemotherapy, solid organ transplant recipients, HIV/AIDS), significant comorbidities affecting management (advanced age >70 years, chronic kidney disease stage 3 or higher, heart failure, COPD, diabetes mellitus), complicated diverticulitis on CT imaging (abscess formation, perforation, fistula, obstruction), failure of outpatient treatment (symptoms worsen or no clinical improvement within 48-72 hours), concern for alternative diagnosis requiring hospital workup (inflammatory bowel disease, malignancy, ischemic colitis), inadequate social support or home care for safe outpatient management, pregnancy. INPATIENT TREATMENT PROTOCOL: Strict bowel rest (NPO - nothing by mouth) initially until clinical improvement, IV fluid resuscitation with normal saline or lactated Ringers to maintain euvolemia, electrolyte monitoring and replacement as needed, IV broad-spectrum antibiotics covering gram-negative and anaerobic organisms initiated promptly (typical antibiotic regimens: ciprofloxacin 400mg IV Q12h + metronidazole 500mg IV Q8h, OR ceftriaxone 1-2g IV daily + metronidazole 500mg IV Q8h, OR piperacillin-tazobactam 3.375g IV Q6h, OR ertapenem 1g IV daily), pain management with IV opioids or IV acetaminophen (avoid NSAIDs which increase perforation risk), antiemetics for nausea control, serial physical examinations every 4-8 hours monitoring for peritoneal signs, complete blood count and inflammatory markers (WBC, CRP) monitoring, repeat CT imaging if clinical deterioration or failure to improve within 48-72 hours. Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC7904336/',
          source: 'PMC Clinical Guidelines - Diverticulitis Inpatient Care',
          caseId,
          documentType: 'Clinical Guidelines',
          metadata: { category: 'Clinical Practice Guidelines', priority: 'critical', source_url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7904336/' }
        },
        {
          id: 'pmc-diverticulitis-3',
          content: 'Diverticulitis Interventional and Surgical Management - PMC7904336. ABSCESS MANAGEMENT: Small abscess (<3-4 cm diameter): Typically managed with IV antibiotics alone without drainage, close monitoring with serial exams and imaging, 80-85% success rate with medical management alone. Large abscess (>4 cm diameter): Percutaneous CT-guided or ultrasound-guided drainage strongly recommended, significantly improves clinical outcomes, allows resolution of acute infection, may avoid emergency surgery and permit elective single-stage resection later, drain left in place until output <10-20 mL/day and patient clinically improved. SURGICAL INTERVENTION INDICATIONS: Emergency/Urgent Surgery Required For: Diffuse peritonitis with free perforation (Hinchey stage III-IV), hemodynamic instability or septic shock despite resuscitation, clinical deterioration despite optimal medical management and drainage, uncontrolled sepsis with multi-organ dysfunction, complete bowel obstruction, inability to exclude perforated malignancy. Elective Surgery Considerations: Recurrent diverticulitis episodes (decision individualized based on frequency, severity, and patient factors - no longer automatic after 2 episodes), persistent symptoms after acute episode resolution, immunocompromised patients (higher risk complications, lower threshold for surgery), complicated diverticulitis with stricture causing obstruction or fistula formation (colovesical, colovaginal, coloenteric), inability to exclude colorectal malignancy on colonoscopy. SURGICAL OPTIONS: Primary resection with primary anastomosis (preferred approach when feasible, single-stage procedure, immediate restoration of bowel continuity, appropriate for hemodynamically stable patients without diffuse contamination), Hartmann procedure (sigmoid resection with end colostomy creation and rectal stump closure, for high-risk patients, severe peritonitis, hemodynamic instability, requires second operation for reversal 3-6 months later), Laparoscopic approach preferred over open when technically feasible (faster recovery, less pain, shorter hospital stay, similar outcomes). DISPOSITION AND FOLLOW-UP: Hospital Discharge Criteria: Tolerating regular or low-residue diet without nausea, pain adequately controlled with oral analgesics, afebrile for >24 hours off antibiotics, white blood cell count normal or near-normal (<12,000), normal or improving inflammatory markers, stable hemodynamics. Outpatient Follow-up Requirements: Colonoscopy mandatory 6-8 weeks after acute episode resolution to rule out colorectal cancer or inflammatory bowel disease (IBD), repeat imaging (CT) if needed to confirm resolution, surgical consultation if recurrent episodes or persistent symptoms. Long-term Prevention: High-fiber diet (25-35g daily) after complete recovery, adequate hydration (8-10 glasses water daily), regular physical activity, avoid nuts/seeds restriction (outdated recommendation, no evidence of harm), patient education on warning signs of recurrence (LLQ pain, fever, change in bowel habits). Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC7904336/',
          source: 'PMC Clinical Guidelines - Diverticulitis Surgical Management',
          caseId,
          documentType: 'Clinical Guidelines',
          metadata: { category: 'Clinical Practice Guidelines', priority: 'critical', source_url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7904336/' }
        }
      ];
    }
    return [];
  }

  private getCaseFolderPath(caseId: string): string {
    const map: Record<string, string> = {
      'PA-2024-001': 'case-001-john-doe',
      'PA-2024-002': 'case-002-jane-smith',
      'PA-2024-003': 'case-003-mike-johnson',
      'PA-2024-004': 'case-004-sarah-wilson',
      'PA-2024-005': 'case-005-david-brown',
      'PA-2024-006': 'case-006-rebecca-hardin',
      'PA-2024-007': 'case-007',
      'PA-2024-008': '008'
    };
    return map[caseId] || 'case-001-john-doe';
  }

  private saveKnowledgeBase(kb: KnowledgeBase): void {
    try {
      const all = this.getAllStoredKnowledgeBases();
      all[kb.caseId] = kb;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  private getStoredKnowledgeBase(caseId: string): KnowledgeBase | null {
    try {
      const all = this.getAllStoredKnowledgeBases();
      return all[caseId] || null;
    } catch (e) {
      return null;
    }
  }

  private getAllStoredKnowledgeBases(): Record<string, KnowledgeBase> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  // Clear knowledge base cache (useful for refreshing data)
  clearCache(caseId?: string): void {
    if (caseId) {
      this.cache.delete(caseId);
      const all = this.getAllStoredKnowledgeBases();
      delete all[caseId];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
      console.log(`🗑️ Cleared cache for ${caseId}`);
    } else {
      this.cache.clear();
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ Cleared all cache');
    }
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();

