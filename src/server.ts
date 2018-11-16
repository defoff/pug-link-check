import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as Crawler from 'node-html-crawler';
import * as request from 'request';
import * as cheerio from 'cheerio';
import * as URL from 'url-parse';
import { Validator } from './validator';

class Server {
    public server: express.Application;
    constructor() {
        this.server = express();
        this.init();
        this.routes();
    }
    public init(): void {
        // mount public folder for assets
        this.server.use(express.static('public'));
        // set view engine and template directory
        this.server.set('views', './views');
        this.server.set('view engine', 'pug');
        // configure top level body parser
        this.server.use(bodyParser.urlencoded({ extended: false }));
        
    }
    public routes(): void {
        /**
         * example route
         */
        this.server.get('/kitchensink', (req, res) => {
            res.render('kitchensink');
        });

        this.server.get('/', (req, res) => {
            res.render('landing')
        });

        this.server.post('/validate_1', (req, res) => {
            let ltc = this.sanitizeString(req.body.linktocheck);
            let stc = this.sanitizeString(req.body.sitetocheck);

            let crawler = new Crawler({
                protocol: 'https:', // default 'http:'
                domain: 'gewichtheberschuhe.info', // default 'example.com'
                limitForConnections: 15, // number of simultaneous connections, default 10
                limitForRedirects: 5, // possible number of redirects, default 3
                timeout: 500 // number of milliseconds between pending connection, default 100 
            });
            crawler.crawl();
            crawler.on('data', data => { 
                // console.log(data.result.links);
                data.result.links.forEach(el => {
                    // console.log(el.href);
                    if (el.href===ltc) {
                        console.log(`Found link:LINK: ${ltc}ENTRY FOUND ON SITE: ${el.href}`)
                    }
                });

            }); // some html-page a loaded
            crawler.on('error', error => { }); // error in crawling
            crawler.on('end', () => { }); // all pages found are crawled and loaded
        });

        this.server.post('/validate', (req, res) => {
            let ltc = this.sanitizeString(req.body.linktocheck);
            let stc = this.sanitizeString(req.body.sitetocheck);
            let v = new Validator(ltc, stc);
            v.requestUrl().then((crawlerResult:any) => {
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
    public sanitizeString(str) {
        str = str.replace(/[^a-z0-9.:/,_-]/gim,"");
        return str.trim();
    }
}
export default new Server().server;