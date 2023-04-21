const elasticsearch = require("elasticsearch");
const config = require("../config");
const data = require("../data/data.json");

const client = new elasticsearch.Client({ host: config.host });

module.exports = {
  createIndex: async (index, typeMapping) => {
    try {
      const exists = await client.indices.exists({ index });

      if (exists) {
        await client.indices.delete({ index });
      }

      let body = {
        mappings: {
          properties: {
            title_suggest: { type: "completion" },
          },
        },
      };

      if (typeMapping !== "completion") {
        body = {
          mappings: {
            properties: {
              title_suggest: {
                type: "search_as_you_type",
                analyzer: "standard",
                search_analyzer: "standard",
              },
            },
          },
        };
      }

      await client.indices.create({
        index,
        body,
      });

      console.log(`Index ${index} was created successfully.`);
    } catch (error) {
      console.error(error);
    }
  },
  bulkIndex: async (index) => {
    let bulkBody = [];

    data.forEach((item) => {
      bulkBody.push({
        index: {
          _index: index,
          _id: item.id,
        },
      });

      bulkBody.push(item);
    });

    await client.bulk({ body: bulkBody });
  },
  search_completion: async (query) => {
    const result = await client.search({
      index: config.indexName_completion,
      body: {
        suggest: {
          suggestions: {
            prefix: query,
            completion: {
              field: "title_suggest",
            },
          },
        },
      },
    });

    return result.suggest.suggestions[0].options.map((option) => option.text);
  },
  search_search_as_you_type: async (text) => {
    const result = await client.search({
      index: config.indexName_search,
      body: {
        query: {
          multi_match: {
            query: text,
            type: "bool_prefix",
            fields: [
              "title_suggest",
              "title_suggest._2gram",
              "title_suggest._3gram",
            ],
          },
        },
      },
    });

    return result.hits.hits.map((option) => option._source.title_suggest);
  },
};
