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
        console.log('Data from Airtable:', data); // Agregar esta línea para imprimir en la consola
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

        // Verificar si jsonCodesDescriptions y jsonCodesToRemove contienen la propiedad records
        if (!jsonCodesDescriptions.records || !jsonCodesToRemove.records) {
            throw new Error('Los datos recibidos de Airtable no están en el formato esperado.');
        }

        // Obtener arrays de códigos y descripciones
        const codesToRemove = jsonCodesToRemove.records.map(record => record.fields['Codigo a remover']);
        const codesDescriptions = jsonCodesDescriptions.records.map(record => ({
            codigo: record.fields['Codigo de la web'],
            descripcion: record.fields['Localizacion para sistema']
        }));

        // Crear un mapa de descripciones para una búsqueda rápida
        const descripcionMap = new Map();
        codesDescriptions.forEach(item => {
            descripcionMap.set(item.codigo, item.descripcion);
        });

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

// Iterar sobre cada fila en jsonData
jsonData.forEach(row => {
    // Agregar la cantidad especificada de cada código al array
    for (let i = 0; i < row.Cantidad; i++) {
        codigos_sirven.push(row.Codigo.trim());
    }
});

           // Crear un único vector con repeticiones según la cantidad de los códigos
// Generar las descripciones finales
let descripciones = codigos_sirven.map(codigo => {
    const descripcion = descripcionMap.get(codigo);
    return descripcion !== undefined ? descripcion : '/Users/karenlopezfranz/Desktop/CarpetaMadre/impar.png';
});

// Si el último elemento es '/Users/karenlopezfranz/Desktop/CarpetaMadre/impar.png' y no tiene descripción,
// asegurarse de que esté al final del array de descripciones
if (descripciones.length % 2 !== 0 && descripciones[descripciones.length - 1] === '/Users/karenlopezfranz/Desktop/CarpetaMadre/impar.png') {
    descripciones.push('/Users/karenlopezfranz/Desktop/CarpetaMadre/impar.png');
}

// Mostrar el resultado final en la consola
console.log("Descripciones finales:", descripciones);
console.log("Cantidad de descripciones:", descripciones.length);

// Crear newData para almacenar las descripciones en las columnas "Imagen 1" y "Imagen 2"
const newData = [];
for (let i = 0; i < descripciones.length; i += 2) {
    const descripcion1 = descripciones[i];
    const descripcion2 = descripciones[i + 1];
    newData.push({
        "Imagen 1": descripcion1,
        "Imagen 2": descripcion2
    });
}

// Eliminar filas donde ambas imágenes son '/Users/karenlopezfranz/Desktop/CarpetaMadre/impar.png'
const filteredData = newData.filter(row => {
    return !(row["Imagen 1"] === '/Users/karenlopezfranz/Desktop/CarpetaMadre/impar.png' && row["Imagen 2"] === '/Users/karenlopezfranz/Desktop/CarpetaMadre/impar.png');
});

// Generar el archivo CSV
let csvContent = "data:text/csv;charset=utf-8,";
csvContent += "Imagen1,Imagen2\n"; // Aquí se cambió "Imagen 1" y "Imagen 2"
filteredData.forEach(row => {
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
