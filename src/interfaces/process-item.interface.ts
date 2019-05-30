interface ProcessItem {
    _id: string;
    creationDate: Date;
    editDates: Date[];
    editDate: Date;
    editingUsers: string[];
    editingUser: string;
    submissionDate: Date;
    submissionUser: string;

    status: string;
    targetUrl: string;
    backlinkOriginUrl: string;
}

export default ProcessItem;