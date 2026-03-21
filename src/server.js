const express = require('express');
const cors = require('cors');
const t = require('./transform');

const app = express();
const PORT = process.env.PORT || 3600;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.text({ limit: '5mb', type: 'text/*' }));

app.get('/', (req, res) => {
  res.json({
    name: 'data-transform-api',
    version: '1.0.0',
    endpoints: [
      'POST /api/v1/json-to-csv',
      'POST /api/v1/csv-to-json',
      'POST /api/v1/json-to-xml',
      'POST /api/v1/flatten',
      'POST /api/v1/unflatten',
      'POST /api/v1/filter',
      'POST /api/v1/pick',
      'POST /api/v1/sort',
      'POST /api/v1/stats',
      'POST /api/v1/validate',
    ],
  });
});

app.post('/api/v1/json-to-csv', (req, res) => {
  try {
    const { data, delimiter } = req.body;
    res.type('text/csv').send(t.jsonToCsv(data, { delimiter }));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/v1/csv-to-json', (req, res) => {
  try {
    const csv = typeof req.body === 'string' ? req.body : req.body.csv;
    const delimiter = req.body.delimiter;
    res.json({ data: t.csvToJson(csv, { delimiter }) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/v1/json-to-xml', (req, res) => {
  try {
    const { data, rootName } = req.body;
    res.type('application/xml').send(t.jsonToXml(data, rootName));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/v1/flatten', (req, res) => {
  try { res.json({ data: t.flatten(req.body.data || req.body) }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/v1/unflatten', (req, res) => {
  try { res.json({ data: t.unflatten(req.body.data || req.body) }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/v1/filter', (req, res) => {
  try {
    const { data, query } = req.body;
    const result = t.filterJson(data, query);
    res.json({ count: result.length, data: result });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/v1/pick', (req, res) => {
  try {
    const { data, fields } = req.body;
    res.json({ data: t.pickFields(data, fields) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/v1/sort', (req, res) => {
  try {
    const { data, field, order } = req.body;
    res.json({ data: t.sortJson(data, field, order) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/v1/stats', (req, res) => {
  try {
    const { data, field } = req.body;
    res.json(t.stats(data, field));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/v1/validate', (req, res) => {
  try {
    const str = typeof req.body === 'string' ? req.body : JSON.stringify(req.body.data);
    res.json(t.validate(str));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`data-transform-api running on http://localhost:${PORT}`);
});
