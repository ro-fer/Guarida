async function loadJSON(file) {
    try {
        const response = await fetch(file);
        if (!response.ok) {
            throw new Error(`Failed to load JSON from ${file}: ` + response.statusText);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error loading JSON from ${file}:`, error);
        throw error;
    }
}

async function processFile() {
    try {
        const fileInput = document.getElementById('fileInput');
        const clientNameInput = document.getElementById('clientName');
        const file = fileInput.files[0];
        const clientName = clientNameInput.value.trim();

        if (!file) {
            throw new Error('Seleccione el archivo primero!');
        }
        if (!clientName) {
            throw new Error('Ingrese el nombre del cliente!');
        }

        // Cargar los archivos JSON
        const codesToRemove = await loadJSON('./codigos_sacar.json');
        console.log('Códigos a remover:', codesToRemove);

        const codesDescriptions = await loadJSON('./codigos_descripcion.json');
        console.log('Descripciones de códigos:', codesDescriptions);

        const reader = new FileReader();
        reader.onload = function(event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convertir la hoja a JSON
            let jsonData = XLSX.utils.sheet_to_json(worksheet);
            console.log('Datos del archivo Excel:', jsonData);

            // Filtrar las filas según el listado de códigos a remover
            jsonData = jsonData.filter(row => {
                console.log('Código de la fila:', row.Codigo);
                console.log('Cantidad de la fila:', row.Cantidad);
                return !codesToRemove.includes(row.Codigo);
            });

            // Crear un único vector con repeticiones según la cantidad de los códigos
            const codigos_sirven = [];
            jsonData.forEach(row => {
                for (let i = 0; i < row.Cantidad; i++) {
                    codigos_sirven.push(row.Codigo);
                }
            });

            // Reemplazar los códigos por sus descripciones
            const descripciones = codigos_sirven.map(codigo => codesDescriptions[codigo] || codigo);

            // Crear newData para almacenar las descripciones en las columnas "Imagen 1" y "Imagen 2"
            const newData = [];
            for (let i = 0; i < descripciones.length; i += 2) {
                const descripcion1 = descripciones[i] || '';
                const descripcion2 = descripciones[i + 1] || '';
                newData.push({
                    "Imagen 1": descripcion1,
                    "Imagen 2": descripcion2
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
            downloadLink.download = `pedido_mayorista_${clientName}.csv`;
            downloadLink.style.display = 'block';
            downloadLink.innerText = 'Archivo terminado!';
        };
        reader.readAsArrayBuffer(file);
    } catch (error) {
        console.error('Error processing file:', error);
        // Puedes mostrar un mensaje de error al usuario si lo deseas
    }
}
