// Browser mein PDF file se plain text extract karne ka utility script

async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.onload = async function () {
            try {
                const typedarray = new Uint8Array(this.result);

                // PDF.js worker load karna
                pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = "";

                // Har page se text read karna
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const tokenizedText = await page.getTextContent();
                    const pageText = tokenizedText.items.map(item => item.str).join(" ");
                    fullText += pageText + "\n";
                }

                resolve(fullText.trim());
            } catch (error) {
                reject("PDF parse karne mein error aayi: " + error.message);
            }
        };

        fileReader.onerror = (err) => reject(err);
        fileReader.readAsArrayBuffer(file);
    });
}