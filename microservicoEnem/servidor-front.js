const express = require('express');
const path = require('path');
const app = express();
const PORT = 5500;

app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Front-end rodando em http://localhost:${PORT}`);
});