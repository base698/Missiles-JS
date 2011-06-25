express = require('express')
app = express.createServer()

oneYear = 1000*60*60*24
app.use(express.static(__dirname, { maxAge: oneYear }))
app.listen 1337


