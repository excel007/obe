
export const openPrintWindow = (title: string, contentHtml: string) => {
    const win = window.open('', '_blank');
    if(!win) {
        alert("Please allow popups to print.");
        return;
    }
    
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Sarabun', sans-serif; -webkit-print-color-adjust: exact; }
                @media print {
                    .no-print { display: none !important; }
                    body { padding: 0; margin: 0; }
                    @page { size: auto; margin: 20mm; }
                }
                ul { list-style-type: disc; margin-left: 1.5rem; }
                li { margin-bottom: 0.25rem; }
            </style>
        </head>
        <body class="p-8 bg-white text-slate-900">
            <div class="no-print flex justify-between items-center mb-6 border-b pb-4">
                <h1 class="text-xl font-bold text-slate-500">Preview Mode</h1>
                <div class="flex gap-2">
                    <button onclick="window.close()" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Close</button>
                    <button onclick="window.print()" class="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow">🖨 Print (Ctrl+P)</button>
                </div>
            </div>
            <div class="print-content max-w-5xl mx-auto">
                ${contentHtml}
            </div>
        </body>
        </html>
    `);
    win.document.close();
};

export const getCategoryCode = (cat: string) => {
    const map: Record<string, string> = {
        "หมวดวิชาศึกษาทั่วไป": "1",
        "วิชาแกน (2.1)": "2.1",
        "วิชาเฉพาะบังคับ (2.2.1)": "2.2.1",
        "วิชาเฉพาะเลือก (2.2.2)": "2.2.2",
        "ประสบการณ์ภาคสนาม (2.2.3)": "2.2.3",
        "วิชาเลือกเสรี (2.3)": "2.3"
    };
    return map[cat] || "";
};
