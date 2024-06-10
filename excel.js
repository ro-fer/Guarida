async function loadCodes() {
    try {
        const response = await fetch('./codigos_sacar.json');
        if (!response.ok) {
            throw new Error('Failed to load JSON: ' + response.statusText);
        }
        const data = await response.json();
        return data.Codigo;
    } catch (error) {
        console.error('Error loading codes:', error);
        throw error;
    }
}

async function processFile() {
    try {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (!file) {
            throw new Error('Seleccione el archivo primero!');
        }

        const codesToRemove = await loadCodes();

        const reader = new FileReader();
        reader.onload = function(event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convertir la hoja a JSON
            let jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Filtrar las filas según el listado de códigos
            jsonData = jsonData.filter(row => !codesToRemove.includes(row.Codigo));

            // Crear un único vector con repeticiones según la cantidad de los códigos
            const codigos_sirven = [];
            jsonData.forEach(row => {
                for (let i = 0; i < row.Cantidad; i++) {
                    codigos_sirven.push(row.Codigo);
                }
            });

            // Dividir el vector en dos partes iguales
            const mitad = Math.ceil(codigos_sirven.length / 2);
            const codigos1 = codigos_sirven.slice(0, mitad);
            const codigos2 = codigos_sirven.slice(mitad);

            // Crear newData para almacenar los códigos en las columnas "Imagen 1" y "Imagen 2"
            const newData = [];
            for (let i = 0; i < Math.max(codigos1.length, codigos2.length); i++) {
                const codigo1 = codigos1[i] || '';
                const codigo2 = codigos2[i] || '';
                newData.push({
                    "Imagen 1": codigo1,
                    "Imagen 2": codigo2
                });
            }

            // Generar el archivo CSV
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Imagen 1,Imagen 2\n";
            newData.forEach(row => {
                csvContent += `${row["Imagen 1"]},${row["Imagen 2"]}\n`;
            });

            // Crear un enlace de descarga para el archivo CSV
            const encodedUri = encodeURI(csvContent);
            const downloadLink = document.getElementById('downloadLink');
            downloadLink.href = encodedUri;
            downloadLink.download = 'pedido_mayorista.csv';
            downloadLink.style.display = 'block';
            downloadLink.innerText = 'Archivo terminado!';
        };
        reader.readAsArrayBuffer(file);
    } catch (error) {
        console.error('Error processing file:', error);
        // Puedes mostrar un mensaje de error al usuario si lo deseas
    }
}
