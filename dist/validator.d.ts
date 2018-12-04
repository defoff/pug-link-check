/// <reference types="cheerio" />
declare class Validator {
    _ltc: String;
    _stc: String;
    _$: CheerioStatic;
    _allRelativeLinks: String[];
    _allAbsoluteLinks: String[];
    constructor(ltc: String, stc: String);
    requestUrl(): Promise<{}>;
    collectInternalLinks($: any): void;
    findLink(): boolean;
}
export { Validator };
