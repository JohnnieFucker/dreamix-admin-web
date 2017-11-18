const express = require('express');
const path = require('path');
const compression = require('compression');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('./config/admin');
const logger = require('morgan');
const partials = require('express-partials');
const http = require('http');

const app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('.html', require('ejs').__express);

app.use(partials());
app.use(logger('dev'));
app.use(compression());
app.use(bodyParser.json({ type: '*/*' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('x-powered-by', false);


app.get('/', (req, res) => {
    res.render('index', config);
});

app.get('/module/:mname', (req, res) => {
    res.render(req.params.mname);
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
        res.status(err.status || 500);
        res.render('error.ejs', {
            layout: '',
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error.ejs', {
        layout: '',
        message: err.message,
        error: {}
    });
});


const port = 7001;
app.set('port', port);
const server = http.createServer(app);
server.listen(port);

console.log(`[dreami admin web] started visit http://127.0.0.1:${port}`);
