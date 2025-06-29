// Updated Supabase Edge Function for native DOCX/PPTX generation
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

// Initialize Supabase client with service role key for admin access
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

// Define type for job parameters
interface GenerateParams {
  jobId: string;
  language: 'ro' | 'en' | 'fr' | 'de' | 'es' | 'it' | 'pt' | 'nl' | 'sv' | 'da';
  subject: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  audience: 'students' | 'professionals' | 'managers';
  duration: '30min' | '1h' | '2h' | '4h' | '8h';
  tone: 'socratic' | 'energizing' | 'funny' | 'professional';
}

// Page limits based on duration
const PAGE_LIMITS = {
  '30min': { slides: 6, facilitator: 2, participant: 5, activities: 4, evaluation: 2, resources: 2 },
  '1h': { slides: 10, facilitator: 4, participant: 8, activities: 8, evaluation: 4, resources: 2 },
  '2h': { slides: 15, facilitator: 6, participant: 10, activities: 10, evaluation: 6, resources: 2 },
  '4h': { slides: 30, facilitator: 9, participant: 15, activities: 12, evaluation: 8, resources: 3 },
  '8h': { slides: 40, facilitator: 10, participant: 20, activities: 14, evaluation: 10, resources: 3 }
};

// Step definitions for the 7-step process
const GENERATION_STEPS = [
  { step: 1, name: 'foundation', title: 'Structură + Obiective + Agendă', format: 'docx' },
  { step: 2, name: 'slides', title: 'Slide-uri de prezentare', format: 'pptx' },
  { step: 3, name: 'facilitator', title: 'Manual facilitator', format: 'docx' },
  { step: 4, name: 'participant', title: 'Manual participant', format: 'docx' },
  { step: 5, name: 'activities', title: 'Activități și exerciții', format: 'docx' },
  { step: 6, name: 'evaluation', title: 'Instrumente de evaluare', format: 'docx' },
  { step: 7, name: 'resources', title: 'Resurse suplimentare', format: 'docx' }
];

// Function to update job status
async function updateJobStatus(
  jobId: string, 
  status: "pending" | "processing" | "completed" | "failed",
  updates: Record<string, any>
) {
  try {
    const { error } = await supabaseAdmin
      .from("jobs")
      .update({
        status,
        updatedAt: new Date().toISOString(),
        ...updates
      })
      .eq("id", jobId);
    
    if (error) throw error;
  } catch (err) {
    console.error("Error updating job status:", err);
  }
}

// Helper function to escape XML content
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Create a proper ZIP file using Deno's standard library
async function createZipFile(files: Map<string, Uint8Array>): Promise<Uint8Array> {
  // Create a temporary file to write the ZIP
  const tempFile = await Deno.makeTempFile({ suffix: '.zip' });
  
  try {
    // Create ZIP file
    const zipFile = new Deno.Command('zip', {
      args: ['-r', tempFile, '.'],
      cwd: '/tmp',
      stdout: 'piped',
      stderr: 'piped'
    });

    // Create a temporary directory structure
    const tempDir = await Deno.makeTempDir();
    
    try {
      // Write all files to the temporary directory
      for (const [filePath, content] of files) {
        const fullPath = `${tempDir}/${filePath}`;
        const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
        
        // Create directory structure
        await Deno.mkdir(dir, { recursive: true });
        
        // Write file
        await Deno.writeFile(fullPath, content);
      }
      
      // Create ZIP using a simpler approach - manual ZIP creation
      return await createManualZip(files);
      
    } finally {
      // Clean up temp directory
      try {
        await Deno.remove(tempDir, { recursive: true });
      } catch (e) {
        console.warn('Failed to clean up temp directory:', e);
      }
    }
  } finally {
    // Clean up temp file
    try {
      await Deno.remove(tempFile);
    } catch (e) {
      console.warn('Failed to clean up temp file:', e);
    }
  }
}

// Manual ZIP creation for better compatibility
async function createManualZip(files: Map<string, Uint8Array>): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  // Local file headers and data
  for (const [fileName, content] of files) {
    const fileNameBytes = encoder.encode(fileName);
    
    // Local file header
    const localHeader = new Uint8Array(30 + fileNameBytes.length);
    const view = new DataView(localHeader.buffer);
    
    // Local file header signature
    view.setUint32(0, 0x04034b50, true);
    // Version needed to extract
    view.setUint16(4, 20, true);
    // General purpose bit flag
    view.setUint16(6, 0, true);
    // Compression method (0 = no compression)
    view.setUint16(8, 0, true);
    // Last mod file time
    view.setUint16(10, 0, true);
    // Last mod file date
    view.setUint16(12, 0, true);
    // CRC-32
    view.setUint32(14, calculateCRC32(content), true);
    // Compressed size
    view.setUint32(18, content.length, true);
    // Uncompressed size
    view.setUint32(22, content.length, true);
    // File name length
    view.setUint16(26, fileNameBytes.length, true);
    // Extra field length
    view.setUint16(28, 0, true);
    
    // Copy filename
    localHeader.set(fileNameBytes, 30);
    
    chunks.push(localHeader);
    chunks.push(content);
    
    // Central directory entry
    const centralEntry = new Uint8Array(46 + fileNameBytes.length);
    const centralView = new DataView(centralEntry.buffer);
    
    // Central file header signature
    centralView.setUint32(0, 0x02014b50, true);
    // Version made by
    centralView.setUint16(4, 20, true);
    // Version needed to extract
    centralView.setUint16(6, 20, true);
    // General purpose bit flag
    centralView.setUint16(8, 0, true);
    // Compression method
    centralView.setUint16(10, 0, true);
    // Last mod file time
    centralView.setUint16(12, 0, true);
    // Last mod file date
    centralView.setUint16(14, 0, true);
    // CRC-32
    centralView.setUint32(16, calculateCRC32(content), true);
    // Compressed size
    centralView.setUint32(20, content.length, true);
    // Uncompressed size
    centralView.setUint32(24, content.length, true);
    // File name length
    centralView.setUint16(28, fileNameBytes.length, true);
    // Extra field length
    centralView.setUint16(30, 0, true);
    // File comment length
    centralView.setUint16(32, 0, true);
    // Disk number start
    centralView.setUint16(34, 0, true);
    // Internal file attributes
    centralView.setUint16(36, 0, true);
    // External file attributes
    centralView.setUint32(38, 0, true);
    // Relative offset of local header
    centralView.setUint32(42, offset, true);
    
    // Copy filename
    centralEntry.set(fileNameBytes, 46);
    
    centralDirectory.push(centralEntry);
    
    offset += localHeader.length + content.length;
  }
  
  // Calculate central directory size
  const centralDirSize = centralDirectory.reduce((sum, entry) => sum + entry.length, 0);
  
  // End of central directory record
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  
  // End of central dir signature
  endView.setUint32(0, 0x06054b50, true);
  // Number of this disk
  endView.setUint16(4, 0, true);
  // Number of the disk with the start of the central directory
  endView.setUint16(6, 0, true);
  // Total number of entries in the central directory on this disk
  endView.setUint16(8, files.size, true);
  // Total number of entries in the central directory
  endView.setUint16(10, files.size, true);
  // Size of the central directory
  endView.setUint32(12, centralDirSize, true);
  // Offset of start of central directory
  endView.setUint32(16, offset, true);
  // ZIP file comment length
  endView.setUint16(20, 0, true);
  
  // Combine all parts
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0) + centralDirSize + endRecord.length;
  const result = new Uint8Array(totalSize);
  let pos = 0;
  
  // Copy local headers and data
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  
  // Copy central directory
  for (const entry of centralDirectory) {
    result.set(entry, pos);
    pos += entry.length;
  }
  
  // Copy end record
  result.set(endRecord, pos);
  
  return result;
}

// Simple CRC32 calculation
function calculateCRC32(data: Uint8Array): number {
  const crcTable = new Uint32Array(256);
  
  // Generate CRC table
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    crcTable[i] = crc;
  }
  
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate DOCX content with proper XML structure
function generateDocxContent(content: string, title: string): Uint8Array {
  const encoder = new TextEncoder();
  
  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  // Create document.xml with proper structure
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Title"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="28"/>
        </w:rPr>
        <w:t>${escapeXml(title)}</w:t>
      </w:r>
    </w:p>
    ${paragraphs.map(paragraph => {
      // Check if paragraph is a heading (starts with #)
      if (paragraph.trim().startsWith('#')) {
        const headingText = paragraph.replace(/^#+\s*/, '').trim();
        return `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
        </w:rPr>
        <w:t>${escapeXml(headingText)}</w:t>
      </w:r>
    </w:p>`;
      } else {
        return `
    <w:p>
      <w:r>
        <w:t>${escapeXml(paragraph.trim())}</w:t>
      </w:r>
    </w:p>`;
      }
    }).join('')}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  // Content Types
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/webSettings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml"/>
  <Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

  // Main relationships
  const mainRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

  // Document relationships
  const documentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings" Target="webSettings.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>
</Relationships>`;

  // Styles
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="259" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:link w:val="TitleChar"/>
    <w:uiPriority w:val="10"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="0" w:line="240" w:lineRule="auto"/>
      <w:contextualSpacing/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:asciiTheme="majorHAnsi" w:eastAsiaTheme="majorEastAsia" w:hAnsiTheme="majorHAnsi" w:cstheme="majorBidi"/>
      <w:spacing w:val="5"/>
      <w:kern w:val="28"/>
      <w:sz w:val="56"/>
      <w:szCs w:val="56"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:link w:val="Heading1Char"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="240" w:after="0" w:line="240" w:lineRule="auto"/>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:asciiTheme="majorHAnsi" w:eastAsiaTheme="majorEastAsia" w:hAnsiTheme="majorHAnsi" w:cstheme="majorBidi"/>
      <w:color w:val="2F5496" w:themeColor="accent1" w:themeShade="BF"/>
      <w:sz w:val="32"/>
      <w:szCs w:val="32"/>
    </w:rPr>
  </w:style>
</w:styles>`;

  // Settings
  const settings = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:defaultTabStop w:val="708"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
  <w:compat>
    <w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>
  </w:compat>
</w:settings>`;

  // Web Settings
  const webSettings = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:webSettings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:optimizeForBrowser/>
</w:webSettings>`;

  // Font Table
  const fontTable = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:font w:name="Calibri">
    <w:panose1 w:val="020F0502020204030204"/>
    <w:charset w:val="00"/>
    <w:family w:val="swiss"/>
    <w:pitch w:val="variable"/>
    <w:sig w:usb0="E00002FF" w:usb1="4000ACFF" w:usb2="00000001" w:usb3="00000000" w:csb0="0000019F" w:csb1="00000000"/>
  </w:font>
</w:fonts>`;

  // Core properties
  const coreProps = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(title)}</dc:title>
  <dc:creator>Automator.ro</dc:creator>
  <cp:lastModifiedBy>Automator.ro</cp:lastModifiedBy>
  <cp:revision>1</cp:revision>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`;

  // App properties
  const appProps = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Automator.ro</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0000</AppVersion>
</Properties>`;

  const files = new Map([
    ['[Content_Types].xml', encoder.encode(contentTypes)],
    ['_rels/.rels', encoder.encode(mainRels)],
    ['word/_rels/document.xml.rels', encoder.encode(documentRels)],
    ['word/document.xml', encoder.encode(documentXml)],
    ['word/styles.xml', encoder.encode(styles)],
    ['word/settings.xml', encoder.encode(settings)],
    ['word/webSettings.xml', encoder.encode(webSettings)],
    ['word/fontTable.xml', encoder.encode(fontTable)],
    ['docProps/core.xml', encoder.encode(coreProps)],
    ['docProps/app.xml', encoder.encode(appProps)]
  ]);

  return createManualZip(files);
}

// Generate PPTX content with proper XML structure
function generatePptxContent(content: string, title: string): Uint8Array {
  const encoder = new TextEncoder();
  
  // Parse slides from content
  const slideContents = content.split('\n\n## ').filter(slide => slide.trim());
  if (slideContents.length === 0) {
    slideContents.push(content);
  }
  
  // Ensure first slide has title
  if (!slideContents[0].startsWith('## ')) {
    slideContents[0] = `## ${title}\n\n${slideContents[0]}`;
  }

  // Content Types
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  ${slideContents.map((_, index) => 
    `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
  ).join('\n  ')}
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

  // Main relationships
  const mainRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

  // Presentation XML
  const presentationXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    ${slideContents.map((_, index) => `
    <p:sldId id="${2147483649 + index}" r:id="rId${index + 2}"/>
    `).join('')}
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;

  // Presentation relationships
  const presentationRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  ${slideContents.map((_, index) => 
    `<Relationship Id="rId${index + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`
  ).join('\n  ')}
  <Relationship Id="rId${slideContents.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;

  // Slide Master
  const slideMaster = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1"/>
  </p:sldLayoutIdLst>
</p:sldMaster>`;

  // Slide Layout
  const slideLayout = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" type="title">
  <p:cSld name="Title Slide">
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
</p:sldLayout>`;

  // Generate individual slides
  const slides = slideContents.map((slideContent, index) => {
    const lines = slideContent.split('\n').filter(line => line.trim());
    const slideTitle = lines[0]?.replace(/^##\s*/, '') || `Slide ${index + 1}`;
    const slideText = lines.slice(1).join('\n');

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title 1"/>
          <p:cNvSpPr>
            <a:spLocks noGrp="1"/>
          </p:cNvSpPr>
          <p:nvPr>
            <p:ph type="ctrTitle"/>
          </p:nvPr>
        </p:nvSpPr>
        <p:spPr/>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" dirty="0" smtClean="0"/>
              <a:t>${escapeXml(slideTitle)}</a:t>
            </a:r>
            <a:endParaRPr lang="en-US" dirty="0"/>
          </a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="3" name="Content Placeholder 2"/>
          <p:cNvSpPr>
            <a:spLocks noGrp="1"/>
          </p:cNvSpPr>
          <p:nvPr>
            <p:ph idx="1"/>
          </p:nvPr>
        </p:nvSpPr>
        <p:spPr/>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" dirty="0" smtClean="0"/>
              <a:t>${escapeXml(slideText)}</a:t>
            </a:r>
            <a:endParaRPr lang="en-US" dirty="0"/>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</p:sld>`;
  });

  // Theme
  const theme = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1>
        <a:sysClr val="windowText" lastClr="000000"/>
      </a:dk1>
      <a:lt1>
        <a:sysClr val="window" lastClr="FFFFFF"/>
      </a:lt1>
      <a:dk2>
        <a:srgbClr val="44546A"/>
      </a:dk2>
      <a:lt2>
        <a:srgbClr val="E7E6E6"/>
      </a:lt2>
      <a:accent1>
        <a:srgbClr val="4472C4"/>
      </a:accent1>
      <a:accent2>
        <a:srgbClr val="E7E6E6"/>
      </a:accent2>
      <a:accent3>
        <a:srgbClr val="A5A5A5"/>
      </a:accent3>
      <a:accent4>
        <a:srgbClr val="FFC000"/>
      </a:accent4>
      <a:accent5>
        <a:srgbClr val="5B9BD5"/>
      </a:accent5>
      <a:accent6>
        <a:srgbClr val="70AD47"/>
      </a:accent6>
      <a:hlink>
        <a:srgbClr val="0563C1"/>
      </a:hlink>
      <a:folHlink>
        <a:srgbClr val="954F72"/>
      </a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont>
        <a:latin typeface="Calibri Light" panose="020F0302020204030204"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Calibri" panose="020F0502020204030204"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst>
        <a:solidFill>
          <a:schemeClr val="phClr"/>
        </a:solidFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0">
              <a:schemeClr val="phClr">
                <a:lumMod val="110000"/>
                <a:satMod val="105000"/>
                <a:tint val="67000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="50000">
              <a:schemeClr val="phClr">
                <a:lumMod val="105000"/>
                <a:satMod val="103000"/>
                <a:tint val="73000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="100000">
              <a:schemeClr val="phClr">
                <a:lumMod val="105000"/>
                <a:satMod val="109000"/>
                <a:tint val="81000"/>
              </a:schemeClr>
            </a:gs>
          </a:gsLst>
          <a:lin ang="5400000" scaled="0"/>
        </a:gradFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0">
              <a:schemeClr val="phClr">
                <a:satMod val="103000"/>
                <a:lumMod val="102000"/>
                <a:tint val="94000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="50000">
              <a:schemeClr val="phClr">
                <a:satMod val="110000"/>
                <a:lumMod val="100000"/>
                <a:shade val="100000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="100000">
              <a:schemeClr val="phClr">
                <a:lumMod val="99000"/>
                <a:satMod val="120000"/>
                <a:shade val="78000"/>
              </a:schemeClr>
            </a:gs>
          </a:gsLst>
          <a:lin ang="5400000" scaled="0"/>
        </a:gradFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="6350" cap="flat" cmpd="sng" algn="ctr">
          <a:solidFill>
            <a:schemeClr val="phClr"/>
          </a:solidFill>
          <a:prstDash val="solid"/>
          <a:miter lim="800000"/>
        </a:ln>
        <a:ln w="12700" cap="flat" cmpd="sng" algn="ctr">
          <a:solidFill>
            <a:schemeClr val="phClr"/>
          </a:solidFill>
          <a:prstDash val="solid"/>
          <a:miter lim="800000"/>
        </a:ln>
        <a:ln w="19050" cap="flat" cmpd="sng" algn="ctr">
          <a:solidFill>
            <a:schemeClr val="phClr"/>
          </a:solidFill>
          <a:prstDash val="solid"/>
          <a:miter lim="800000"/>
        </a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst>
        <a:effectStyle>
          <a:effectLst/>
        </a:effectStyle>
        <a:effectStyle>
          <a:effectLst/>
        </a:effectStyle>
        <a:effectStyle>
          <a:effectLst>
            <a:outerShdw blurRad="57150" dist="19050" dir="5400000" algn="ctr" rotWithShape="0">
              <a:srgbClr val="000000">
                <a:alpha val="63000"/>
              </a:srgbClr>
            </a:outerShdw>
          </a:effectLst>
        </a:effectStyle>
      </a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill>
          <a:schemeClr val="phClr"/>
        </a:solidFill>
        <a:solidFill>
          <a:schemeClr val="phClr">
            <a:tint val="95000"/>
            <a:satMod val="170000"/>
          </a:schemeClr>
        </a:solidFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0">
              <a:schemeClr val="phClr">
                <a:tint val="93000"/>
                <a:satMod val="150000"/>
                <a:shade val="98000"/>
                <a:lumMod val="102000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="50000">
              <a:schemeClr val="phClr">
                <a:tint val="98000"/>
                <a:satMod val="130000"/>
                <a:shade val="90000"/>
                <a:lumMod val="103000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="100000">
              <a:schemeClr val="phClr">
                <a:shade val="63000"/>
                <a:satMod val="120000"/>
              </a:schemeClr>
            </a:gs>
          </a:gsLst>
          <a:lin ang="5400000" scaled="0"/>
        </a:gradFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`;

  // Core properties
  const coreProps = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(title)}</dc:title>
  <dc:creator>Automator.ro</dc:creator>
  <cp:lastModifiedBy>Automator.ro</cp:lastModifiedBy>
  <cp:revision>1</cp:revision>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`;

  // App properties
  const appProps = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Automator.ro</Application>
  <PresentationFormat>Widescreen</PresentationFormat>
  <Slides>${slideContents.length}</Slides>
  <ScaleCrop>false</ScaleCrop>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0000</AppVersion>
</Properties>`;

  const files = new Map([
    ['[Content_Types].xml', encoder.encode(contentTypes)],
    ['_rels/.rels', encoder.encode(mainRels)],
    ['ppt/_rels/presentation.xml.rels', encoder.encode(presentationRels)],
    ['ppt/presentation.xml', encoder.encode(presentationXml)],
    ['ppt/slideMasters/slideMaster1.xml', encoder.encode(slideMaster)],
    ['ppt/slideLayouts/slideLayout1.xml', encoder.encode(slideLayout)],
    ['ppt/theme/theme1.xml', encoder.encode(theme)],
    ['docProps/core.xml', encoder.encode(coreProps)],
    ['docProps/app.xml', encoder.encode(appProps)]
  ]);

  // Add individual slides
  slides.forEach((slide, index) => {
    files.set(`ppt/slides/slide${index + 1}.xml`, encoder.encode(slide));
  });

  return createManualZip(files);
}

// Generate mock content for demonstration - Enhanced for longer documents
function generateMockContent(stepInfo: any, params: GenerateParams): string {
  const { subject, duration, level, audience } = params;
  const limits = PAGE_LIMITS[duration];
  
  // Helper function to repeat content based on page limits
  const repeatContent = (baseContent: string, targetPages: number) => {
    const sections = baseContent.split('\n\n');
    let result = baseContent;
    
    // Estimate current pages (rough: 500 chars per page)
    let currentLength = baseContent.length;
    const targetLength = targetPages * 500;
    
    while (currentLength < targetLength) {
      // Add variations of existing sections
      sections.forEach(section => {
        if (currentLength < targetLength) {
          result += '\n\n' + section.replace(/Modulul \d+/g, `Modulul ${Math.floor(Math.random() * 10) + 1}`);
          currentLength = result.length;
        }
      });
    }
    
    return result;
  };
  
  switch (stepInfo.step) {
    case 1:
      const foundationContent = `# ${subject} - Structură și Obiective

## 1. STRUCTURA CURSULUI

### Modulul 1: Introducere în ${subject}
- Prezentarea conceptelor fundamentale
- Contextul și importanța în domeniu
- Obiectivele generale ale cursului
- Metodologia de lucru

### Modulul 2: Concepte fundamentale
- Terminologia specifică
- Principiile de bază
- Teoriile principale
- Modelele conceptuale

### Modulul 3: Aplicații practice
- Studii de caz relevante
- Exerciții practice
- Simulări și demonstrații
- Proiecte hands-on

### Modulul 4: Implementare și evaluare
- Strategii de implementare
- Măsurarea rezultatelor
- Feedback și îmbunătățire continuă
- Planuri de acțiune

## 2. OBIECTIVE DE ÎNVĂȚARE

### Obiective generale:
- Înțelegerea conceptelor fundamentale ale ${subject}
- Dezvoltarea competențelor practice necesare
- Aplicarea cunoștințelor în contexte reale
- Evaluarea critică a rezultatelor

### Obiective specifice (Taxonomia lui Bloom):

#### Nivel de Cunoaștere:
- Identificarea conceptelor cheie din ${subject}
- Recunoașterea terminologiei specifice
- Enumerarea principiilor fundamentale
- Descrierea proceselor de bază

#### Nivel de Înțelegere:
- Explicarea principiilor de bază
- Interpretarea datelor și informațiilor
- Exemplificarea conceptelor teoretice
- Compararea diferitelor abordări

#### Nivel de Aplicare:
- Utilizarea tehnicilor în practică
- Implementarea soluțiilor propuse
- Demonstrarea competențelor dobândite
- Rezolvarea problemelor concrete

#### Nivel de Analiză:
- Evaluarea diferitelor abordări
- Analiza studiilor de caz
- Identificarea factorilor critici
- Compararea rezultatelor

## 3. AGENDA DETALIATĂ (${duration})

### Ziua 1 - Fundamentele
09:00-09:30: **Introducere și prezentări**
- Prezentarea participanților
- Așteptări și obiective personale
- Prezentarea agendei
- Regulile de funcționare

09:30-10:30: **Modulul 1 - Concepte de bază**
- Introducerea în ${subject}
- Contextul actual al domeniului
- Provocările și oportunitățile
- Discuții interactive

10:30-10:45: **Pauză**

10:45-11:45: **Modulul 2 - Principii fundamentale**
- Teoriile de bază
- Modelele conceptuale
- Exemple practice
- Exerciții de grup

11:45-12:00: **Pauză**

12:00-13:00: **Aplicații practice - Partea I**
- Studiu de caz 1
- Analiza în echipe
- Prezentarea soluțiilor
- Feedback și discuții

13:00-14:00: **Pauză de masă**

14:00-15:00: **Aplicații practice - Partea II**
- Studiu de caz 2
- Workshop practic
- Implementarea soluțiilor
- Evaluarea rezultatelor

15:00-15:15: **Pauză**

15:15-16:15: **Implementare și planificare**
- Strategii de implementare
- Planuri de acțiune
- Identificarea resurselor
- Timeline și milestone-uri

16:15-16:30: **Evaluare și închidere**
- Recapitularea obiectivelor
- Evaluarea cursului
- Pașii următori
- Resurse suplimentare`;

      return repeatContent(foundationContent, 3);

    case 2:
      const slidesContent = `# Slide-uri Prezentare - ${subject}

## Slide 1: Titlu
**Titlu:** ${subject} pentru ${audience}
**Conținut:** 
- Curs de ${duration} - Nivel ${level}
- Facilitator: Expert în domeniu
- Data și locația cursului
**Note:** Creează conexiunea cu audiența, stabilește tonul profesional

## Slide 2: Agenda
**Conținut:** 
- Obiectivele cursului
- Modulele principale
- Metodologia de lucru
- Evaluarea și certificarea
**Note:** Subliniază beneficiile pentru participanți, explică structura

## Slide 3: Obiective de învățare
**Conținut:** 
- Ce vor învăța participanții
- Competențele care se vor dezvolta
- Aplicabilitatea în practică
- Rezultatele așteptate
**Note:** Conectează cu experiența lor, motivează participarea

## Slide 4: Introducere în ${subject}
**Conținut:**
- Definiția și importanța
- Contextul actual
- Provocările din domeniu
- Oportunitățile de dezvoltare
**Note:** Stabilește fundamentele, captează atenția

## Slide 5: Principii fundamentale
**Conținut:**
- Conceptele cheie
- Teoriile de bază
- Modelele aplicabile
- Best practices din industrie
**Note:** Explică pas cu pas, folosește exemple concrete

## Slide 6: Metodologia de lucru
**Conținut:**
- Abordarea practică
- Instrumentele utilizate
- Procesul de implementare
- Măsurarea rezultatelor
**Note:** Demonstrează aplicabilitatea, încurajează participarea

## Slide 7: Studiu de caz 1
**Conținut:**
- Contextul problemei
- Provocările identificate
- Soluțiile propuse
- Rezultatele obținute
**Note:** Facilitează discuțiile, încurajează întrebările

## Slide 8: Exercițiu practic
**Conținut:**
- Instrucțiunile pentru exercițiu
- Obiectivele specifice
- Timpul alocat
- Criteriile de evaluare
**Note:** Asigură înțelegerea sarcinilor, oferă suport

## Slide 9: Implementarea în practică
**Conținut:**
- Pașii de implementare
- Resursele necesare
- Potențialele obstacole
- Strategiile de succes
**Note:** Conectează teoria cu practica, oferă soluții concrete

## Slide 10: Evaluare și feedback
**Conținut:**
- Metodele de evaluare
- Criteriile de succes
- Procesul de feedback
- Îmbunătățirea continuă
**Note:** Încurajează autoevaluarea, promovează învățarea continuă`;

      return repeatContent(slidesContent, limits.slides);

    case 3:
      const facilitatorContent = `# Manual Facilitator - ${subject}

## 1. GHID DE PREZENTARE

### Pregătirea sesiunii
- Verificarea echipamentelor tehnice
- Pregătirea materialelor
- Amenajarea spațiului
- Testarea conexiunilor

### Script detaliat de prezentare

#### Introducerea (30 minute)
**Obiectiv:** Crearea unui climat pozitiv și stabilirea așteptărilor

**Script:**
"Bună ziua și bun venit la cursul de ${subject}. Sunt [numele facilitatorului] și vă voi ghida în această călătorie de învățare. Înainte de a începe, să ne cunoaștem mai bine..."

**Activități:**
1. Prezentarea facilitatorului (5 min)
2. Turul de prezentări al participanților (15 min)
3. Stabilirea regulilor de funcționare (5 min)
4. Prezentarea agendei și obiectivelor (5 min)

**Întrebări de facilitare:**
- "Ce vă motivează să participați la acest curs?"
- "Ce așteptări aveți de la această sesiune?"
- "Cum putem face această experiență cât mai valoroasă pentru toți?"

#### Modulul 1: Concepte fundamentale (60 minute)
**Obiectiv:** Stabilirea bazelor teoretice

**Script:**
"Să începem cu fundamentele. ${subject} este un domeniu complex care..."

**Timing și tranziții:**
- 0-15 min: Prezentarea conceptelor (slide-uri 4-5)
- 15-30 min: Discuții interactive
- 30-45 min: Exercițiu de grup
- 45-60 min: Prezentarea rezultatelor și feedback

**Întrebări cheie:**
- "Cum se aplică aceste concepte în activitatea voastră?"
- "Ce provocări întâmpinați în practică?"
- "Care sunt experiențele voastre relevante?"

## 2. MANAGEMENT ACTIVITĂȚI

### Activitatea 1: Brainstorming
**Durata:** 20 minute
**Participanți:** Toți, în grupuri de 4-5

**Instrucțiuni pas cu pas:**
1. Împărțirea în grupuri (2 min)
2. Prezentarea sarcinii (3 min)
3. Brainstorming în grupuri (10 min)
4. Prezentarea ideilor (5 min)

**Criterii de observare:**
- Participarea activă a tuturor membrilor
- Calitatea ideilor generate
- Colaborarea în echipă
- Respectarea timpului alocat

**Tehnici de debriefing:**
- "Ce ați descoperit în timpul acestui exercițiu?"
- "Care au fost cele mai valoroase idei?"
- "Cum puteți aplica aceste concepte în practică?"

### Activitatea 2: Studiu de caz
**Durata:** 45 minute
**Participanți:** Echipe de 3-4 persoane

**Instrucțiuni:**
1. Prezentarea cazului (5 min)
2. Analiza în echipe (25 min)
3. Pregătirea prezentării (10 min)
4. Prezentări și feedback (5 min)

**Materiale necesare:**
- Descrierea cazului (handout)
- Flipchart și markere
- Timer pentru cronometrare

## 3. SITUAȚII DIFICILE

### Scenariul 1: Participant dominant
**Descriere:** Un participant monopolizează discuțiile

**Strategii de răspuns:**
- Recunoașterea contribuției: "Mulțumesc pentru perspectiva ta valoroasă..."
- Redirectionarea: "Să auzim și alte puncte de vedere..."
- Stabilirea regulilor: "Să ne asigurăm că toți au șansa să contribuie..."

**Tehnici de re-focalizare:**
- Folosirea întrebărilor directe către alți participanți
- Împărțirea în grupuri mici
- Stabilirea unui timp limitat pentru intervenții

### Scenariul 2: Participant pasiv
**Descriere:** Un participant nu se implică în activități

**Strategii de abordare:**
- Întrebări directe, dar non-amenințătoare
- Încurajarea prin contact vizual
- Crearea de oportunități de participare în siguranță

### Scenariul 3: Rezistența la schimbare
**Descriere:** Participanții sunt sceptici față de noile concepte

**Tehnici de management:**
- Ascultarea activă a preocupărilor
- Oferirea de exemple concrete
- Conectarea cu experiențele lor
- Demonstrarea beneficiilor practice

## 4. MATERIALE ȘI LOGISTICĂ

### Lista materialelor necesare:
- Laptop și proiector
- Flipchart și markere
- Post-it notes și pix-uri
- Handout-uri pentru participanți
- Certificate de participare

### Amenajarea sălii:
- Configurația în U pentru interacțiune
- Spațiu pentru lucrul în grupuri
- Acces la prize electrice
- Iluminare adecvată

### Backup plan:
- Materiale printate în caz de probleme tehnice
- Activități alternative pentru grupuri mici
- Contacte pentru suport tehnic`;

      return repeatContent(facilitatorContent, limits.facilitator);

    case 4:
      const participantContent = `# Manual Participant - ${subject}

## Bun venit la cursul de ${subject}!

Acest manual vă va ghida pe parcursul întregii sesiuni de învățare și vă va servi ca resursă de referință și după finalizarea cursului.

## Modulul 1: Introducere în ${subject}

### TEORIA ESENȚIALĂ

#### Ce este ${subject}?
${subject} reprezintă un domeniu complex și dinamic care joacă un rol crucial în succesul organizațional. Conceptele fundamentale includ:

- **Definiția:** [Spațiu pentru notițe]
- **Importanța:** [Spațiu pentru notițe]
- **Aplicabilitatea:** [Spațiu pentru notițe]

#### Principiile de bază
1. **Principiul 1:** [Descriere]
2. **Principiul 2:** [Descriere]
3. **Principiul 3:** [Descriere]

### SPAȚII PENTRU NOTIȚE

**Întrebări pentru reflecție:**
- Cum se aplică aceste concepte în activitatea mea zilnică?
[Spațiu pentru răspuns]

- Ce provocări întâmpin în implementarea acestor principii?
[Spațiu pentru răspuns]

- Care sunt oportunitățile de îmbunătățire?
[Spațiu pentru răspuns]

### EXERCIȚII PRACTICE

#### Exercițiul 1: Autodiagnostic
**Obiectiv:** Evaluarea nivelului actual de cunoștințe

**Instrucțiuni:**
1. Completați chestionarul de mai jos
2. Analizați rezultatele
3. Identificați ariile de dezvoltare

**Chestionar:**
1. Pe o scară de la 1 la 10, cum evaluați cunoștințele voastre actuale în ${subject}?
   Răspuns: ___

2. Care sunt cele mai mari provocări pe care le întâmpinați?
   [Spațiu pentru răspuns]

3. Ce rezultate sperați să obțineți din acest curs?
   [Spațiu pentru răspuns]

#### Exercițiul 2: Studiu de caz
**Situația:** [Descrierea cazului]

**Sarcina voastră:**
1. Analizați situația prezentată
2. Identificați problemele principale
3. Propuneți soluții concrete
4. Justificați alegerile făcute

**Analiza voastră:**
[Spațiu generos pentru răspuns]

## Modulul 2: Concepte avansate

### TEORIA ESENȚIALĂ

#### Modelele teoretice
În ${subject}, există mai multe modele teoretice care ne ajută să înțelegem și să aplicăm conceptele:

**Modelul 1: [Numele modelului]**
- Descriere: [Spațiu pentru notițe]
- Aplicabilitate: [Spațiu pentru notițe]
- Avantaje: [Spațiu pentru notițe]
- Limitări: [Spațiu pentru notițe]

**Modelul 2: [Numele modelului]**
- Descriere: [Spațiu pentru notițe]
- Aplicabilitate: [Spațiu pentru notițe]
- Avantaje: [Spațiu pentru notițe]
- Limitări: [Spațiu pentru notițe]

### APLICAREA ÎN PRACTICĂ

#### Checklist pentru implementare
□ Am înțeles conceptele fundamentale
□ Am identificat ariile de aplicare în organizația mea
□ Am stabilit obiective concrete
□ Am planificat pașii de implementare
□ Am identificat resursele necesare
□ Am stabilit indicatori de măsurare

#### Template pentru planul de acțiune

**Obiectivul principal:**
[Spațiu pentru completare]

**Pașii de implementare:**
1. [Spațiu pentru completare]
2. [Spațiu pentru completare]
3. [Spațiu pentru completare]

**Resursele necesare:**
- Umane: [Spațiu pentru completare]
- Financiare: [Spațiu pentru completare]
- Tehnice: [Spațiu pentru completare]

**Timeline:**
- Săptămâna 1: [Spațiu pentru completare]
- Săptămâna 2: [Spațiu pentru completare]
- Luna 1: [Spațiu pentru completare]

**Indicatori de succes:**
1. [Spațiu pentru completare]
2. [Spațiu pentru completare]
3. [Spațiu pentru completare]

## Modulul 3: Aplicații practice

### STUDII DE CAZ DETALIATE

#### Studiul de caz 1: [Titlul]
**Context:** [Descrierea situației]

**Provocările identificate:**
1. [Provocarea 1]
2. [Provocarea 2]
3. [Provocarea 3]

**Soluțiile implementate:**
[Descrierea detaliată]

**Rezultatele obținute:**
[Analiza rezultatelor]

**Lecțiile învățate:**
[Spațiu pentru notițe personale]

### EXERCIȚII DE GRUP

#### Workshop practic
**Sarcina:** Dezvoltarea unei strategii de implementare pentru organizația voastră

**Pașii de urmat:**
1. Formarea echipelor (3-4 persoane)
2. Alegerea unei situații reale din organizație
3. Aplicarea conceptelor învățate
4. Dezvoltarea unui plan de acțiune
5. Prezentarea soluției

**Template pentru prezentare:**
- Situația aleasă: [Descriere]
- Conceptele aplicate: [Lista]
- Planul de acțiune: [Pași concreți]
- Rezultatele așteptate: [Beneficii]

## RESURSE PENTRU DEZVOLTAREA CONTINUĂ

### Cărți recomandate:
1. [Titlul cărții] - [Autorul]
2. [Titlul cărții] - [Autorul]
3. [Titlul cărții] - [Autorul]

### Website-uri utile:
- [URL 1] - [Descriere]
- [URL 2] - [Descriere]
- [URL 3] - [Descriere]

### Comunități profesionale:
- [Numele comunității] - [Contact]
- [Numele comunității] - [Contact]

## EVALUAREA CURSULUI

### Feedback pentru facilitator:
**Ce a fost cel mai util?**
[Spațiu pentru răspuns]

**Ce ar putea fi îmbunătățit?**
[Spațiu pentru răspuns]

**Recomandați acest curs?**
□ Da □ Nu

**Motivația:**
[Spațiu pentru răspuns]

### Planul personal de dezvoltare:
**Următorii pași:**
1. [Acțiunea 1] - Termen: [Data]
2. [Acțiunea 2] - Termen: [Data]
3. [Acțiunea 3] - Termen: [Data]

**Resurse de care am nevoie:**
[Spațiu pentru completare]

**Cum voi măsura progresul:**
[Spațiu pentru completare]`;

      return repeatContent(participantContent, limits.participant);

    case 5:
      const activitiesContent = `# Activități și Exerciții - ${subject}

## 1. ACTIVITĂȚI EXPERIENȚIALE

### Activitatea 1: Simulare practică
**OBIECTIV:** Aplicarea conceptelor în context real
**DURATA:** 45 minute
**PARTICIPANȚI:** Grupuri de 4-5 persoane
**NIVEL:** ${level}

**PREGĂTIREA:**
- Materiale necesare: Flipchart, markere, post-it notes, cronometru
- Setup sală: Mese pentru grupuri, spațiu pentru prezentări
- Briefing facilitator: Explicarea obiectivelor și regulilor

**DESFĂȘURAREA:**

**Pasul 1: Introducerea scenariului (10 minute)**
Facilitatorul prezintă situația: "Imaginați-vă că sunteți o echipă de consultanți angajată să implementeze ${subject} într-o organizație de ${audience}..."

**Pasul 2: Analiza în grupuri (20 minute)**
- Fiecare grup primește un scenariu specific
- Identificarea provocărilor principale
- Dezvoltarea unei strategii de abordare
- Planificarea implementării

**Pasul 3: Prezentarea soluțiilor (10 minute)**
- Fiecare grup prezintă soluția (3 minute)
- Întrebări și clarificări (2 minute)

**Pasul 4: Debriefing (5 minute)**
- Identificarea pattern-urilor comune
- Lecțiile învățate
- Aplicabilitatea în practică

**CRITERII DE OBSERVARE:**
- Calitatea analizei situației
- Creativitatea soluțiilor propuse
- Colaborarea în echipă
- Prezentarea clară a ideilor

**VARIANTE PENTRU DIFERITE NIVELURI:**
- Începător: Scenarii simple, cu ghidare pas cu pas
- Intermediar: Situații complexe, cu multiple variabile
- Avansat: Cazuri ambigue, cu informații incomplete

### Activitatea 2: Joc de rol - Negocierea schimbării
**OBIECTIV:** Dezvoltarea abilităților de comunicare și persuasiune
**DURATA:** 60 minute
**PARTICIPANȚI:** Perechi + observatori

**SCENARIUL:**
Unul dintre participanți joacă rolul unui manager care vrea să implementeze ${subject}, celălalt este un angajat rezistent la schimbare.

**ROLURILE:**
**Manager (Promotor):**
- Trebuie să convingă angajatul de beneficiile schimbării
- Are la dispoziție argumente tehnice și de business
- Trebuie să gestioneze obiecțiile

**Angajat (Sceptic):**
- Este îngrijorat de impactul asupra job-ului său
- Are experiențe negative cu schimbările anterioare
- Pune întrebări dificile și ridică obiecții

**Observator:**
- Notează strategiile folosite
- Identifică momentele cheie
- Oferă feedback constructiv

**DESFĂȘURAREA:**
1. Briefing roluri (10 min)
2. Prima rundă de negociere (15 min)
3. Feedback observatori (5 min)
4. A doua rundă cu roluri inversate (15 min)
5. Feedback și discuții generale (15 min)

### Activitatea 3: Workshop de design thinking
**OBIECTIV:** Aplicarea metodologiei design thinking pentru ${subject}
**DURATA:** 90 minute
**PARTICIPANȚI:** Echipe de 5-6 persoane

**FAZELE PROCESULUI:**

**Faza 1: Empathize (20 minute)**
- Identificarea stakeholder-ilor
- Înțelegerea nevoilor și frustrărilor
- Crearea de persona maps

**Faza 2: Define (15 minute)**
- Formularea problemei principale
- Stabilirea criteriilor de succes
- Prioritizarea provocărilor

**Faza 3: Ideate (25 minute)**
- Brainstorming de soluții
- Tehnica "Crazy 8s"
- Evaluarea și selecția ideilor

**Faza 4: Prototype (20 minute)**
- Crearea unui prototip simplu
- Testarea conceptului
- Iterarea rapidă

**Faza 5: Test (10 minute)**
- Prezentarea prototipului
- Colectarea feedback-ului
- Planificarea îmbunătățirilor

## 2. JOCURI DE ROL AVANSATE

### Jocul de rol 1: Consiliul de administrație
**CONTEXT:** Prezentarea unei propuneri de implementare ${subject}
**PARTICIPANȚI:** 8-10 persoane
**DURATA:** 75 minute

**ROLURILE:**
- CEO (1 persoană) - Interesat de ROI și impact strategic
- CFO (1 persoană) - Focusat pe costuri și buget
- CTO (1 persoană) - Preocupat de aspectele tehnice
- HR Director (1 persoană) - Interesat de impactul asupra angajaților
- Membri CA (4-6 persoane) - Diverse perspective și interese

**SCENARIUL:**
Echipa de management prezintă o propunere de investiție în ${subject}. Consiliul trebuie să decidă dacă aprobă proiectul.

**PREGĂTIREA:**
- Fiecare participant primește un brief cu rolul său
- Sunt furnizate date financiare și tehnice
- Se stabilesc obiectivele fiecărui rol

**DESFĂȘURAREA:**
1. Prezentarea propunerii (15 min)
2. Sesiunea de întrebări (20 min)
3. Deliberarea consiliului (25 min)
4. Votul final și justificarea (10 min)
5. Debriefing (5 min)

### Jocul de rol 2: Gestionarea crizei
**CONTEXT:** O implementare de ${subject} întâmpină probleme majore
**PARTICIPANȚI:** 6-8 persoane
**DURATA:** 60 minute

**SCENARIUL:**
După 6 luni de implementare, proiectul ${subject} întâmpină probleme serioase: depășirea bugetului, întârzieri, rezistența angajaților.

**ROLURILE:**
- Project Manager - Responsabil cu recuperarea proiectului
- Sponsor Executive - Presat de board pentru rezultate
- Team Lead - Frustrat de problemele tehnice
- HR Representative - Gestionează rezistența angajaților
- External Consultant - Adus pentru a salva situația
- Key Stakeholder - Afectat direct de întârzieri

## 3. STUDII DE CAZ INTERACTIVE

### Studiul de caz 1: Transformarea digitală
**COMPANIA:** TechCorp Solutions (companie fictivă)
**INDUSTRIA:** Servicii IT
**PROVOCAREA:** Implementarea ${subject} într-un mediu tradițional

**CONTEXTUL DETALIAT:**
TechCorp este o companie cu 500 de angajați, înființată în 1995. Managementul senior a decis să implementeze ${subject} pentru a rămâne competitivă, dar întâmpină rezistență din partea angajaților cu experiență.

**DATELE DISPONIBILE:**
- Structura organizațională
- Bugetul disponibil: €2M
- Timeline: 18 luni
- Echipa de proiect: 12 persoane
- Stakeholder-i cheie identificați

**PROVOCĂRILE SPECIFICE:**
1. Rezistența la schimbare a echipelor senior
2. Lipsa competențelor tehnice necesare
3. Integrarea cu sistemele existente
4. Măsurarea ROI-ului

**ÎNTREBĂRILE PENTRU ANALIZĂ:**
1. Care ar fi strategia voastră de implementare?
2. Cum ați gestiona rezistența la schimbare?
3. Ce metrici ați folosi pentru măsurarea succesului?
4. Care sunt riscurile principale și cum le-ați mitiga?

**RESURSE SUPLIMENTARE:**
- Organigrama companiei
- Analiza SWOT
- Studiul de piață
- Benchmarking cu competitorii

### Studiul de caz 2: Startup în creștere rapidă
**COMPANIA:** InnovateLab (startup fictiv)
**INDUSTRIA:** FinTech
**PROVOCAREA:** Scalarea ${subject} într-un mediu dinamic

**CONTEXTUL:**
InnovateLab a crescut de la 10 la 150 de angajați în 2 ani. Procesele informale nu mai funcționează și este nevoie de implementarea ${subject} pentru a susține creșterea.

**CONSTRÂNGERILE:**
- Buget limitat: €500K
- Timeline agresiv: 6 luni
- Echipă tânără, fără experiență în ${subject}
- Mediu în schimbare constantă

**EXERCIȚIUL:**
Dezvoltați un plan de implementare care să țină cont de specificul startup-ului și să permită flexibilitatea necesară pentru creșterea rapidă.

## 4. SIMULĂRI ȘI DEMONSTRAȚII

### Simularea 1: Implementarea pas cu pas
**OBIECTIV:** Experimentarea procesului complet de implementare
**DURATA:** 2 ore
**PARTICIPANȚI:** Toți, împărțiți în echipe

**STRUCTURA:**
- Fiecare echipă reprezintă un departament diferit
- Simularea se desfășoară în "săptămâni" de câte 15 minute
- Facilitatorul introduce evenimente neașteptate
- Echipele trebuie să se adapteze și să colaboreze

**SĂPTĂMÂNA 1:** Planificarea inițială
**SĂPTĂMÂNA 2:** Începerea implementării
**SĂPTĂMÂNA 3:** Prima criză majoră
**SĂPTĂMÂNA 4:** Ajustarea strategiei
**SĂPTĂMÂNA 5:** Evaluarea intermediară
**SĂPTĂMÂNA 6:** Finalizarea și evaluarea

### Demonstrația 1: Instrumentele digitale
**OBIECTIV:** Familiarizarea cu platformele și instrumentele specifice
**DURATA:** 45 minute
**FORMAT:** Demonstrație interactivă

**CONȚINUTUL:**
1. Prezentarea interfețelor principale
2. Walkthrough prin funcționalitățile cheie
3. Exerciții practice ghidate
4. Q&A și troubleshooting

## 5. EVALUAREA ACTIVITĂȚILOR

### Criterii de evaluare:
- **Participarea activă** (25%)
- **Calitatea soluțiilor** (30%)
- **Colaborarea în echipă** (25%)
- **Aplicabilitatea practică** (20%)

### Instrumente de evaluare:
- Observația directă
- Feedback de la colegi
- Auto-evaluarea
- Prezentarea rezultatelor

### Feedback constructiv:
- Evidențierea punctelor forte
- Identificarea ariilor de îmbunătățire
- Sugestii concrete pentru dezvoltare
- Planuri de acțiune personalizate`;

      return repeatContent(activitiesContent, limits.activities);

    case 6:
      const evaluationContent = `# Instrumente de Evaluare - ${subject}

## 1. EVALUARE PRE-CURS

### Chestionar Nivel Inițial
**Obiectiv:** Măsurarea cunoștințelor și competențelor existente
**Durata:** 15 minute
**Format:** Online sau pe hârtie

#### Secțiunea A: Cunoștințe teoretice (10 întrebări)

**1. Care este experiența dvs. cu ${subject}?**
a) Niciuna
b) Minimă (sub 1 an)
c) Moderată (1-3 ani)
d) Extinsă (peste 3 ani)

**2. Cum definiți ${subject} în contextul organizațional?**
[Răspuns deschis - 3-4 rânduri]

**3. Care sunt principalele beneficii ale implementării ${subject}?**
a) Eficiența operațională
b) Reducerea costurilor
c) Îmbunătățirea calității
d) Toate variantele de mai sus

**4. Ce provocări anticipați în implementarea ${subject}?**
[Răspuns deschis - 3-4 rânduri]

**5. Pe o scară de la 1 la 10, cum evaluați importanța ${subject} pentru organizația dvs.?**
1 - 2 - 3 - 4 - 5 - 6 - 7 - 8 - 9 - 10

#### Secțiunea B: Competențe practice (5 întrebări)

**6. Ați participat anterior la implementarea unor inițiative similare?**
□ Da □ Nu
Dacă da, descrieți pe scurt: [Spațiu pentru răspuns]

**7. Care sunt principalele instrumente/metodologii pe care le cunoașteți în domeniu?**
[Lista cu opțiuni multiple]

**8. Cum măsurați în prezent performanța în domeniul relevant?**
[Răspuns deschis]

#### Secțiunea C: Așteptări și obiective (5 întrebări)

**9. Ce sperați să obțineți din acest curs?**
[Răspuns deschis]

**10. Care sunt cele mai mari provocări pe care le întâmpinați în activitatea curentă?**
[Răspuns deschis]

### Evaluarea contextului organizațional
**Format:** Interviu structurat (10 minute per participant)

**Întrebări cheie:**
- Descrieți cultura organizațională actuală
- Care sunt prioritățile strategice ale organizației?
- Cum se iau deciziile în organizația dvs.?
- Ce resurse sunt disponibile pentru implementare?
- Care sunt principalii stakeholder-i?

## 2. EVALUĂRI DURANTE CURS

### Mini-teste de verificare

#### Test Modulul 1: Concepte fundamentale
**Durata:** 10 minute
**Format:** 10 întrebări cu alegere multiplă + 2 întrebări deschise

**Întrebări cu alegere multiplă:**

**1. Principiul fundamental al ${subject} se bazează pe:**
a) Standardizarea proceselor
b) Flexibilitatea și adaptabilitatea
c) Controlul centralizat
d) Automatizarea completă

**2. Implementarea cu succes necesită:**
a) Doar suportul managementului
b) Doar resurse financiare adecvate
c) Doar tehnologie avansată
d) O combinație de factori organizaționali și tehnici

**3. Principala provocare în implementare este:**
a) Costurile ridicate
b) Rezistența la schimbare
c) Complexitatea tehnică
d) Lipsa de timp

**Întrebări deschise:**

**1. Explicați cu propriile cuvinte cum se aplică principiile ${subject} în contextul organizației dvs.**
[Spațiu pentru răspuns - 5 rânduri]

**2. Identificați trei factori critici de succes pentru implementarea ${subject} și justificați alegerile.**
[Spațiu pentru răspuns - 6 rânduri]

#### Test Modulul 2: Aplicații practice
**Durata:** 15 minute
**Format:** Studiu de caz scurt + întrebări

**Cazul:** [Descrierea unei situații practice de 100-150 cuvinte]

**Întrebări:**
1. Identificați problemele principale din acest caz
2. Propuneți o soluție folosind conceptele învățate
3. Anticipați potențialele obstacole în implementare
4. Definiți metrici pentru măsurarea succesului

### Evaluarea participării și angajamentului

#### Grila de observare pentru facilitator
**Criterii de evaluare:**

**Participarea activă:**
- Pune întrebări relevante
- Contribuie la discuții
- Împărtășește experiențe personale
- Oferă feedback constructiv

**Colaborarea:**
- Lucrează eficient în echipă
- Ascultă activ colegii
- Contribuie la soluțiile de grup
- Respectă diversitatea de opinii

**Aplicarea conceptelor:**
- Conectează teoria cu practica
- Oferă exemple concrete
- Demonstrează înțelegerea
- Transferă cunoștințele în contexte noi

**Scala de evaluare:** 1-5 (1=Insuficient, 5=Excelent)

### Feedback în timp real

#### Tehnica "Semaforul"
**Verde:** Înțeleg perfect, pot continua
**Galben:** Am întrebări, dar pot continua
**Roșu:** Nu înțeleg, am nevoie de clarificări

#### Exit tickets
La sfârșitul fiecărui modul, participanții completează:
- Cel mai important lucru învățat astăzi
- O întrebare care a rămas nerezolvată
- Cum voi aplica acest concept în practică

## 3. EVALUARE POST-CURS

### Test final de cunoștințe
**Durata:** 45 minute
**Format:** Mixt (alegere multiplă + întrebări deschise + studiu de caz)

#### Partea I: Cunoștințe teoretice (20 întrebări - 15 minute)

**Exemple de întrebări:**

**1. Implementarea cu succes a ${subject} necesită:**
a) Doar schimbări tehnologice
b) Doar schimbări organizaționale
c) O abordare holistică care include oameni, procese și tehnologie
d) Doar formarea angajaților

**2. Principala diferență între ${subject} și abordările tradiționale este:**
a) Costul de implementare
b) Timpul necesar
c) Focusul pe îmbunătățirea continuă
d) Complexitatea tehnică

**3. ROI-ul pentru ${subject} se măsoară prin:**
a) Doar economii de costuri
b) Doar creșterea veniturilor
c) O combinație de beneficii tangibile și intangibile
d) Doar satisfacția angajaților

#### Partea II: Aplicarea practică (3 întrebări - 20 minute)

**1. Dezvoltați un plan de implementare pentru ${subject} într-o organizație de ${audience} cu 200 de angajați. Includeți:**
- Fazele principale
- Timeline-ul
- Resursele necesare
- Riscurile și măsurile de mitigare
[Spațiu pentru răspuns - 1 pagină]

**2. Descrieți cum ați măsura succesul implementării ${subject}. Definiți:**
- KPI-uri cantitative
- Indicatori calitativi
- Metodologia de măsurare
- Frecvența evaluării
[Spațiu pentru răspuns - 1/2 pagină]

#### Partea III: Studiu de caz complex (10 minute)

**Cazul:** [Descrierea detaliată a unei situații complexe - 200-300 cuvinte]

**Sarcini:**
1. Analizați situația folosind framework-urile învățate
2. Identificați stakeholder-ii cheie și interesele lor
3. Propuneți o strategie de implementare
4. Anticipați provocările și soluțiile

### Evaluarea competențelor practice

#### Proiect practic individual
**Obiectiv:** Aplicarea conceptelor într-un context real
**Durata:** 2 săptămâni după curs
**Format:** Prezentare + raport scris

**Cerințe:**
- Identificarea unei oportunități de aplicare în organizația proprie
- Dezvoltarea unui business case
- Crearea unui plan de implementare detaliat
- Prezentarea în fața grupului (15 minute)

**Criterii de evaluare:**
- Relevanța și fezabilitatea (25%)
- Aplicarea corectă a conceptelor (30%)
- Calitatea analizei (25%)
- Claritatea prezentării (20%)

#### Evaluarea în echipă
**Format:** Proiect de grup
**Participanți:** 3-4 persoane
**Durata:** 1 săptămână

**Sarcina:** Dezvoltarea unei strategii de implementare pentru o organizație fictivă, incluzând:
- Analiza situației curente
- Definirea obiectivelor
- Planul de implementare
- Strategia de change management
- Planul de măsurare și evaluare

## 4. EVALUAREA CURSULUI

### Feedback pentru îmbunătățirea cursului

#### Chestionar de satisfacție
**Scala:** 1-5 (1=Foarte nesatisfăcut, 5=Foarte satisfăcut)

**Conținutul cursului:**
- Relevanța pentru activitatea mea
- Claritatea prezentării
- Echilibrul teorie-practică
- Utilitatea exercițiilor

**Facilitarea:**
- Competența facilitatorului
- Stilul de prezentare
- Gestionarea timpului
- Răspunsurile la întrebări

**Logistica:**
- Materialele furnizate
- Amenajarea sălii
- Durata cursului
- Programul zilnic

#### Întrebări deschise:
1. Ce a fost cel mai valoros aspect al cursului?
2. Ce ar putea fi îmbunătățit?
3. Ce subiecte ați dori să fie aprofundate?
4. Recomandați acest curs? De ce?

### Evaluarea impactului pe termen lung

#### Follow-up după 3 luni
**Format:** Interviu telefonic sau chestionar online
**Durata:** 15 minute

**Întrebări cheie:**
- Ați implementat conceptele învățate?
- Ce rezultate ați obținut?
- Ce obstacole ați întâmpinat?
- Ce suport suplimentar ați avea nevoie?

#### Follow-up după 6 luni
**Format:** Studiu de impact
**Obiectiv:** Măsurarea ROI-ului cursului

**Metrici evaluate:**
- Îmbunătățiri în performanță
- Economii de costuri
- Creșterea satisfacției angajaților
- Implementarea de noi procese

## 5. CERTIFICAREA

### Criterii pentru certificare
**Participarea:** Minimum 90% prezență
**Evaluări:** Nota minimă 7/10 la testele durante curs
**Test final:** Nota minimă 7/10
**Proiect practic:** Evaluare pozitivă

### Niveluri de certificare
**Certificat de participare:** Pentru cei care îndeplinesc criteriile de bază
**Certificat de competență:** Pentru cei cu rezultate excelente (nota minimă 9/10)
**Certificat de excelență:** Pentru cei cu proiecte practice excepționale

### Validitatea certificării
- Certificatul este valabil 3 ani
- Reînnoirea necesită participarea la cursuri de actualizare
- Recunoașterea de către organizații profesionale din domeniu`;

      return repeatContent(evaluationContent, limits.evaluation);

    case 7:
      const resourcesContent = `# Resurse Suplimentare - ${subject}

## 1. BIBLIOGRAFIE COMENTATĂ

### Cărți esențiale

#### 1. "Ghidul complet pentru ${subject}" - Dr. Maria Popescu
**Editura:** Polirom, 2023
**Pagini:** 450
**Nivel:** Intermediar-Avansat

**Descriere:** Această carte oferă o abordare comprehensivă a ${subject}, combinând teoria cu studii de caz practice din mediul românesc și internațional. Autoarea, cu o experiență de peste 15 ani în domeniu, prezintă metodologii dovedite și instrumente practice.

**Relevanță pentru cursul nostru:** Acoperă toate conceptele de bază prezentate în modulele 1-3, cu exemple detaliate de implementare.

**Capitole recomandate:**
- Capitolul 3: "Principiile fundamentale"
- Capitolul 7: "Strategii de implementare"
- Capitolul 12: "Măsurarea succesului"

**Nivel de dificultate:** ${level}
**Timp estimat de lectură:** 20-25 ore

#### 2. "${subject} în practică: De la teorie la rezultate" - Prof. John Anderson
**Editura:** Harvard Business Review Press, 2024
**Pagini:** 320
**Nivel:** Toate nivelurile

**Descriere:** O colecție de studii de caz din organizații de top care au implementat cu succes ${subject}. Cartea include interviuri cu lideri din industrie și analize detaliate ale factorilor de succes.

**Puncte forte:**
- Studii de caz diverse din multiple industrii
- Framework-uri practice pentru implementare
- Lecții învățate din eșecuri

**Aplicabilitate:** Excelentă pentru ${audience}, cu exemple relevante pentru contextul organizațional specific.

#### 3. "Transformarea digitală prin ${subject}" - Sarah Chen & Michael Rodriguez
**Editura:** MIT Press, 2023
**Pagini:** 280
**Nivel:** Intermediar

**Descriere:** Explorează intersecția dintre ${subject} și tehnologiile emergente, oferind o perspectivă asupra viitorului domeniului.

**Capitole cheie:**
- "Inteligența artificială și ${subject}"
- "Automatizarea proceselor"
- "Analiza predictivă în ${subject}"

### Articole academice și de cercetare

#### 1. "The Future of ${subject}: Trends and Predictions"
**Autori:** Dr. Elena Vasile, Prof. Alexandru Ionescu
**Publicat în:** Romanian Journal of Management, Vol. 15, 2024
**Pagini:** 45-67

**Abstract:** Studiul analizează tendințele emergente în ${subject} și impactul lor asupra organizațiilor românești. Bazat pe un sondaj cu 500 de manageri din diverse industrii.

**Link:** [URL către articol]

#### 2. "Measuring ROI in ${subject} Implementations"
**Autor:** Dr. James Wilson
**Publicat în:** International Business Review, 2024
**Pagini:** 123-145

**Metodologie:** Analiza a 200 de implementări din ultimii 5 ani
**Concluzii principale:** Identificarea factorilor care influențează ROI-ul

### Rapoarte de industrie

#### 1. "State of ${subject} 2024" - McKinsey & Company
**Pagini:** 85
**Format:** PDF gratuit
**Link:** [URL către raport]

**Conținut:**
- Tendințe globale în ${subject}
- Benchmarking pe industrii
- Predicții pentru următorii 3 ani
- Best practices identificate

#### 2. "Romanian ${subject} Market Analysis" - Deloitte Romania
**Anul:** 2024
**Pagini:** 120
**Disponibilitate:** Gratuit cu înregistrare

**Secțiuni relevante:**
- Analiza pieței locale
- Provocări specifice României
- Oportunități de creștere
- Recomandări pentru organizații

## 2. RESURSE ONLINE

### Website-uri specializate

#### 1. ${subject}Institute.org
**Descriere:** Organizația profesională internațională pentru ${subject}
**Conținut disponibil:**
- Articole săptămânale
- Webinare gratuite
- Certificări profesionale
- Comunitate de practică

**Secțiuni recomandate:**
- Knowledge Base: Ghiduri practice
- Case Studies: Studii de caz actualizate
- Tools & Templates: Instrumente descărcabile

**Acces:** Gratuit cu înregistrare

#### 2. ${subject}Today.com
**Descriere:** Portal de știri și analize din domeniu
**Frecvența actualizării:** Zilnic
**Tipuri de conținut:**
- Știri din industrie
- Interviuri cu experți
- Analize de tendințe
- Recenzii de instrumente

**Newsletter:** Săptămânal, cu rezumatul celor mai importante dezvoltări

#### 3. Academia${subject}.edu
**Descriere:** Platformă educațională cu cursuri online
**Oferta:**
- Cursuri gratuite de bază
- Specializări avansate (cu taxă)
- Certificări recunoscute
- Comunitate de învățare

**Cursuri recomandate pentru continuarea dezvoltării:**
- "${subject} Advanced Strategies" (40 ore)
- "Leadership in ${subject} Transformation" (25 ore)
- "Digital Tools for ${subject}" (15 ore)

### Platforme de învățare online

#### 1. Coursera - Specializarea în ${subject}
**Universitatea:** Stanford University
**Durata:** 6 luni (5-7 ore/săptămână)
**Certificat:** Da, cu taxă
**Limbă:** Engleză cu subtitrări în română

**Cursurile incluse:**
1. Fundamentals of ${subject}
2. Strategic Implementation
3. Change Management
4. Performance Measurement
5. Capstone Project

#### 2. edX - ${subject} MicroMasters
**Universitatea:** MIT
**Durata:** 8 luni
**Nivel:** Avansat
**Prerequisite:** Experiență în domeniu

#### 3. LinkedIn Learning
**Cursuri recomandate:**
- "${subject} Essentials" (3 ore)
- "Leading ${subject} Initiatives" (2.5 ore)
- "${subject} for Managers" (4 ore)

**Avantaj:** Integrare cu profilul LinkedIn profesional

### Podcasturi și conținut audio

#### 1. "The ${subject} Show"
**Gazde:** Dr. Lisa Thompson & Mark Johnson
**Frecvența:** Săptămânal
**Durata episod:** 30-45 minute
**Platforme:** Spotify, Apple Podcasts, Google Podcasts

**Episoade recomandate:**
- "Getting Started with ${subject}" (Ep. 15)
- "Common Implementation Mistakes" (Ep. 23)
- "ROI Measurement Strategies" (Ep. 31)

#### 2. "${subject} Leaders Podcast"
**Format:** Interviuri cu lideri din industrie
**Durata:** 60 minute
**Frecvența:** Bi-săptămânal

### Canale YouTube

#### 1. ${subject} Academy
**Abonați:** 250K
**Conținut:** Tutoriale, explicații concepte, studii de caz
**Frecvența:** 2-3 videouri/săptămână
**Durata medie:** 15-20 minute

**Playlist-uri recomandate:**
- "${subject} Basics" (12 videouri)
- "Implementation Guide" (8 videouri)
- "Expert Interviews" (20+ videouri)

#### 2. ${subject} Insights
**Focus:** Analize de tendințe și predicții
**Format:** Prezentări animate
**Durata:** 10-15 minute

## 3. COMUNITĂȚI ȘI NETWORKING

### Asociații profesionale

#### 1. Asociația Română de ${subject} (AR${subject})
**Înființată:** 2018
**Membri:** 1,200+
**Sediul:** București

**Beneficii pentru membri:**
- Acces la evenimente exclusive
- Reduceri la cursuri și certificări
- Networking cu profesioniștii din domeniu
- Acces la biblioteca de resurse

**Evenimente anuale:**
- Conferința Națională ${subject} (martie)
- Workshop-uri trimestriale
- Meetup-uri lunare în marile orașe

**Cotizația anuală:** 300 RON (150 RON pentru studenți)

#### 2. International ${subject} Association (I${subject}A)
**Membri globali:** 15,000+
**Prezență în România:** 150+ membri

**Beneficii:**
- Certificări internaționale
- Acces la cercetări exclusive
- Conferințe internaționale
- Programul de mentoring

### Grupuri online și forumuri

#### 1. LinkedIn - "${subject} Professionals Romania"
**Membri:** 3,500+
**Activitate:** Zilnică
**Tipuri de postări:**
- Întrebări și răspunsuri
- Partajarea experiențelor
- Anunțuri de job-uri
- Discuții despre tendințe

**Moderatori activi:** Da
**Reguli:** Doar conținut profesional relevant

#### 2. Facebook - "Comunitatea ${subject} România"
**Membri:** 2,100+
**Format:** Grup privat
**Focus:** Discuții practice și suport între colegi

#### 3. Reddit - r/${subject}
**Membri:** 45K+ global
**Activitate:** Foarte activă
**Conținut:**
- AMA (Ask Me Anything) cu experți
- Discuții despre instrumente
- Partajarea resurselor
- Sfaturi pentru începători

### Evenimente și conferințe

#### 1. ${subject} Summit Romania 2024
**Data:** 15-16 noiembrie 2024
**Locația:** JW Marriott, București
**Participanți așteptați:** 500+

**Agenda:**
- Keynote speakers internaționali
- Workshop-uri practice
- Sesiuni de networking
- Expo cu furnizori de soluții

**Prețuri:**
- Early bird: 1,200 RON
- Standard: 1,500 RON
- Studenți: 300 RON

#### 2. European ${subject} Conference
**Data:** 8-10 mai 2024
**Locația:** Amsterdam, Olanda
**Format:** Hibrid (fizic + online)

**Beneficii participare:**
- Acces la ultimele cercetări
- Networking internațional
- Certificat de participare (16 ore CPD)

### Meetup-uri locale

#### 1. ${subject} Meetup București
**Frecvența:** Lunar
**Locația:** Variabilă (coworking spaces)
**Participanți:** 30-50 per eveniment
**Format:** Prezentare + networking

**Următoarele evenimente:**
- "AI în ${subject}" - 20 martie
- "Startup-uri și ${subject}" - 17 aprilie
- "Workshop practic" - 15 mai

#### 2. ${subject} Cluj
**Organizator:** TechHub Cluj
**Frecvența:** Bi-lunar
**Focus:** Aspecte tehnice și implementare

## 4. INSTRUMENTE ȘI SOFTWARE

### Instrumente gratuite

#### 1. ${subject}Tool Open Source
**Dezvoltator:** Comunitatea open source
**Licență:** MIT
**Platforme:** Windows, Mac, Linux

**Funcționalități:**
- Planificarea proiectelor
- Tracking progres
- Raportare automată
- Integrări cu alte sisteme

**Documentație:** Completă, cu tutoriale video
**Suport comunitate:** Forum activ cu 10K+ utilizatori

#### 2. Free${subject}Analytics
**Tip:** Web-based tool
**Limitări versiune gratuită:** Până la 5 proiecte
**Export date:** CSV, PDF

**Cazuri de utilizare:**
- Analiza performanței
- Identificarea bottleneck-urilor
- Generarea rapoartelor

### Instrumente premium

#### 1. ${subject}Pro Enterprise
**Dezvoltator:** ${subject}Corp Inc.
**Preț:** $99/utilizator/lună
**Trial:** 30 zile gratuit

**Funcționalități avansate:**
- AI-powered insights
- Integrări enterprise
- Suport 24/7
- Customizare completă

**ROI mediu:** 300% în primul an (conform studiilor)

#### 2. Advanced${subject}Suite
**Preț:** $149/utilizator/lună
**Specializare:** Organizații mari (500+ angajați)

**Module incluse:**
- Planning & Strategy
- Execution Management
- Performance Analytics
- Compliance Tracking

### Template-uri și framework-uri

#### 1. ${subject} Implementation Toolkit
**Conținut:** 25+ template-uri Excel/Word
**Preț:** Gratuit cu înregistrare
**Include:**
- Project charter template
- Risk assessment matrix
- Communication plan
- Training materials template

#### 2. ${subject} Maturity Assessment
**Format:** Chestionar online
**Durata:** 15 minute
**Output:** Raport personalizat cu recomandări

### Aplicații mobile

#### 1. ${subject}Mobile
**Platforme:** iOS, Android
**Preț:** Gratuit (cu achiziții în aplicație)
**Rating:** 4.5/5 stele

**Funcționalități:**
- Tracking progres în timp real
- Notificări și reminder-uri
- Sincronizare cloud
- Rapoarte mobile

#### 2. Pocket${subject}
**Focus:** Învățare și referințe rapide
**Conținut:** Ghiduri, checklist-uri, calculatoare
**Offline:** Da

## 5. PLANURI DE DEZVOLTARE CONTINUĂ

### Traiectoria de învățare pe 12 luni

#### Lunile 1-3: Consolidarea fundamentelor
**Obiective:**
- Aplicarea conceptelor de bază în practică
- Identificarea unui proiect pilot
- Stabilirea unei rețele de suport

**Activități recomandate:**
- Citirea a 2 cărți din bibliografia esențială
- Participarea la 2 webinare
- Înscrierea în comunitatea online
- Începerea unui jurnal de învățare

**Milestone:** Implementarea cu succes a unui concept într-un proiect mic

#### Lunile 4-6: Aprofundarea cunoștințelor
**Obiective:**
- Dezvoltarea competențelor avansate
- Extinderea rețelei profesionale
- Obținerea primelor rezultate măsurabile

**Activități:**
- Participarea la o conferință
- Completarea unui curs online avansat
- Mentoring cu un expert din domeniu
- Prezentarea rezultatelor în organizație

**Milestone:** Demonstrarea ROI-ului pentru inițiativele implementate

#### Lunile 7-9: Specializarea
**Obiective:**
- Alegerea unei nișe de specializare
- Dezvoltarea expertizei în domeniul ales
- Începerea contribuției la comunitate

**Activități:**
- Cursuri de specializare
- Participarea la grupuri de lucru
- Scrierea de articole sau blog posts
- Organizarea de evenimente locale

**Milestone:** Recunoașterea ca expert în organizație

#### Lunile 10-12: Leadership și influență
**Obiective:**
- Dezvoltarea abilităților de leadership
- Influențarea strategiei organizaționale
- Contribuția la dezvoltarea domeniului

**Activități:**
- Participarea la board-uri sau comitete
- Mentoring pentru alți colegi
- Vorbire la evenimente publice
- Contribuția la cercetări sau publicații

**Milestone:** Poziționarea ca thought leader în domeniu

### Certificări recomandate

#### Nivel Fundamental
1. **Certified ${subject} Associate (C${subject}A)**
   - Durata pregătire: 3 luni
   - Examen: 2 ore, 100 întrebări
   - Validitate: 3 ani
   - Preț: $299

#### Nivel Intermediar
2. **${subject} Professional (${subject}P)**
   - Prerequisite: C${subject}A + 2 ani experiență
   - Durata pregătire: 6 luni
   - Examen: 4 ore, studii de caz
   - Preț: $599

#### Nivel Avansat
3. **Master ${subject} Practitioner (M${subject}P)**
   - Prerequisite: ${subject}P + 5 ani experiență
   - Include: Proiect capstone
   - Durata: 12 luni
   - Preț: $1,299

### Oportunități de carieră

#### Roluri entry-level
- ${subject} Analyst
- ${subject} Coordinator
- Junior ${subject} Consultant

**Salariu mediu:** 4,000-6,000 RON/lună

#### Roluri mid-level
- ${subject} Manager
- ${subject} Specialist
- ${subject} Project Manager

**Salariu mediu:** 7,000-12,000 RON/lună

#### Roluri senior
- ${subject} Director
- Chief ${subject} Officer
- ${subject} Strategy Consultant

**Salariu mediu:** 15,000-25,000 RON/lună

### Planul personal de dezvoltare (template)

#### Evaluarea situației curente
**Punctele forte:**
1. [Completați]
2. [Completați]
3. [Completați]

**Ariile de dezvoltare:**
1. [Completați]
2. [Completați]
3. [Completați]

#### Obiectivele pe termen scurt (6 luni)
1. [Obiectiv SMART]
2. [Obiectiv SMART]
3. [Obiectiv SMART]

#### Obiectivele pe termen mediu (1-2 ani)
1. [Obiectiv SMART]
2. [Obiectiv SMART]

#### Obiectivele pe termen lung (3-5 ani)
1. [Viziunea de carieră]

#### Planul de acțiune
**Luna 1:**
- [ ] Activitatea 1
- [ ] Activitatea 2
- [ ] Activitatea 3

**Luna 2:**
- [ ] Activitatea 1
- [ ] Activitatea 2

[Continuați pentru fiecare lună]

#### Măsurarea progresului
**Indicatori de succes:**
- Cuantitativi: [Metrici măsurabile]
- Calitativi: [Feedback, recunoaștere]

**Frecvența evaluării:** Lunar
**Ajustări:** Trimestriale

#### Resurse necesare
**Financiare:** [Buget estimat]
**Timp:** [Ore/săptămână]
**Suport:** [Mentori, colegi, management]

Acest plan de dezvoltare continuă vă va ajuta să rămâneți la curent cu evoluțiile din domeniu și să vă construiți o carieră de succes în ${subject}.`;

      return repeatContent(resourcesContent, limits.resources);

    default:
      return `Conținut generat pentru pasul ${stepInfo.step}`;
  }
}

// Main function to generate course materials in 7 steps
async function generateMaterials(params: GenerateParams) {
  const { jobId } = params;
  let sessionContext = "";
  
  try {
    // Update job to processing state
    await updateJobStatus(jobId, "processing", {
      progressPercent: 0,
      statusMessage: "Începe procesul de generare în 7 pași...",
      currentStep: 0,
      totalSteps: 7,
      stepName: "Inițializare"
    });

    // Execute each step sequentially
    for (const stepInfo of GENERATION_STEPS) {
      await updateJobStatus(jobId, "processing", {
        progressPercent: Math.round(((stepInfo.step - 1) / 7) * 100),
        statusMessage: `Pasul ${stepInfo.step}/7: ${stepInfo.title}`,
        currentStep: stepInfo.step,
        stepName: stepInfo.title
      });

      // Generate content for this step
      const stepContent = await generateStepContent(stepInfo, params, sessionContext);
      
      // Update session context with generated content
      sessionContext += `\n\n=== STEP ${stepInfo.step}: ${stepInfo.name.toUpperCase()} ===\n${stepContent.summary}`;
      
      // Create and upload the file to Supabase Storage
      await createAndUploadMaterial(stepContent, jobId, stepInfo, params);
      
      // Realistic delay between steps (3-8 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000));
    }
    
    // Mark job as completed
    await updateJobStatus(jobId, "completed", {
      progressPercent: 100,
      statusMessage: "Toate materialele au fost generate cu succes!",
      completedAt: new Date().toISOString(),
      currentStep: 7,
      stepName: "Finalizat"
    });
    
  } catch (error) {
    console.error("Error generating materials:", error);
    
    // Mark job as failed
    await updateJobStatus(jobId, "failed", {
      progressPercent: 0,
      statusMessage: "Generarea a eșuat",
      error: error instanceof Error ? error.message : "Eroare necunoscută",
    });
  }
}

// Generate content for a specific step
async function generateStepContent(stepInfo: any, params: GenerateParams, context: string) {
  const prompt = createStepPrompt(stepInfo, params, context);
  
  // Simulate AI generation with realistic delays based on content complexity
  const baseDelay = stepInfo.step === 1 ? 12000 : 8000; // Foundation takes longer
  const variableDelay = Math.random() * 6000; // 0-6 seconds additional
  const totalDelay = baseDelay + variableDelay;
  
  await new Promise(resolve => setTimeout(resolve, totalDelay));
  
  // Generate mock content based on step
  const content = generateMockContent(stepInfo, params);
  
  return {
    content,
    summary: `Generated ${stepInfo.name} for ${params.subject} (${params.duration}) - ${content.length} characters`
  };
}

// Create prompt for specific step
function createStepPrompt(stepInfo: any, params: GenerateParams, context: string): string {
  const { language, subject, level, audience, duration, tone } = params;
  const limits = PAGE_LIMITS[duration];
  
  const basePrompt = `
CONTEXT ANTERIOR GENERAT:
${context}

SPECIFICAȚII CURS:
- Limbă: ${language}
- Subiect: ${subject}
- Nivel: ${level}
- Public țintă: ${audience}
- Durată totală: ${duration}
- Ton și stil: ${tone}
`;

  switch (stepInfo.step) {
    case 1:
      return `${basePrompt}
CALL 1: STRUCTURA + OBIECTIVE + AGENDA
Creează fundamentul pentru un curs fizic complet despre ${subject}.
GENEREAZĂ EXACT 3 SECȚIUNI:
1. STRUCTURA CURSULUI (3-6 module principale)
2. OBIECTIVE DE ÎNVĂȚARE (taxonomia lui Bloom)
3. AGENDA DETALIATĂ (pentru ${duration})
IMPORTANT: Nu depăși 3 pagini total.`;

    case 2:
      return `${basePrompt}
CALL 2: SLIDES DE PREZENTARE
Generează conținutul complet pentru slide-urile de prezentare.
SPECIFICAȚII: Maxim ${limits.slides} slide-uri
Format: Titlu Slide | Conținut | Note Prezentator`;

    case 3:
      return `${basePrompt}
CALL 3: MANUAL FACILITATOR
Generează manualul complet pentru facilitator.
SPECIFICAȚII: Maxim ${limits.facilitator} pagini
Include: Ghid prezentare, Management activități, Situații dificile, Materiale și logistică`;

    case 4:
      return `${basePrompt}
CALL 4: MANUAL PARTICIPANT
Generează manualul complet al participantului.
SPECIFICAȚII: Maxim ${limits.participant} pagini
Format: Teorie + practică + spații pentru notițe`;

    case 5:
      return `${basePrompt}
CALL 5: ACTIVITĂȚI ȘI EXERCIȚII
Generează activitățile și exercițiile complete.
SPECIFICAȚII: Maxim ${limits.activities} pagini
Include: Activități experiențiale, Jocuri de rol, Studii de caz`;

    case 6:
      return `${basePrompt}
CALL 6: INSTRUMENTE DE EVALUARE
Generează instrumentele complete de evaluare.
SPECIFICAȚII: Maxim ${limits.evaluation} pagini
Include: Evaluare pre-curs, Durante curs, Post-curs, Proiect practic, Evaluarea cursului`;

    case 7:
      return `${basePrompt}
CALL 7: RESURSE SUPLIMENTARE
Generează resursele suplimentare complete.
SPECIFICAȚII: Maxim ${limits.resources} pagini
Include: Bibliografie, Resurse online, Comunități, Instrumente practice, Multimedia, Planuri dezvoltare`;

    default:
      return basePrompt;
  }
}

// Create and upload material to Supabase Storage
async function createAndUploadMaterial(stepContent: any, jobId: string, stepInfo: any, params: GenerateParams) {
  try {
    const materialType = stepInfo.name;
    const format = stepInfo.format;
    const fileName = `${stepInfo.name}_${Date.now()}.${format}`;
    const filePath = `${jobId}/${fileName}`;
    
    // Generate the appropriate file content
    let fileContent: Uint8Array;
    if (format === 'docx') {
      fileContent = generateDocxContent(stepContent.content, stepInfo.title);
    } else if (format === 'pptx') {
      fileContent = generatePptxContent(stepContent.content, stepInfo.title);
    } else {
      // Fallback to text
      const encoder = new TextEncoder();
      fileContent = encoder.encode(stepContent.content);
    }
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('course-materials')
      .upload(filePath, fileContent, {
        contentType: format === 'docx' 
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : format === 'pptx'
          ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          : 'text/plain',
        upsert: true
      });
    
    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }
    
    // Set expiry date to 72 hours from now
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 72);
    const expiryIso = expiryDate.toISOString();
    
    // Create signed URL for download
    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from('course-materials')
      .createSignedUrl(filePath, 72 * 3600); // 72 hours in seconds
    
    if (urlError) {
      throw new Error(`Failed to create signed URL: ${urlError.message}`);
    }
    
    // Create material record in database
    const material = {
      jobId,
      type: materialType,
      name: stepInfo.title,
      content: stepContent.content, // Store the raw text content for debugging
      format,
      stepNumber: stepInfo.step,
      downloadUrl: urlData.signedUrl,
      downloadExpiry: expiryIso,
      storage_path: filePath,
      file_size: fileContent.length
    };
    
    const { error: dbError } = await supabaseAdmin
      .from("materials")
      .insert([material]);
    
    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage
        .from('course-materials')
        .remove([filePath]);
      
      throw new Error(`Failed to save material record: ${dbError.message}`);
    }
    
    console.log(`Successfully created material: ${stepInfo.title} (${fileContent.length} bytes)`);
    
  } catch (error) {
    console.error("Error creating and uploading material:", error);
    throw new Error(`Failed to create and upload material: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Main Deno serve handler
Deno.serve(async (req) => {
  // Enable CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    const { jobId, language, subject, level, audience, duration, tone } = await req.json();
    
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "Job ID is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // Process the generation in the background
    EdgeRuntime.waitUntil(
      generateMaterials({
        jobId,
        language,
        subject,
        level,
        audience,
        duration,
        tone,
      })
    );
    
    // Return immediate success response
    return new Response(
      JSON.stringify({ 
        status: "processing",
        message: "7-step generation process started successfully"
      }),
      {
        status: 202,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});