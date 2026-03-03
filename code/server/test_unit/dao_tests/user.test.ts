import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import { User, Role } from "../../src/components/user"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { UserNotFoundError } from "../../src/errors/userError"
jest.mock("crypto")
jest.mock("../../src/db/db.ts")

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true
describe("createUser DAO test", () => {

test("It should resolve true", async () => {
    const userDAO = new UserDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });
    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
        return (Buffer.from("salt"))
    })
    const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
        return Buffer.from("hashedPassword")
    })
    const result = await userDAO.createUser("username", "name", "surname", "password", "role")
    expect(result).toBe(true)
    mockRandomBytes.mockRestore()
    mockDBRun.mockRestore()
    mockScrypt.mockRestore()


})

test("errore database", async () => {
    const userDAO = new UserDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(new Error())
        return {} as Database
    });
    await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow(Error);

    mockDBRun.mockRestore()


})

test("Utente già esistente", async()=>{
    const userDAO = new UserDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(new Error("SQLITE_CONSTRAINT: UNIQUE constraint failed: users.username"))
        return {} as Database
    });
    await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow(Error);

    mockDBRun.mockRestore()
})

})
describe("GetUsers DAO test", () => {

    const userDAO = new UserDAO()
    
    test("utenti trovati con successo", async () => {
        const users: User[] = [new User("username", "name", "surname", Role.MANAGER, "address", "1998-02-04"), new User("username", "name", "surname", Role.MANAGER, "address", "1998-02-04")]


        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, users);
            return {} as any;
        });

        const result = await userDAO.getUsers();
        expect(result).toEqual(users);
        mockDBAll.mockRestore();
    });

    test("errore nel database", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), []);
                        return {} as any;


        });

        await expect(userDAO.getUsers()).rejects.toThrow(Error);
        mockDBAll.mockRestore();
    });

    test("nessun utente trovato", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback.call({lengths:0}, null);
            return {} as any;

        });

        await expect(userDAO.getUsers()).rejects.toThrow(UserNotFoundError);
        mockDBAll.mockRestore();
    });
});

describe("getIsUserAuthenticated DAO test", () => {

    
    const userDAO = new UserDAO();

    test("utente autenticato con successo", async () => {
        const username = "testuser";
        const plainPassword = "testpassword";
        const salt = Buffer.from("salt");
        const hashedPassword = Buffer.from("hashedPassword");

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username, password: hashedPassword.toString("hex"), salt });
            return {} as any;
        });
        const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
            return hashedPassword;
        });
        const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((a, b) => {
            return true;
        });

        const result = await userDAO.getIsUserAuthenticated(username, plainPassword);
        expect(result).toBe(true);

        mockDBGet.mockRestore();
        mockScryptSync.mockRestore();
        mockTimingSafeEqual.mockRestore();
    });

    test("utente non trovato", async () => {
        const username = "testuser";
        const plainPassword = "testpassword";

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as any;
        });

        const result = await userDAO.getIsUserAuthenticated(username, plainPassword);
        expect(result).toBe(false);

        mockDBGet.mockRestore();
    });

    test("errore nel database", async () => {
        const username = "testuser";
        const plainPassword = "testpassword";

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), null);
            return {} as any;
        });

        await expect(userDAO.getIsUserAuthenticated(username, plainPassword)).rejects.toThrow("Database error");

        mockDBGet.mockRestore();
    });

    test("password non corrisponde", async () => {
        const username = "testuser";
        const plainPassword = "testpassword";
        const salt = Buffer.from("salt");
        const hashedPassword = Buffer.from("hashedPassword");
        const wrongPassword = Buffer.from("wrongPassword");

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username, password: hashedPassword.toString("hex"), salt });
            return {} as any;
        });
        const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
            return wrongPassword;
        });
        const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((a, b) => {
            return false;
        });

        const result = await userDAO.getIsUserAuthenticated(username, plainPassword);
        expect(result).toBe(false);

        mockDBGet.mockRestore();
        mockScryptSync.mockRestore();
        mockTimingSafeEqual.mockRestore();
    });

})

describe("GetUserByUsername DAO test", () => {

    const userDAO = new UserDAO()

    test("user non trovato", async ()=>{
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, undefined);
            return {} as any;
        });
    
        await expect(userDAO.getUserByUsername("user")).rejects.toThrow(new UserNotFoundError());
    
        mockDBGet.mockRestore();
    });
    test("errore database", async () => {
        const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as any
        });
        await expect(userDAO.getUserByUsername("user")).rejects.toThrow(Error);

        mockDBRun.mockRestore()
    })
    
    test("user restituito correttamente da GetUser", async ()=>{
        const user: User = new User("username", "name", "surname", Role.ADMIN, "address", "1998-02-04")
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, user);
            return {} as any;
        });
    
        await expect(userDAO.getUserByUsername("username")).resolves.toEqual(user);
    
        mockDBGet.mockRestore();
    });
})

describe("GetUsersByRole DAO test", () => {

    const userDAO = new UserDAO()
    const users: User[] = [new User("username", "name", "surname", Role.MANAGER, "address", "1998-02-04"), new User("username", "name", "surname", Role.MANAGER, "address", "1998-02-04")]

    test("Nessun user con specifico role", async ()=>{
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, undefined);
            return {} as any;
        });
    
        await expect(userDAO.getUsersByRole(Role.MANAGER)).rejects.toThrow(new UserNotFoundError());
    
        mockDBGet.mockRestore();
    });
    test("errore database", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as any
        });
        await expect(userDAO.getUsersByRole(Role.MANAGER)).rejects.toThrow(Error);
    
        mockDBRun.mockRestore()
    
    
    })
    test("restituisce array di user con specifico role", async ()=>{

        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, users);
            return {} as any;
        });
    
        await expect(userDAO.getUsersByRole(Role.MANAGER)).resolves.toEqual(users);
    
        mockDBGet.mockRestore();
    });
 
}) 



describe("deleteUser DAO test", () => {

    const userDAO = new UserDAO()
    const user: User = new User("username", "name", "surname", Role.ADMIN, "address", "1998-02-04")
    const username = "username"

    test("cancella l'user correttamente", async ()=>{
        const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:1}, null);
            return {} as any;
        });
    
        await expect(userDAO.deleteUser(user, username)).resolves.toEqual(true);
    
        mockDBGet.mockRestore();
    });
    
    test("utente non trovato", async ()=>{

        const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:0}, null);
            return {} as any;
        });
    
        await expect(userDAO.deleteUser(user, username)).rejects.toThrow(UserNotFoundError);
    
        mockDBGet.mockRestore();
    });

}) 






describe("deleteAll DAO test", () => {

    const userDAO = new UserDAO()
   

    test("cancella tutti gli user", async ()=>{
        const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:1}, null);
            return {} as any;
        });
    
        await expect(userDAO.deleteAll()).resolves.toEqual(true);
    
        mockDBGet.mockRestore();
    });
    
    test("non ci sono utenti", async ()=>{

        const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:0}, null);
            return {} as any;
        });
    
        await expect(userDAO.deleteAll()).rejects.toThrow(UserNotFoundError);
    
        mockDBGet.mockRestore();
    });
 

}) 




describe("updateUserInfo DAO test", () => {
    const userDAO = new UserDAO();

    test("aggiornamento informazioni utente con successo", async () => {
        const user = new User("username", "oldName", "oldSurname", Role.ADMIN, "oldAddress", "2000-01-01");

        const updatedUser = new User("username", "newName", "newSurname", Role.ADMIN, "newAddress", "2000-01-01");

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:1}, null); 
            return {} as any;
        });

         await expect(userDAO.updateUserInfo(user, "newName", "newSurname", "newAddress", "2000-01-01", "username")).resolves.toEqual(updatedUser);

        mockDBRun.mockRestore();
    });

    test("errore durante l'aggiornamento delle informazioni dell'utente", async () => {
        const user = new User("username", "oldName", "oldSurname",Role.ADMIN, "oldAddress", "2000-01-01");

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error")); 
            return {} as any;
        });

        await expect(userDAO.updateUserInfo(user, "newName", "newSurname", "newAddress", "2000-01-01", "username")).rejects.toThrow("Database error");

        mockDBRun.mockRestore();
    });

    test("Utente non trovato", async()=>{
        const user = new User("username", "oldName", "oldSurname", Role.ADMIN, "oldAddress", "2000-01-01");

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes:0}, null);
            return {} as any;
        });

        await expect(userDAO.updateUserInfo(user, "newName", "newSurname", "newAddress", "2000-01-01", "username")).rejects.toThrow(UserNotFoundError);

        mockDBRun.mockRestore();
    })
});
