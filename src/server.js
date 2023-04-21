const express = require('express');
const elasticsearch = require('elasticsearch');
const path = require('path');
const config = require('./config')
const crudElastic = require('./elasticsearch/createIndex')

const app = express();

(async () => {
  // await crudElastic.createIndex(config.indexName_completion, 'completion');
  // await crudElastic.bulkIndex(config.indexName_completion)

  // await crudElastic.createIndex(config.indexName_search, 'search_as_you_type');
  // await crudElastic.bulkIndex(config.indexName_search)
})();

app.get('/autocomplete_completion/:query', async (req, res) => {
  const query = req.params.query;
  
  try {
    const suggestions = await crudElastic.search_completion(query)

    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something wrong');
  }
});

app.get('/autocomplete_search/:query', async (req, res) => {
  const query = req.params.query;
  
  try {
    const suggestions = await crudElastic.search_search_as_you_type(query)

    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something wrong');
  }
});

app.use(express.static(path.join(__dirname, '../public')));

console.log("__dirname", __dirname)

app.listen(3000, () => {
  console.log('Is running on port 3000');
});
