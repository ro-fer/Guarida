const TOKEN = 'patuBqD5kRmv5Czb3.3606ec1cb081893073bc5ad358268413b886eb0a5ed1be2bf6e4e1c91d127a42';
const BASE_ID = 'app4fXaIH5R6dmaY7';
const TABLE_NAME = 'Otros_Codigos';

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
        const codigoWeb = row['Codigo de la web'];

        await createRecord({
            'Codigo de la web': codigoWeb
        });
    }
    alert('Datos actualizados con éxito');
}


async function createRecord(fields) {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
    const data = {
        fields: fields
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Error creando el registro: ' + response.statusText);
        }

        const responseData = await response.json();
        console.log('Respuesta de createRecord:', responseData);
    } catch (error) {
        console.error('Error en createRecord:', error);
    }
}