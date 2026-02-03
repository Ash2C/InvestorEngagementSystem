import { put } from '@vercel/blob';
import { kv } from '@vercel/kv';

// Dynamic imports for document parsing
let pdfParse, mammoth;

async function loadParsers() {
  if (!pdfParse) {
    pdfParse = (await import('pdf-parse')).default;
  }
  if (!mammoth) {
    mammoth = await import('mammoth');
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

// Parse multipart form data manually
async function parseMultipart(req) {
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('multipart/form-data')) {
    throw new Error('Content-Type must be multipart/form-data');
  }

  const boundary = contentType.split('boundary=')[1];
  if (!boundary) {
    throw new Error('No boundary found in Content-Type');
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  const text = buffer.toString('binary');

  const parts = text.split(`--${boundary}`);
  const result = { fields: {}, file: null };

  for (const part of parts) {
    if (part.includes('Content-Disposition')) {
      const nameMatch = part.match(/name="([^"]+)"/);
      const filenameMatch = part.match(/filename="([^"]+)"/);

      if (nameMatch) {
        const name = nameMatch[1];
        // Find the content after the headers (double CRLF)
        const contentStart = part.indexOf('\r\n\r\n');
        if (contentStart === -1) continue;

        let content = part.slice(contentStart + 4);
        // Remove trailing CRLF
        if (content.endsWith('\r\n')) {
          content = content.slice(0, -2);
        }

        if (filenameMatch) {
          // This is a file
          const filename = filenameMatch[1];
          const contentTypeMatch = part.match(/Content-Type:\s*([^\r\n]+)/);
          const mimeType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';

          // Convert binary string back to buffer
          const fileBuffer = Buffer.from(content, 'binary');

          result.file = {
            name: filename,
            type: mimeType,
            buffer: fileBuffer,
          };
        } else {
          // This is a regular field
          result.fields[name] = content;
        }
      }
    }
  }

  return result;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await loadParsers();

    const { fields, file } = await parseMultipart(req);

    const companyName = fields.companyName;
    const investorSlug = fields.investorSlug;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    if (!investorSlug) {
      return res.status(400).json({ error: 'Investor slug is required' });
    }

    // Validate file type
    const filename = file.name.toLowerCase();
    const isPDF = filename.endsWith('.pdf') || file.type === 'application/pdf';
    const isDOCX = filename.endsWith('.docx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (!isPDF && !isDOCX) {
      return res.status(400).json({
        error: 'Invalid file type. Only PDF and DOCX files are supported.'
      });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.buffer.length > maxSize) {
      return res.status(400).json({
        error: 'File too large. Maximum size is 10MB.'
      });
    }

    // Parse document text
    let extractedText = '';

    if (isPDF) {
      try {
        const pdfData = await pdfParse(file.buffer);
        extractedText = pdfData.text;
      } catch (err) {
        console.error('PDF parsing error:', err);
        return res.status(400).json({
          error: 'Failed to parse PDF. Please ensure the file is not corrupted.'
        });
      }
    } else if (isDOCX) {
      try {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value;
      } catch (err) {
        console.error('DOCX parsing error:', err);
        return res.status(400).json({
          error: 'Failed to parse DOCX. Please ensure the file is not corrupted.'
        });
      }
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({
        error: 'Could not extract sufficient text from the document. Please check the file content.'
      });
    }

    // Store file in Vercel Blob
    const blobPath = `briefings/${investorSlug}/${Date.now()}-${file.name}`;
    const blob = await put(blobPath, file.buffer, {
      access: 'public',
      contentType: file.type,
    });

    // Create briefing ID
    const briefingId = `briefing:${investorSlug}:${Date.now()}`;

    // Store metadata in KV
    const metadata = {
      id: briefingId,
      investorSlug,
      companyName,
      filename: file.name,
      fileType: isPDF ? 'pdf' : 'docx',
      fileSize: file.buffer.length,
      blobUrl: blob.url,
      extractedText,
      createdAt: new Date().toISOString(),
      positioningAnalysis: null,
    };

    await kv.set(briefingId, metadata);

    // Also store a reference by investor slug for easy lookup
    await kv.set(`latest-briefing:${investorSlug}`, briefingId);

    return res.status(200).json({
      success: true,
      briefingId,
      companyName,
      filename: file.name,
      textLength: extractedText.length,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: 'Failed to process upload',
      details: error.message
    });
  }
}
