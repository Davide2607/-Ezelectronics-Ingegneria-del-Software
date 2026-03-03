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


describe("Integration Test DAO Users", ()=>{

    let userDAO: UserDAO;
    let admin1:User;
    let admin2:User;
    let customer1:User;
    let customer2:User;
    let manager1:User;
    let manager2:User;
    let customer3:User;

    beforeAll(async () => {

        userDAO = new UserDAO()

        admin1 = new User("admin1", "admin1", "admin1", Role.ADMIN, "address", "2000-05-04")
        admin2 = new User("admin2", "admin2", "admin2", Role.ADMIN, "address", "2000-05-05")
        customer1 = new User("customer1", "customer1", "customer1", Role.CUSTOMER, "address", "2000-05-04")
        customer2 = new User("customer2", "customer2", "customer2", Role.CUSTOMER, "address", "2000-05-04")
       manager1 = new User("manager1", "manager1", "manager1", Role.MANAGER, "address", "2000-05-04")
       manager2 = new User("manager2", "manager2", "manager2", Role.MANAGER, "address", "2000-05-04")
       customer3 = new User("customer3", "customer1", "customer1", Role.CUSTOMER, "address", "2000-05-04")

       await create_tables();
        await cleanup();
        jest.spyOn(db, "get");
        jest.spyOn(db, "all");
        jest.spyOn(db, "run");

        db.serialize(() => {
        db.run(`
            INSERT INTO users (username, name, surname, role, password, salt, address, birthdate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, ?)
            `, 
            [
            admin1.username, admin1.name, admin1.surname, admin1.role, hashedPassword, salt, admin1.address, admin1.birthdate,
            admin2.username, admin2.name, admin2.surname, admin2.role, hashedPassword, salt, admin2.address, admin2.birthdate,
            manager1.username, manager1.name, manager1.surname, manager1.role, hashedPassword, salt, manager1.address, manager1.birthdate,
            manager2.username, manager2.name, manager2.surname, manager2.role, hashedPassword, salt, manager2.address, manager2.birthdate,
            customer1.username, customer1.name, customer1.surname, customer1.role, hashedPassword, salt, customer1.address, customer1.birthdate,
            customer2.username, customer2.name, customer2.surname, customer2.role, hashedPassword, salt, customer2.address, customer2.birthdate
            ]
        );

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

    describe('getIsUserAuthenticated', () => {
        test('should return true for valid credentials', async () => {
            await expect(userDAO.getIsUserAuthenticated(admin1.username,'password' )).resolves.toBe(true);
        });

        test('should return false for invalid credentials', async () => {
            const isAuthenticated = await userDAO.getIsUserAuthenticated('nonexistent', 'password');
            expect(isAuthenticated).toBeFalsy();
        });
        
    });
    describe("createUser", ()=>{
        
        test("Corretto Funzionamento", async ()=>{

            await userDAO.createUser(customer3.username, customer3.surname, customer3.surname, "password", customer3.role)  

            const user_Db = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM users WHERE username = ?", [admin2.username], (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    if (row) resolve(true);
                    else reject(err);
                });
            });

            expect(user_Db).toEqual(
                true
            )
            
        });

        test("Username già esistente", async () => {

            await expect(UserDAO.prototype.createUser(admin1.username, admin1.surname, admin1.surname, "password", admin1.role))
                .rejects
                .toThrow(new UserAlreadyExistsError());
        });

    });


    describe("GetUserByUsername", ()=>{
        
    test("corretto funzionamento", async () => { 


        await expect(UserDAO.prototype.getUserByUsername(admin1.username)).resolves
        .toEqual(admin1)

    })

    test("should throw UserNotFoundError if no users found", async () => {
        await expect(UserDAO.prototype.getUserByUsername('username')).rejects.
        toThrow(UserNotFoundError)
    });

  

    });
    
    describe("GetUsers", ()=>{
        
        test("corretto funzionamento", async () => { 
    
    
            await expect(UserDAO.prototype.getUsers()).resolves.not.toThrowError()
    
        })
    
    })


    describe("getUsersByRole", () => {
        
        test("should return all users with the specified role", async () => {
         
            await expect(UserDAO.prototype.getUsersByRole(admin2.role)).resolves.not
            .toThrow()
                });

        test("should throw UserNotFoundError if no users found with the specified role", async () => {
            await expect(UserDAO.prototype.getUsersByRole("role")).rejects.
            toThrow(UserNotFoundError)     
           });

    });

    describe("updateUserInfo", () => {
        
        test("Corretto Funzionamento", async ()=>{

            const updatedUser = new User("customer1", "customer1", "customer1", Role.CUSTOMER, "newAddress", "2000-01-01");
            await UserDAO.prototype.updateUserInfo(customer1, updatedUser.name,updatedUser.surname, updatedUser.address, updatedUser.birthdate, updatedUser.username )
            const user = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM users WHERE username = ?", [customer1.username], (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row);
                });
            });
          
            await expect(user).toEqual({
                    username: updatedUser.username, 
                    name: updatedUser.name, 
                    surname: updatedUser.surname, 
                    role: updatedUser.role, 
                    password: hashedPassword, 
                    salt: salt,  
                    address: updatedUser.address,
                    birthdate: updatedUser.birthdate
            })
 
    });

    test("should throw UserNotFoundError if the user does not exist", async () => {
        const updatedUser = new User("customer5", "customer5", "customer5", Role.CUSTOMER, "newAddress", "2000-01-01");
        await expect(UserDAO.prototype.updateUserInfo(updatedUser, updatedUser.name,updatedUser.surname, updatedUser.address, updatedUser.birthdate, updatedUser.username )).rejects.toThrow(UserNotFoundError)
      
});

})

    describe("deleteUser", () => {
       
        test("should delete the specified user", async () => {
               
            await UserDAO.prototype.deleteUser(admin1, customer3.username)
            await expect(UserDAO.prototype.getUserByUsername(customer3.username)).rejects.toThrow(UserNotFoundError)
               
       
        });

        test("should throw UserNotFoundError if the user does not exist", async () => {
                
            await expect(UserDAO.prototype.deleteUser(admin1, customer3.username)).rejects.toThrow(UserNotFoundError)
               


        });
    });

    describe("deleteAll", () => {
        test("should delete all non-Admin users", async () => {
            await userDAO.deleteAll()

            const users = await new Promise((resolve, reject) => {
                db.all("SELECT * FROM users WHERE role ='Customer' OR role='Manager' ", (err, rows) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(rows);
                });
            });

            expect(users).toEqual( []);

             });

        test("should throw UserNotFoundError if no non-Admin users found", async () => {           
            await expect(UserDAO.prototype.deleteAll()).rejects.
            toThrow(UserNotFoundError)   
                });
              
    });

    

    });


