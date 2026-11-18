/**
 * CareerGuide.AI - Document Parser Module
 * Handles local in-browser text extraction from PDF, DOCX, and TXT files.
 * Uses PDF.js for PDF extraction and Mammoth.js for DOCX extraction.
 * Detects scanned/image-only PDFs and provides OCR-required warnings.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DocumentParser = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Configure PDF.js worker URL if running in browser
  const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  function initPdfJsWorker() {
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      if (!window.pdfjsLib.GlobalWorkerOptions) {
        window.pdfjsLib.GlobalWorkerOptions = {};
      }
      if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      }
    }
  }

  // Auto-init worker if window is present
  if (typeof window !== 'undefined') {
    initPdfJsWorker();
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const VALID_EXTENSIONS = ['.pdf', '.docx', '.txt'];

  /**
   * Validates file size and type
   * @param {File|Object} file
   * @returns {{ valid: boolean, error?: string }}
   */
  function validateFile(file) {
    if (!file) {
      return { valid: false, error: 'No file was provided.' };
    }

    const name = (file.name || '').toLowerCase();
    const size = file.size || 0;

    const hasValidExt = VALID_EXTENSIONS.some(ext => name.endsWith(ext));
    if (!hasValidExt) {
      return {
        valid: false,
        error: 'Unsupported file format. Please upload a PDF (.pdf), Word document (.docx), or plain text (.txt).'
      };
    }

    if (size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds the 10MB limit (Current size: ${formatBytes(size)}). Please upload a smaller file.`
      };
    }

    if (size === 0) {
      return {
        valid: false,
        error: 'The uploaded file is empty (0 bytes). Please upload a valid resume.'
      };
    }

    return { valid: true };
  }

  /**
   * Formats byte size into human-readable string
   * @param {number} bytes
   * @returns {string}
   */
  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Converts a File or Blob into an ArrayBuffer
   * @param {File|Blob} file
   * @returns {Promise<ArrayBuffer>}
   */
  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      if (file.arrayBuffer) {
        file.arrayBuffer().then(resolve).catch(reject);
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file as ArrayBuffer.'));
        reader.readAsArrayBuffer(file);
      }
    });
  }

  /**
   * Reads a File or Blob as plain text string
   * @param {File|Blob} file
   * @returns {Promise<string>}
   */
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || '');
      reader.onerror = () => reject(new Error('Failed to read text file.'));
      reader.readAsText(file);
    });
  }

  /**
   * Extracts text from PDF using PDF.js
   * @param {ArrayBuffer} arrayBuffer
   * @returns {Promise<{ text: string, pageCount: number, isScanned: boolean }>}
   */
  async function extractTextFromPdf(arrayBuffer) {
    initPdfJsWorker();

    const pdfjs = (typeof window !== 'undefined' && window.pdfjsLib) ? window.pdfjsLib : null;
    if (!pdfjs) {
      throw new Error('PDF.js library is not loaded. Cannot process PDF document.');
    }

    try {
      const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
        isEvalSupported: false
      });
      const pdfDoc = await loadingTask.promise;
      const pageCount = pdfDoc.numPages;

      let fullText = '';
      let pagesWithText = 0;

      for (let i = 1; i <= pageCount; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extract string tokens and join with space
        const pageItems = textContent.items || [];
        const pageStrings = pageItems.map(item => item.str || '').filter(s => s.trim().length > 0);
        const pageText = pageStrings.join(' ');

        if (pageText.trim().length > 15) {
          pagesWithText++;
        }

        fullText += pageText + '\n\n';
      }

      const trimmedText = fullText.trim();

      // Scanned PDF detection heuristic:
      // If pageCount > 0 and average character count is under 40 chars per page, or total text < 40 chars
      const isScanned = pageCount > 0 && (trimmedText.length < 40 || pagesWithText === 0);

      if (isScanned) {
        return {
          text: '',
          pageCount: pageCount,
          isScanned: true,
          ocrRequired: true,
          error: 'OCR_REQUIRED',
          message: 'This PDF appears to be a scanned image or photo without a selectable text layer. ATS systems require machine-readable text. Please upload a digital PDF, DOCX file, or run OCR software on your document first.'
        };
      }

      return {
        text: trimmedText,
        pageCount: pageCount,
        isScanned: false,
        ocrRequired: false
      };
    } catch (err) {
      throw new Error(`PDF Parsing Error: ${err.message || 'Unable to parse PDF structure.'}`);
    }
  }

  /**
   * Extracts raw text from DOCX using Mammoth.js
   * @param {ArrayBuffer} arrayBuffer
   * @returns {Promise<{ text: string, isScanned: boolean }>}
   */
  async function extractTextFromDocx(arrayBuffer) {
    const mammoth = (typeof window !== 'undefined' && window.mammoth) ? window.mammoth : null;
    if (!mammoth) {
      throw new Error('Mammoth.js library is not loaded. Cannot process DOCX document.');
    }

    try {
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      const rawText = (result.value || '').trim();

      if (rawText.length < 20) {
        return {
          text: '',
          isScanned: false,
          isEmpty: true,
          error: 'EMPTY_DOCUMENT',
          message: 'The uploaded DOCX document contains no readable text. Please check the document contents and try again.'
        };
      }

      return {
        text: rawText,
        pageCount: 1, // DOCX does not expose discrete fixed pages in raw text
        isScanned: false,
        ocrRequired: false
      };
    } catch (err) {
      throw new Error(`DOCX Parsing Error: ${err.message || 'Unable to extract text from Word document.'}`);
    }
  }

  /**
   * Main entry point: Parses any supported resume file (PDF, DOCX, TXT)
   * @param {File|Blob|{ name: string, arrayBuffer?: Function, text?: Function }} file
   * @returns {Promise<{
   *   success: boolean,
   *   text: string,
   *   fileName: string,
   *   fileSize: number,
   *   fileSizeFormatted: string,
   *   fileType: string,
   *   pageCount: number,
   *   wordCount: number,
   *   error?: string,
   *   ocrRequired?: boolean
   * }>}
   */
  async function parseDocument(file) {
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        fileName: file ? file.name : 'Unknown',
        fileSize: file ? file.size : 0
      };
    }

    const fileName = file.name;
    const lowerName = fileName.toLowerCase();
    const fileSize = file.size;
    const fileSizeFormatted = formatBytes(fileSize);

    try {
      if (lowerName.endsWith('.pdf')) {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const result = await extractTextFromPdf(arrayBuffer);

        if (result.ocrRequired) {
          return {
            success: false,
            ocrRequired: true,
            error: result.message,
            fileName: fileName,
            fileSize: fileSize,
            fileSizeFormatted: fileSizeFormatted,
            fileType: 'pdf',
            pageCount: result.pageCount,
            text: ''
          };
        }

        const wordCount = result.text.split(/\s+/).filter(w => w.length > 0).length;

        return {
          success: true,
          text: result.text,
          fileName: fileName,
          fileSize: fileSize,
          fileSizeFormatted: fileSizeFormatted,
          fileType: 'pdf',
          pageCount: result.pageCount,
          wordCount: wordCount,
          ocrRequired: false
        };
      } else if (lowerName.endsWith('.docx')) {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const result = await extractTextFromDocx(arrayBuffer);

        if (result.isEmpty) {
          return {
            success: false,
            error: result.message,
            fileName: fileName,
            fileSize: fileSize,
            fileSizeFormatted: fileSizeFormatted,
            fileType: 'docx',
            text: ''
          };
        }

        const wordCount = result.text.split(/\s+/).filter(w => w.length > 0).length;

        return {
          success: true,
          text: result.text,
          fileName: fileName,
          fileSize: fileSize,
          fileSizeFormatted: fileSizeFormatted,
          fileType: 'docx',
          pageCount: 1,
          wordCount: wordCount,
          ocrRequired: false
        };
      } else if (lowerName.endsWith('.txt')) {
        const rawText = await readFileAsText(file);
        const trimmed = (rawText || '').trim();

        if (trimmed.length < 10) {
          return {
            success: false,
            error: 'The uploaded text file is empty or contains fewer than 10 characters.',
            fileName: fileName,
            fileSize: fileSize,
            fileSizeFormatted: fileSizeFormatted,
            fileType: 'txt',
            text: ''
          };
        }

        const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;

        return {
          success: true,
          text: trimmed,
          fileName: fileName,
          fileSize: fileSize,
          fileSizeFormatted: fileSizeFormatted,
          fileType: 'txt',
          pageCount: 1,
          wordCount: wordCount,
          ocrRequired: false
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err.message || 'An error occurred while parsing the document.',
        fileName: fileName,
        fileSize: fileSize,
        fileSizeFormatted: fileSizeFormatted
      };
    }

    return {
      success: false,
      error: 'Unsupported file format.',
      fileName: fileName,
      fileSize: fileSize
    };
  }

  return {
    validateFile: validateFile,
    formatBytes: formatBytes,
    parseDocument: parseDocument,
    extractTextFromPdf: extractTextFromPdf,
    extractTextFromDocx: extractTextFromDocx
  };
});
