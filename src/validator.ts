import * as request from 'request';
import * as cheerio from 'cheerio';
class Validator {

    public _ltc: String;
    public _stc: String;
    public _$: CheerioStatic;
    public _allRelativeLinks: String[];
    public _allAbsoluteLinks: String[];

    constructor(ltc: String, stc: String) {
        console.log('initializing class: Validator');
        this._ltc = ltc;
        this._stc = stc;
        this._allRelativeLinks = [];
        this._allAbsoluteLinks = [];
        console.log(this._stc);
        // this.collectInternalLinks(this._$);
        this.requestUrl();
    }

    requestUrl() {
        let rt = this;
        let dataPromise = new Promise((resolve, reject) => {
            request(this._stc.toString(), (error, response, body) => {
                if (error) {
                    reject('Error: ' + error);
                }
                if (response.statusCode === 200) {
                    //parse the document
                    let $ = cheerio.load(body);
                    //pick all internal links
                    this.collectInternalLinks($);
                    //pick page title of browsed page
                    const pageTitle = $('title').text();
                    let hasLink = rt.findLink();
                    //construct result object
                    let crawlerResult = {
                        'pageTitle': pageTitle,
                        'hasLink': hasLink,
                        'links': this._allAbsoluteLinks
                    }
                    console.log(hasLink);
                    resolve(crawlerResult);
                }
            });        
        });
        return dataPromise; 
    }

    collectInternalLinks($) {    
        let rt = this;  
        let relativeLinks = $("a[href^='/']");
        relativeLinks.each(function() {
            rt._allRelativeLinks.push($(this).attr('href'));
        });
        let absoluteLinks = $("a[href^='http']");
        absoluteLinks.each(function() {
            rt._allAbsoluteLinks.push($(this).attr('href'));
        });
    }

    findLink(): boolean {
        let found = false;
        this._allAbsoluteLinks.forEach((link) => {
            console.log(link.localeCompare(this._ltc.toString()));
            if (link.localeCompare(this._ltc.toString()) == 0) {
                found = true;
            }
        });
        return found;
    }

}

export { Validator }