interface ProcessItem {
    _id: string;
    creationDate: Date;
    editDates: Date[];
    editDate: Date;
    editUsers: string[];
    editUser: string;
    submissionDate: Date;
    submissionUser: string;

    status: string;
    targetUrl: string;
    backlinkOriginUrl: string;
}

export default ProcessItem;