const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const pdfPath = path.join(__dirname, '../public/ICP/BlackRock Future Builders RFP Guide Final.pdf');
const outPath = path.join(__dirname, '../public/ICP/BlackRock-RFP-extracted.txt');

const buffer = fs.readFileSync(pdfPath);

pdfParse(buffer).then((data) => {
  fs.writeFileSync(outPath, data.text, 'utf8');
  console.log('Done. Pages:', data.numpages);
  console.log('Output:', outPath);
}).catch((err) => {
  console.error('Error:', err.message);
});
