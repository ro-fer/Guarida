const API_KEY = 'patuBqD5kRmv5Czb3.3606ec1cb081893073bc5ad358268413b886eb0a5ed1be2bf6e4e1c91d127a42';
const BASE_ID = 'app4fXaIH5R6dmaY7';

async function loadJSONFromAirtable(viewName) {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/${viewName}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to load JSON from Airtable view ${viewName}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Data from Airtable:', data);
        return data;
    } catch (error) {
        console.error(`Error loading JSON from Airtable view ${viewName}:`, error);
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
            throw new Error('¡Seleccione el archivo primero!');
        }
        if (!clientName) {
            throw new Error('¡Ingrese el nombre del cliente!');
        }

        // Cargar los datos de Airtable
        const jsonCodesDescriptions = await loadJSONFromAirtable('Codigos_Tazas');
        const jsonCodesToRemove = await loadJSONFromAirtable('Otros_Codigos');

        // Obtener arrays de códigos y descripciones
        const codesToRemove = jsonCodesToRemove.records.map(record => record.fields['Codigo a remover']);
        const codesDescriptions = jsonCodesDescriptions.records.map(record => ({
            codigo: record.fields['Codigo de la web'],
            descripcion: record.fields['Localizacion para sistema']
        }));

        // Leer el archivo Excel
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
                // Comparar los códigos después de eliminar espacios en blanco adicionales
                return !codesToRemove.includes(row.Codigo.trim());
            });

            // Crear un único vector con repeticiones según la cantidad de los códigos
            const codigos_sirven = [];
            jsonData.forEach(row => {
                for (let i = 0; i < row.Cantidad; i++) {
                    codigos_sirven.push(row.Codigo);
                }
            });

            // Reemplazar los códigos por sus descripciones
            const descripciones = codigos_sirven.map(codigo => {
                const descripcionObj = codesDescriptions.find(item => item.codigo === codigo);
                return descripcionObj ? descripcionObj.descripcion : '';
            });

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
            csvContent += "Imagen1,Imagen2\n"; // Aquí se cambió "Imagen 1" y "Imagen 2"
            newData.forEach(row => {
                csvContent += `${row["Imagen 1"]},${row["Imagen 2"]}\n`; // Aquí se cambió "Imagen 1" y "Imagen 2"
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
