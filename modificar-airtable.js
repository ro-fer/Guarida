const TOKEN = 'patuBqD5kRmv5Czb3.3606ec1cb081893073bc5ad358268413b886eb0a5ed1be2bf6e4e1c91d127a42';
const BASE_ID = 'app4fXaIH5R6dmaY7';
const TABLE_NAME = 'Codigos_Tazas';

// Función para procesar el archivo de Excel
function processExcel() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Por favor, selecciona un archivo primero');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        updateAirtable(jsonData);
    };
    reader.readAsArrayBuffer(file);
}

// Función para actualizar Airtable
async function updateAirtable(data) {
    for (let row of data) {
        // Suponiendo que los nombres de las columnas en Excel son 'Inicio', 'Codigo de la web', 'Codigo de la web sin espacios', 'Formato', 'Localizacion para sistema'
        const inicio = row['Inicio'];
        const codigoWeb = row['Codigo de la web'];
        const codigoWebSinEspacios = row['Codigo de la web sin espacios'];
        const formato = row['Formato'];
        const localizacion = row['Localizacion para sistema'];

        // Obtener el ID del registro a actualizar
        const recordId = await getRecordIdByName(inicio);
        if (recordId) {
            await updateRecord(recordId, {
                'Codigo de la web': codigoWeb,
                'Codigo de la web sin espacios': codigoWebSinEspacios,
                'Formato': formato,
                'Localizacion para sistema': localizacion
            });
        } else {
            console.log(`Registro con nombre ${inicio} no encontrado.`);
        }
    }
    alert('Datos actualizados con éxito');
}

// Función para obtener el ID del registro por nombre
async function getRecordIdByName(inicio) {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?filterByFormula={Inicio}='${inicio}'`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': TOKEN
            }
        });

        if (!response.ok) {
            throw new Error('Error obteniendo datos: ' + response.statusText);
        }

        const data = await response.json();
        console.log('Respuesta de getRecordIdByName:', data);
        if (data.records.length > 0) {
            return data.records[0].id;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error en getRecordIdByName:', error);
        return null;
    }
}

// Función para actualizar el registro
async function updateRecord(recordId, fields) {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${recordId}`;
    const data = {
        fields: fields
    };

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Error actualizando datos: ' + response.statusText);
        }

        const responseData = await response.json();
        console.log('Respuesta de updateRecord:', responseData);
    } catch (error) {
        console.error('Error en updateRecord:', error);
    }
}
