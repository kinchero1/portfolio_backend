
const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig')
const fs = require('fs')
const db = new JsonDB(new Config("database/portfolio", true, false, '/'));


const securityMiddleWare = (req, res, next) => {
    if (req.method == 'GET' || req.path == "/db/pushAll") {
        next()
        return
    }

    if (req.headers['userid'] != process.env.userId) {
        res.status(403).json({
            message: 'forbidden'
        })
        return
    }

    next()
}







module.exports = (app) => {

    app.use(securityMiddleWare)


    app.post('/files/clean', (req, res) => {
        let files = req.body.files
        if (!files) {
            res.status(400).send('bad request')
            return
        }
        for (let i = 0; i < files.length; i++) {
            if (files[i].includes('/.') || files[i].includes('/..')) {
                res.status(400).send('bad request')
                return
            }

        }
        for (let i = 0; i < files.length; i++) {

            if (fs.existsSync(process.cwd() + '/' + files[i])) {
                fs.rmSync(process.cwd() + '/' + files[i])
            }
        }
        res.json({
            message: 'deleted Succesfully'
        })

    })

    app.post('/files/hardClean', (req, res) => {
        let usedFiles = ['.gitkeep']
        if (db.exists("/projects/en")) {
            usedFiles.push(...db.getData('/projects/en').map(x => x.picture))
        }
        if (db.exists("/projects/fr")) {
            usedFiles.push(...db.getData('/projects/fr').map(x => x.picture))
        }
        let files = fs.readdirSync(process.cwd() + '/public/uploadedFiles/projects').map(x => 'public/uploadedFiles/projects/' + x)
        let fileToDelete = files.filter(x => !usedFiles.includes(x))


        for (let i = 0; i < fileToDelete.length; i++) {

            if (fs.existsSync(process.cwd() + '/' + fileToDelete[i])) {
                fs.rmSync(process.cwd() + '/' + fileToDelete[i])
            }
        }
        res.json({
            message: 'deleted Succesfully'
        })

    })

    app.get('/db/getAll', (req, res) => {
        res.json(db.getData('/'))
    })

    app.post('/db/pushAll', (req, res) => {
        if (!req.query.secret) {
            res.status(400).send('no secret key supplied')
            return
        }
        if (req.query.secret != process.env.SECRET) {
            res.status(400).send('wrong secret key')
            return
        }

        if (!req.body) {
            res.status(400).send('no body supplied')
            return
        }


        try {
            db.push('/', req.body)
            res.send('updated Succesfully')
        } catch (error) {
            res.send('error updating db')
        }

     

    })

    app.get("/db/:document", (req, res) => {

        console.log("call");
        let documentName = req.params.document
        if (!documentName) {
            res.status(403).send("bad request");
            return
        }
        documentName = documentName.replace('.', '/')
        try {
            if (db.exists("/" + documentName)) {
                res.json(db.getData("/" + documentName))
            } else {
                res.json({})
            }

        } catch (error) {
            res.status(500).send({ error: "server error" })
        }

    })

    app.put("/db/:document/update", (req, res) => {
        let documentName = req.params.document
        if (!documentName) {
            res.status(403).send("bad request");
            return
        }
        documentName = documentName.replace('.', '/')
        try {

            db.push('/' + documentName, req.body || {}, true)

            res.json(db.getData("/" + documentName))
            db.save()
        } catch (error) {
            res.status(500).send({ error: "server error" })
        }
    })

    app.delete("/db/:document/delete", (req, res) => {
        let documentName = req.params.document
        if (!documentName) {
            res.status(403).send("bad request");
            return
        }
        try {
            if (db.exists("/" + documentName)) {
                db.delete('/' + documentName)
                res.send({ message: "deleted succesfully" })
            } else {
                res.send({ message: 'dataPath doesn\'t exist' })
            }

        } catch (error) {
            res.status(500).send({ error: "server error" })
        }

    })






}