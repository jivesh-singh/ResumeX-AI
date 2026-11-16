const fs = require('fs');

// Minimal ZIP file generator without external dependencies
function createZip(files) {
  const fileRecords = [];
  const centralDirRecords = [];
  let offset = 0;

  files.forEach(file => {
    const nameBuf = Buffer.from(file.name);
    const dataBuf = Buffer.from(file.data);
    const crc = crc32(dataBuf);

    // Local file header (30 bytes + name + data)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4);         // version needed
    localHeader.writeUInt16LE(0, 6);          // flags
    localHeader.writeUInt16LE(0, 8);          // compression (0 = store)
    localHeader.writeUInt16LE(0, 10);         // time
    localHeader.writeUInt16LE(0, 12);         // date
    localHeader.writeUInt32LE(crc, 14);       // crc32
    localHeader.writeUInt32LE(dataBuf.length, 18); // compressed size
    localHeader.writeUInt32LE(dataBuf.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26); // file name length
    localHeader.writeUInt16LE(0, 28);         // extra field length

    fileRecords.push(localHeader, nameBuf, dataBuf);

    // Central directory header (46 bytes + name)
    const cdHeader = Buffer.alloc(46);
    cdHeader.writeUInt32LE(0x02014b50, 0); // signature
    cdHeader.writeUInt16LE(20, 4);          // version made by
    cdHeader.writeUInt16LE(20, 6);          // version needed
    cdHeader.writeUInt16LE(0, 8);           // flags
    cdHeader.writeUInt16LE(0, 10);          // compression
    cdHeader.writeUInt16LE(0, 12);          // time
    cdHeader.writeUInt16LE(0, 14);          // date
    cdHeader.writeUInt32LE(crc, 16);        // crc32
    cdHeader.writeUInt32LE(dataBuf.length, 20); // compressed size
    cdHeader.writeUInt32LE(dataBuf.length, 24); // uncompressed size
    cdHeader.writeUInt16LE(nameBuf.length, 28); // file name length
    cdHeader.writeUInt16LE(0, 30);          // extra field length
    cdHeader.writeUInt16LE(0, 32);          // file comment length
    cdHeader.writeUInt16LE(0, 34);          // disk number start
    cdHeader.writeUInt16LE(0, 36);          // internal file attributes
    cdHeader.writeUInt32LE(0, 38);          // external file attributes
    cdHeader.writeUInt32LE(offset, 42);     // relative offset of local header

    centralDirRecords.push(cdHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + dataBuf.length;
  });

  const cdOffset = offset;
  const cdBuf = Buffer.concat(centralDirRecords);

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);       // signature
  eocd.writeUInt16LE(0, 4);                // disk number
  eocd.writeUInt16LE(0, 6);                // disk with start of central dir
  eocd.writeUInt16LE(files.length, 8);     // total entries on this disk
  eocd.writeUInt16LE(files.length, 10);    // total entries
  eocd.writeUInt32LE(cdBuf.length, 12);    // size of central dir
  eocd.writeUInt32LE(cdOffset, 16);        // offset of start of central dir
  eocd.writeUInt16LE(0, 20);               // comment length

  return Buffer.concat([...fileRecords, cdBuf, eocd]);
}

// CRC32 table & function
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>JORDAN LEE - Data Scientist and Machine Learning Engineer</w:t></w:r></w:p>
    <w:p><w:r><w:t>jordan.lee@example.com | (212) 555-4819 | New York, NY | github.com/jordanlee</w:t></w:r></w:p>
    <w:p><w:r><w:t>PROFESSIONAL SUMMARY: Enthusiastic Data Scientist with 3+ years experience building predictive models, data pipelines, and machine learning architectures using Python, PyTorch, SQL, and AWS.</w:t></w:r></w:p>
    <w:p><w:r><w:t>TECHNICAL SKILLS: Python, SQL, PyTorch, TensorFlow, Pandas, NumPy, Scikit-learn, Machine Learning, Docker, AWS</w:t></w:r></w:p>
    <w:p><w:r><w:t>WORK EXPERIENCE: Senior Data Scientist at DataCorp Analytics (2021 - Present). Built predictive ML models improving forecast accuracy by 32%.</w:t></w:r></w:p>
    <w:p><w:r><w:t>EDUCATION: Bachelor of Science in Computer Science, New York University (2017 - 2021)</w:t></w:r></w:p>
  </w:body>
</w:document>`;

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const docxBuffer = createZip([
  { name: '[Content_Types].xml', data: contentTypesXml },
  { name: '_rels/.rels', data: relsXml },
  { name: 'word/document.xml', data: docXml }
]);

fs.writeFileSync('test/sample-resume.docx', docxBuffer);
console.log('Successfully created test/sample-resume.docx (' + docxBuffer.length + ' bytes)');
