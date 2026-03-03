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

const userToObject = (user: User) => {
    return { username: user.username, name: user.name, surname: user.surname, password: "password", role: user.role }
};

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userToObject(userInfo))
        .expect(200)
       
}

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userToObject(userInfo))
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

describe('User Routes Integration Tests', () => {
    const baseURL = "/ezelectronics"

    let userDAO: UserDAO;

    let admin1: User;
    let admin2: User;
    let customer1: User;
    let customer2: User;
    let manager1: User;
    let manager2: User;

    let admin1Cookie: string;
    let manager1Cookie: string;
    let customer1Cookie: string;

    const newUser = { username: "newuser", name: "New", surname: "User", password: "password", role: "Customer" }

    beforeAll(async () => {
        
        userDAO = new UserDAO();

        admin1 = new User("admin1", "admin1", "admin1", Role.ADMIN, "address", "2000-05-04");
        admin2 = new User("admin2", "admin2", "admin2", Role.ADMIN, "address", "2000-05-05");
        customer1 = new User("customer1", "customer1", "customer1", Role.CUSTOMER, "address", "2000-05-04");
        customer2 = new User("customer2", "customer2", "customer2", Role.CUSTOMER, "address", "2000-05-04");
        manager1 = new User("manager1", "manager1", "manager1", Role.MANAGER, "address", "2000-05-04");
        manager2 = new User("manager2", "manager2", "manager2", Role.MANAGER, "address", "2000-05-04");

        await create_tables();
        await cleanup();
        jest.spyOn(db, "get");
        jest.spyOn(db, "all");
        jest.spyOn(db, "run"); 


        db.serialize(() => {
            db.run(`
                INSERT INTO users (username, name, surname, password, role, salt)
                VALUES (?, ?, ?, ?, ?, ?),
                    (?, ?, ?, ?, ?, ?),
                        (?, ?, ?, ?, ?, ?),
                        (?, ?, ?, ?, ?, ?),
                        (?, ?, ?, ?, ?, ?),
                        (?, ?, ?, ?, ?, ?)
            `, [
                customer1.username, customer1.name, customer1.surname, hashedPassword, customer1.role,salt,
                manager1.username, manager1.name, manager1.surname, hashedPassword, manager1.role, salt,
                admin1.username, admin1.name, admin1.surname, hashedPassword, admin1.role, salt,
                admin2.username, admin2.name, admin2.surname, hashedPassword, admin2.role, salt,
                customer2.username, customer2.name, customer2.surname, hashedPassword, customer2.role, salt,
                manager2.username, manager2.name, manager2.surname, hashedPassword, manager2.role, salt
            ]);

    });
        
    });


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

    beforeEach(async () => {

        jest.clearAllMocks();
    });

    afterEach(async () => {

    });

    describe("POST /users", () => {
        test("start session", async () => {
            const response = await request(app).post(`${routePath}/sessions`).send({username: admin1.username, password: "password"}).expect(401);
        });
        test("Corretto Funzionamento", async () => {
            admin1Cookie = await login(admin1);
            await request(app)
                .post(baseURL + "/users")
                .set('Cookie', admin1Cookie)
                .send({ username: newUser.username, name: newUser.name, surname: newUser.surname, password: newUser.password, role: newUser.role })
                .expect(200);
        });

        test("Errore del formato del campo", async () => {
            admin1Cookie = await login(admin1);
            await request(app)
                .post(baseURL + "/users")
                .send({ username: "", name: "New", surname: "User", password: "password", role: "Customer" })
                .expect(422)
                .then((response) => {
                    expect(response.body.error ).toBe(("The parameters are not formatted properly\n\n- Parameter: **username** - Reason: *Invalid value* - Location: *body*\n\n"));
                });
        });

        test("Parametri non validi", async () => {
            admin1Cookie = await login(admin1);
            await request(app)
                .post(baseURL + "/users")
                .send({ username: "newuser", name: "New", surname: "User", password: "password", role: "InvalidRole" })
                .expect(422)
                .then((response) => {
                    expect(response.body.error).toBe("The parameters are not formatted properly\n\n- Parameter: **role** - Reason: *Invalid value* - Location: *body*\n\n");
                });
        });
    });

    describe("GET /users", () => {
        test("Corretto Funzionamento", async () => {
            admin1Cookie = await login(admin1);
            await request(app)
                .get(baseURL + "/users")
                .set('Cookie', admin1Cookie)
                .expect(200)
                .then((response) => {
                    expect(response.body.length).toBeGreaterThanOrEqual(1);
                });
        });

        test("Accesso non autorizzato", async () => {
            customer1Cookie = await login(customer1);
            await request(app)
                .get(baseURL + "/users")
                .set('Cookie', customer1Cookie)
                .expect(401)
                .then((response) => {
                    expect(response.body.error).toBe("User is not an admin");
                });
        });

    });

    describe("GET /users/:username", () => {
        test("Corretto Funzionamento", async () => {
            admin1Cookie = await login(admin1);
            await request(app)
                .get(baseURL + `/users/${customer1.username}`)
                .set('Cookie', admin1Cookie)
                .expect(200)
                .then((response) => {
                    expect(response.body.username).toBe(customer1.username);
                });
        });

        test("Utente non esistente", async () => {
            admin1Cookie = await login(admin1);
            await request(app)
                .get(baseURL + "/users/nonexistentuser")
                .set('Cookie', admin1Cookie)
                .expect(404)
                .then((response) => {
                    expect(response.body.error).toBe("The user does not exist");
                });
        });

        test("Accesso non autorizzato", async () => {
            customer1Cookie = await login(customer1);
            await request(app)
                .get(baseURL + `/users/${admin1.username}`)
                .set('Cookie', customer1Cookie)
                .expect(401)
                .then((response) => {
                    expect(response.body.error).toBe("UNAUTHORIZED_USER");
                });
        });

        
        test("Username parametro vuoto", async()=>{
            admin1Cookie = await login(admin1);
            await request(app)
                .get(baseURL + `/users/${encodeURIComponent(" ")}`)
                .set('Cookie', admin1Cookie)
                .expect(400)
                .then((response) => {
                    expect(response.body.error).toBe("Username cannot be empty");
                });
        
        })
    });

    describe("GET /users/roles/:role", () => {
        test("Corretto Funzionamento", async () => {
            admin1Cookie = await login(admin1);
            await request(app)
                .get(`${baseURL}/users/roles/${Role.MANAGER}`)
                .set('Cookie', admin1Cookie)
                .expect(200)
                .then((response) => {
                    expect(response.body.length).toBeGreaterThanOrEqual(1);
                });
        });
    
        test("Ruolo non valido", async () => {
            admin1Cookie = await login(admin1);
            const invalidRole = "InvalidRole";
            await request(app)
                .get(`${baseURL}/users/roles/${invalidRole}`)
                .set('Cookie', admin1Cookie)
                .expect(422)
                .then((response) => {
                    expect(response.body.error).toBe("UNAUTHORIZED_USER");
                });
        });
    
        test("Accesso non autorizzato", async () => {
            customer1Cookie = await login(customer1);
            const role = "Manager";
            await request(app)
                .get(`${baseURL}/users/roles/${role}`)
                .set('Cookie', customer1Cookie)
                .expect(401)
                .then((response) => {
                    expect(response.body.error).toBe("User is not an admin");
                });
        });
    });

    describe("PATCH /users/:username", () => {
        test("Corretto Funzionamento", async () => {
            customer1Cookie = await login(customer1);
            await request(app)
                .patch(baseURL + `/users/${customer1.username}`)
                .set('Cookie', customer1Cookie)
                .send({ name: "UpdatedName", surname: "UpdatedSurname", address: "New Address", birthdate: "2000-05-06" })
                .expect(200)
                .then((response) => {
                    customer1.name = "UpdatedName";
                    customer1.surname = "UpdatedSurname";
                    customer1.address = "New Address";
                    customer1.birthdate = "2000-05-06";
                    expect(response.body.name).toBe("UpdatedName");
                });

        });

        test("Accesso non autorizzato", async () => {
            customer1Cookie = await login(customer1);   
            await request(app)
                .patch(baseURL + `/users/${admin1.username}`)
                .set('Cookie', customer1Cookie)
                .send({ name: "UpdatedName", surname: "UpdatedSurname", address: "New Address", birthdate: "2000-05-06" })
                .expect(401)
                .then((response) => {
                    expect(response.body.error).toBe("UNAUTHORIZED_USER");
                });
        });

        test("Data di nascita non valida", async () => {
            customer1Cookie = await login(customer1);
            await request(app)
                .patch(baseURL + `/users/${customer1.username}`)
                .set('Cookie', customer1Cookie)
                .send({ name: "UpdatedName", surname: "UpdatedSurname", address: "New Address", birthdate: "3000-05-06" })
                .expect(400)
                .then((response) => {
                    expect(response.body.error).toBe("Invalid or future birthdate");
                });
        });

        test("Utente non inserito", async () => {
            admin1Cookie = await login(admin1);
            await request(app)
                .patch(baseURL + `/users/${encodeURIComponent(" ")}`)
                .set('Cookie', admin1Cookie)
                .send({ name: "UpdatedName", surname: "UpdatedSurname", address: "New Address", birthdate: "2000-05-06" })
                .expect(400)
                .then((response) => {
                    expect(response.body.error).toBe("Username cannot be empty");
                });
        });

        test("L'admin non può editare altri admin", async()=>{
            admin1Cookie = await login(admin1);
            await request(app)
                .patch(baseURL + `/users/${admin2.username}`)
                .set('Cookie', admin1Cookie)
                .send({ name: "UpdatedName", surname: "UpdatedSurname", address: "New Address", birthdate: "2000-05-06" })
                .expect(401)
                .then((response) => {
                    expect(response.body.error).toBe("Admins cannot edit other admins");
                });
        })

        test("L'admin edita un customer", async()=>{
            admin1Cookie = await login(admin1);
            await request(app)
                .patch(baseURL + `/users/${customer2.username}`)
                .set('Cookie', admin1Cookie)
                .send({ name: "UpdatedName22", surname: "UpdatedSurname", address: "New Address", birthdate: "2000-05-06" })
                .expect(200)
                .then((response) => {
                    customer2.name = "UpdatedName22";
                    customer2.surname = "UpdatedSurname";
                    customer2.address = "New Address";
                    customer2.birthdate = "2000-05-06";
                    expect(response.body.name).toBe("UpdatedName22");
                });
        
        })
    });

    describe("DELETE /users/:username", () => {
        test("Corretto Funzionamento", async () => {
            admin1Cookie = await login(admin1);
            await request(app)
                .delete(baseURL + `/users/${customer2.username}`)
                .set('Cookie', admin1Cookie)
                .expect(200);
        });

        test("Accesso non autorizzato", async () => {
            customer1Cookie = await login(customer1);
            await request(app)
                .delete(baseURL + `/users/${admin1.username}`)
                .set('Cookie', customer1Cookie)
                .expect(401)
                .then((response) => {
                    expect(response.body.error).toBe("UNAUTHORIZED_USER");
                });
        });

        test("Eliminazione di un altro Admin", async () => {
            admin1Cookie = await login(admin1);
            await request(app)
                .delete(baseURL + `/users/${admin2.username}`)
                .set('Cookie', admin1Cookie)
                .expect(401)
                .then((response) => {
                    expect(response.body.error).toBe("Admins cannot delete other admins");
                });
        });

        test("Utente non inserito", async () => {
            admin1Cookie = await login(admin1);
            await request(app)
                .delete(baseURL + `/users/${encodeURIComponent(" ")}` )
                .set('Cookie', admin1Cookie)
                .expect(400)
                .then((response) => {
                    expect(response.body.error).toBe("Username cannot be empty");
                });
        });
    });

    describe("DELETE /users", () => {
        test("Corretto Funzionamento", async () => {
            admin1Cookie = await login(admin1);
            await request(app)
                .delete(baseURL + "/users")
                .set('Cookie', admin1Cookie)
                .expect(200);
        });

    })

    
    describe("POST /session", ()=>{
        test("Corretto Funzionamento", async () => {
            await request(app)
                .post(`${baseURL}/sessions`)
                .send({ username: admin1.username, password: "password" })
                .expect(200)
        });

    })

    describe("GET /sessions/current", () => {
        test("It should return a 200 success code if the user is logged in", async () => {
            admin1Cookie = await login(admin1);
           await request(app)
           .get(baseURL + "/sessions/current")
           .set('Cookie', admin1Cookie)
           .expect(200)
        })

        test("It should return a 401 error code if the user is not logged in", async () => {
            await request(app)
           .get(baseURL + "/sessions/current")
           .expect(401)
        })
    })
    
    describe("DELETE /sessions/", () => {
        test("Successful logout", async () => {
            admin1Cookie = await login(admin1);
            await request(app)
                .delete(`${baseURL}/sessions/current`)
                .set('Cookie', admin1Cookie)
                .expect(200)
        });

        test("Logout without being logged in", async () => {
            await request(app)
                .delete(`${baseURL}/sessions/current`)
                .expect(401)
        });

        test("Logout invalidates session", async () => {
            admin1Cookie = await login(admin1);

            await request(app)
                .delete(`${baseURL}/sessions/current`)
                .set('Cookie', admin1Cookie)
                .expect(200)
                
            await request(app)
                .get(`${baseURL}/users`)
                .set('Cookie', admin1Cookie)
                .expect(401)
        });
    });
    

    

});






