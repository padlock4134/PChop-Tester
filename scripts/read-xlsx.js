let readXlsxFile = require('read-excel-file/node');
if (readXlsxFile && readXlsxFile.default) readXlsxFile = readXlsxFile.default;

const fs = require('fs');
const path = require('path');

const xlsxPath = path.join(__dirname, '../public/ICP/BlackRock Future Builders RFP Budget Template.xlsx');
const outPath = path.join(__dirname, '../public/ICP/BlackRock-Budget-Template-extracted.txt');

readXlsxFile(fs.createReadStream(xlsxPath)).then((rows) => {
  const raw = JSON.stringify(rows, null, 2);
  fs.writeFileSync(outPath, raw, 'utf8');
  console.log('Done. Rows:', rows.length, '| Output:', outPath);
}).catch((err) => {
  console.error('Error:', err.message);
});
