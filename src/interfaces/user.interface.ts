interface User {
    _id: string;
    email: string;
    password: string;
    role: string;
    verified: boolean;
    generateHash: Function;
    validPassword: Function;
    isAdmin: Function;
    findById: Function;
}

export default User;