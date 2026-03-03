import { jest, describe, test, expect, beforeAll, beforeEach, afterAll , afterEach} from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
import { cleanup, create_tables } from "../src/db/cleanup"
import UserController from "../src/controllers/userController"
import {User, Role} from "../src/components/user"
import crypto from "crypto"
import  {scryptSync}  from "crypto"
import { randomBytes } from "crypto"
import {UserAlreadyExistsError, UserNotFoundError} from "../src/errors/userError"
import UserDAO from "../src/dao/userDAO"

const routePath = "/ezelectronics"

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

const salt = crypto.randomBytes(16).toString('hex');
const hashedPassword = crypto.scryptSync('password', salt, 16).toString('hex');

describe("Integration Test Controller Users", ()=>{
    let userDAO: UserDAO;
    let userController: UserController;

    let admin1:User;
    let admin2:User;
    let customer1:User;
    let customer2:User;
    let manager1:User;
    let manager2:User;

    beforeAll(async () => {


        userDAO = new UserDAO()
        userController = new UserController()


        admin1 = new User("admin1", "admin1", "admin1", Role.ADMIN, "address", "2000-05-04")
        admin2 = new User("admin2", "admin2", "admin2", Role.ADMIN, "address", "2000-05-05")
        customer1 = new User("customer1", "customer1", "customer1", Role.CUSTOMER, "address", "2000-05-04")
        customer2 = new User("customer2", "customer2", "customer2", Role.CUSTOMER, "address", "2000-05-04")
       manager1 = new User("manager1", "manager1", "manager1", Role.MANAGER, "address", "2000-05-04")
       manager2 = new User("manager2", "manager2", "manager2", Role.MANAGER, "address", "2000-05-04")
  
       await create_tables();
       await cleanup();
       jest.spyOn(db, "get");
       jest.spyOn(db, "all");
       jest.spyOn(db, "run");

       db.serialize(()=>{
        db.run(`
            INSERT INTO users (username, name, surname, password, role, salt)
            VALUES (?, ?, ?, ?, ?, ?),
                (?, ?, ?, ?, ?, ?),
                (?, ?, ?, ?, ?, ?)
        `, [
            admin1.username, admin1.name, admin1.surname, hashedPassword, admin1.role , salt,
            customer1.username, customer1.name, customer1.surname, hashedPassword, customer1.role,salt,
            customer2.username, customer2.name, customer2.surname, hashedPassword, customer2.role, salt
        ]);

    });


    })


    afterAll(async()=>{
        await cleanup();
        await new Promise((resolve, reject) => {
            db.close((err) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                } else {
                    resolve(null);
                }
            });
        });
    })

    beforeEach(async()=>{
  
        
        jest.clearAllMocks();
    })
    
    afterEach(async ()=>{
    })
    
    describe("createUser controller test", () => {
        test("Creazione utente corretta", async () => {
            await userController.createUser(admin2.username, admin2.name, admin2.surname,  "password", admin2.role)
            const user = await userDAO.getUserByUsername(admin2.username)
            expect(user.username).toEqual(admin2.username);
            expect(user.name).toEqual(admin2.name);
            expect(user.surname).toEqual(admin2.surname);
        
        });
            

})

    describe("getUsers", () => {
        test("Recupero utenti corretto", async () => {
            const admin1_new = new User("admin1", "admin1", "admin1", Role.ADMIN, null as any, null as any)
            const customer1_new = new User("customer1", "customer1", "customer1", Role.CUSTOMER,  null as any, null as any)
            const customer2_new = new User("customer2", "customer2", "customer2", Role.CUSTOMER,  null as any, null as any)
            const admin2_new = new User("admin2", "admin2", "admin2", Role.ADMIN,  null as any, null as any)

            const users:User[] = await userController.getUsers()

            expect(users).toEqual([admin1_new, customer1_new, customer2_new, admin2_new]);
        });
       
    });

    describe("getUsersByRole", () => {
        test("Recupero utenti per ruolo corretto", async () => {
            const customer1_new = new User("customer1", "customer1", "customer1", Role.CUSTOMER, null as any, null as any)
            const customer2_new = new User("customer2", "customer2", "customer2", Role.CUSTOMER,  null as any, null as any)
            const users = await userController.getUsersByRole(Role.CUSTOMER)
            expect(users).toEqual([customer1_new, customer2_new]);
        })

        test("Utenti non trovati", async () => {
            await expect(userController.getUsersByRole(Role.MANAGER)).rejects.toThrow(new UserNotFoundError());

       
    });

})




   describe("getUserByUsername", () => {
        test("Recupero utente per username corretto", async () => {
            const customer1_new = new User("customer1", "customer1", "customer1", Role.CUSTOMER, null as any, null as any)
            await expect(userController.getUserByUsername(admin1, customer1.username)).resolves.toEqual(customer1_new);
         
        });
        test("User Non trovato", async () => {
            await expect(userController.getUserByUsername(admin1, "Utente_non_esistente")).rejects.toThrow(new UserNotFoundError());
        });


    });

    describe("updateUserInfo", () => {
       
        test("Aggiornamento informazioni utente corretto", async () => {
            const new_admin = new User(admin1.username, "admin1", "admin1", Role.ADMIN, "newAddress", "2000-01-01");
            const user = await userController.updateUserInfo(admin1,new_admin.name, new_admin.surname, new_admin.address, new_admin.birthdate, new_admin.username)
            admin1.name = new_admin.name;
            admin1.surname = new_admin.surname;
            admin1.address = new_admin.address;
            admin1.birthdate = new_admin.birthdate;
            expect(user).toEqual(new_admin);
        });

        test("user non trovato per l'update", async () => {
            const new_customer = new User("username_not_found", "name", "surname", Role.CUSTOMER, "address", "2000-01-01");
            await expect(userController.updateUserInfo(new_customer, customer1.username, customer1.name, customer1.surname, customer1.address, new_customer.username)).rejects.toThrow(UserNotFoundError);
        });
    

});


    describe("deleteUser", () => {
        
        test("Eliminazione utente corretta", async () => {
                 const deletea = await userController.deleteUser(admin1 ,customer1.username)
             

            await expect(userController.getUserByUsername(admin1, customer1.username)).rejects.toThrow(new UserNotFoundError());
        }); 
        

        test("Utente non trovato per la cancellazione", async () => {
            await expect(userController.deleteUser(admin1 ,customer1.username)).rejects.toThrow(UserNotFoundError);

        });
    });


    describe("deleteAll", () => {
        test("Eliminazione di tutti gli utenti corretta", async () => {
         await userController.deleteAll()
        await  expect(userDAO.getUsersByRole(Role.MANAGER)).rejects.toThrow(UserNotFoundError)
         await expect(userDAO.getUsersByRole(Role.CUSTOMER)).rejects.toThrow(UserNotFoundError)

        });

    });

 


})

