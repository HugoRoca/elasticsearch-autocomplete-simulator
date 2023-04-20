const express = require('express');
const elasticsearch = require('elasticsearch');
const path = require('path');

const app = express();
const client = new elasticsearch.Client({ host: 'localhost:9200' });

const products = [
  {
    id: 1,
    nombre: 'Camiseta',
    nombre_sugerido: {
      input: ['Camiseta', 'Ropa', 'Hombre'],
      weight: 3
    }
  },
  {
    id: 2,
    nombre: 'Pantalón',
    nombre_sugerido: {
      input: ['Pantalón', 'Ropa', 'Hombre'],
      weight: 3
    }
  },
  {
    id: 3,
    nombre: 'Zapatillas',
    nombre_sugerido: {
      input: ['Zapatillas', 'Calzado', 'Hombre'],
      weight: 3
    }
  },
  {
    id: 4,
    nombre: 'Vestido',
    nombre_sugerido: {
      input: ['Vestido', 'Ropa', 'Mujer'],
      weight: 3
    }
  },
  {
    id: 5,
    nombre: 'Zapatos',
    nombre_sugerido: {
      input: ['Zapatos', 'Calzado', 'Mujer'],
      weight: 3
    }
  }
];

const createIndex = async (index) => {
  try {
    const exists = await client.indices.exists({ index });

    if (exists) {
      await client.indices.delete({ index });
    }

    await client.indices.create({
      index,
      body: {
        mappings: {
          properties: {
            nombre: { type: 'text' },
            nombre_sugerido: { type: 'search_as_you_type' }
          }
        }
      }
    });

    console.log(`Índice ${index} creado con éxito.`);
  } catch (error) {
    console.error(error);
  }
};

const bulkIndex = async (index, data) => {
  let bulkBody = [];

  data.forEach(item => {
    bulkBody.push({
      index: {
        _index: index,
        _id: item.id
      }
    });

    bulkBody.push(item);
  });

  await client.bulk({ body: bulkBody });
};

const indexName = 'productos';

(async () => {
  await createIndex(indexName);
  await bulkIndex(indexName, products);
})();

app.get('/autocomplete/:query', async (req, res) => {
  const query = req.params.query;
  
  try {
    const result = await client.search({
      index: 'productos',
      body: {
        suggest: {
          suggestions: {
            prefix: query,
            completion: {
              field: 'nombre_sugerido'
            }
          }
        }
      }
    });
    
    const suggestions = result.suggest.suggestions[0].options.map(option => option.text);
    
    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en el servidor');
  }
});

app.use(express.static(path.join(__dirname, 'static')));

app.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});
