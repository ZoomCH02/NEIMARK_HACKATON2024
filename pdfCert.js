var { readFileSync, writeFileSync } =  require('fs');
var {degrees, PDFDocument, rgb, StandardFonts} = require("pdf-lib")
var fontkit = require("@pdf-lib/fontkit")
var uuid = require("uuid")
const existingPdfBytes = readFileSync("template.pdf")

/**
 * 
 * @param {string} name Имя
 * @param {string} surname Фамилия
 * @param {string} otchestvo Отчество
 * @param {BigInteger} result Кол-во баллов
 * @param {string} olimp Название олимпиадыы
 */
module.exports.makeCerificate = async (name,surname,otchestvo, result, olimp) => {
        const pdfDoc = await PDFDocument.load(existingPdfBytes) //PDFDocument.load(existingPdfBytes)
        var fontbytes = readFileSync("Montserrat-Thin.ttf")
        pdfDoc.registerFontkit(fontkit)
    // Embed the Helvetica font
    const TimesRoman = await pdfDoc.embedFont(fontbytes)
    
    // Get the first page of the document
    var pages = pdfDoc.getPages()
    if(pages.length == 0) pdfDoc.addPage()
    pages =  pdfDoc.getPages()
    const firstPage = pages[0]
    
    // Get the width and height of the first page
    const { width, height } = firstPage.getSize()
    
    // Draw a string of text diagonally across the first page
    firstPage.drawText(`${surname} \n \n${name} \n \n${otchestvo}`, {
      x: 88,
      y: 500,
      size: 32,
      font: TimesRoman,
      color: rgb(1,1,1)
    })
    
    firstPage.drawText(`${result}`, {
      x: 300,
      y: 310,
      size: 32,
      font: TimesRoman,
      color: rgb(1,1,1)
    })
    firstPage.drawText(olimp, {
      x: 88,
      y: 230,
      size: 16,
      font: TimesRoman,
      color: rgb(1,1,1)
    })
    
    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save()
    var pdf_name = uuid.v4()
    writeFileSync(__dirname + `/certificates/${pdf_name}.pdf`, pdfBytes)
    return "/certificate/" + pdf_name + ".pdf"
    // For example, `pdfBytes` can be:
    //   • Written to a file in Node
    //   • Downloaded from the browser
    //   • Rendered in an <iframe>
}