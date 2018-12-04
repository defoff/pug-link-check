"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const Crawler = require("node-html-crawler");
const validator_1 = require("./validator");
const helmet = require("helmet");
class Server {
    constructor() {
        this.server = express();
        this.init();
        this.routes();
    }
    init() {
        // secure headers with helmet defaults
        this.server.use(helmet());
        // mount public folder for assets
        this.server.use(express.static('public'));
        // set view engine and template directory
        this.server.set('views', './views');
        this.server.set('view engine', 'pug');
        // configure top level body parser
        this.server.use(bodyParser.urlencoded({ extended: false }));
    }
    routes() {
        /**
         * example route
         */
        this.server.get('/kitchensink', (req, res) => {
            res.render('kitchensink');
        });
        this.server.get('/', (req, res) => {
            res.render('landing');
        });
        this.server.post('/validate_1', (req, res) => {
            let ltc = this.sanitizeString(req.body.linktocheck);
            let stc = this.sanitizeString(req.body.sitetocheck);
            let crawler = new Crawler({
                protocol: 'https:',
                domain: 'gewichtheberschuhe.info',
                limitForConnections: 15,
                limitForRedirects: 5,
                timeout: 500 // number of milliseconds between pending connection, default 100 
            });
            crawler.crawl();
            crawler.on('data', data => {
                // console.log(data.result.links);
                data.result.links.forEach(el => {
                    // console.log(el.href);
                    if (el.href === ltc) {
                        console.log(`Found link:LINK: ${ltc}ENTRY FOUND ON SITE: ${el.href}`);
                    }
                });
            }); // some html-page a loaded
            crawler.on('error', error => { }); // error in crawling
            crawler.on('end', () => { }); // all pages found are crawled and loaded
        });
        this.server.post('/validate', (req, res) => {
            let ltc = this.sanitizeString(req.body.linktocheck);
            let stc = this.sanitizeString(req.body.sitetocheck);
            let v = new validator_1.Validator(ltc, stc);
            v.requestUrl().then((crawlerResult) => {
                res.render('landing', {
                    pageTitle: crawlerResult.pageTitle,
                    hasLink: crawlerResult.hasLink,
                    links: crawlerResult.links
                });
            }, (err) => {
                res.send(err);
            });
        });
    }
    sanitizeString(str) {
        str = str.replace(/[^a-z0-9.:/,_-]/gim, "");
        return str.trim();
    }
}
exports.default = new Server().server;
//# sourceMappingURL=server.js.map