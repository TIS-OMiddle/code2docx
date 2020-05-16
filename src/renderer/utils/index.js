import * as Docx from "docx";
import * as fs from "fs";
import * as path from "path";

const { Document: DocxDocument, Packer, Paragraph, TextRun } = Docx;

let wait = 0,
  success = 0;

function fromDir(startPath, filter, callback) {
  if (!fs.existsSync(startPath)) {
    console.log("no dir ", startPath);
    return;
  }
  var files = fs.readdirSync(startPath);
  for (var i = 0; i < files.length; i++) {
    var filename = path.join(startPath, files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      fromDir(filename, filter, callback); //recurse
    } else if (filter.some((reg) => reg.test(filename))) {
      wait++;
      callback(filename);
    }
  }
}

export function translate(path, reg) {
  const slash = path.lastIndexOf("/");
  const root = path.slice(0, slash + 1);
  return new Promise((resolve) => {
    const docx = new DocxDocument({
      styles: {
        paragraphStyles: [
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            run: {
              size: 24,
            },
          },
        ],
      },
    });
    const arr = [];
    fromDir(path, reg, (filename) => {
      addFileToDocx(filename, arr, root);
    });

    const timer = setInterval(() => {
      if (wait === success) {
        clearInterval(timer);
        docx.addSection({
          children: arr,
        });
        // writeDocx(docx);
        resolve(docx);
      }
    }, 2000);
  });
}

async function writeDocx(docx) {
  const base64 = await Packer.toBase64String(docx);
  const buffer = Buffer.from(base64, "base64");
  fs.writeFileSync("合成.docx", buffer);
}

function getData(fileName) {
  return new Promise((res, rej) => {
    fs.readFile(fileName, { encoding: 'utf-8' }, (err, data) => {
      if (err) {
        rej(err)
      }
      res(data)
    })
  })
}
async function addFileToDocx(filename, arr, root) {
  const data = await getData(filename);
  const paragraphs = data.split("\n").map((str) => {
    return new Paragraph({
      children: [new TextRun(str)],
    });
  });
  arr.push(
    ...[
      new Paragraph({
        children: [new TextRun("")],
      }),
      new Paragraph({
        children: [new TextRun(filename.replace(root, ""))],
        style: "Heading1",
      }),
    ]
  );
  arr.push(...paragraphs);
  console.log(filename);
  success++;
}
