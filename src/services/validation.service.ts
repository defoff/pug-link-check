import * as request from 'request';
import * as cheerio from 'cheerio';
import * as isUrl from '../../node_modules/is-url';

import CheckProcessModel from '../models/check-process.model';

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
    }

    requestUrl(): Promise<any> {
        let rt = this;
        return new Promise((resolve, reject) => {
            if (isUrl(this._stc) && isUrl(this._ltc)) {
                request(this._stc.toString(), (error, response, body) => {
                    if (error) {
                        reject(new Error(error));
                    }
                    if (response.statusCode === 200) {
                        new CheckProcessModel({
                            siteToCheck: this._stc,
                            linkToCheck: this._ltc
                        }).save();                  
                        let $ = cheerio.load(body);
                        this.collectInternalLinks($);
                        const pageTitle = $('title').text();
                        let hasLink = rt.findLink();
                        let crawlerResult = {
                            'pageTitle': pageTitle,
                            'hasLink': hasLink,
                            'links': this._allAbsoluteLinks
                        }
                        resolve(crawlerResult);
                    }
                });   
            } else {
                let err = {
                    'type': 'validation-error',
                    'userLtc': isUrl(this._ltc),
                    'userStc': isUrl(this._stc),
                    'ltc': this._ltc,
                    'stc': this._stc
                }
                reject(err);
            }
        });
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