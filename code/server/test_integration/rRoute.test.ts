import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
import { cleanup, create_tables } from "../src/db/cleanup"
import ProductController from "../src/controllers/productController"
import {User, Role} from "../src/components/user"
import { ProductReview } from "../src/components/review"
import ReviewDAO from "../src/dao/reviewDAO"
import {Product, Category} from "../src/components/product"
import dayjs from "dayjs"
import { NoReviewProductError } from "../src/errors/reviewError"
import ReviewController from "../src/controllers/reviewController"
import crypto from "crypto"

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

describe("Integration Test Routes Reviews", ()=>{

    let reviewController:ReviewController;

    let prodotto1:Product;
    let prodotto2:Product;
    let prodotto_no_recensione: Product

    let review1:ProductReview;
    let review2:ProductReview;

    let customerCookie: string
    let managerCookie: string
    let customerWriterCookie: string

    let customer:User;
    let manager:User;
    let customer_writer:User;

    beforeAll(async () => {
        
        reviewController = new ReviewController();

        prodotto1 = new Product(10, "model1", Category.SMARTPHONE, "2021-10-10", "details", 10)
        prodotto2 = new Product(10, "model2", Category.SMARTPHONE, "2021-10-10", "details", 10)
        prodotto_no_recensione = new Product(10, "model3", Category.SMARTPHONE, "2021-10-10", "details", 10)

        customer = new User("customer", "customer", "customer", Role.CUSTOMER, "address", "2000-05-04")
        manager = new User("manager", "manager", "manager", Role.MANAGER, "address", "2000-05-04")
        customer_writer = new User("username1", "name1", "surname1", Role.CUSTOMER, "address", "2000-05-04")
        
        review1 = new ProductReview(prodotto1.model, customer_writer.username, 5, "2021-10-10", "comment")
        review2 = new ProductReview(prodotto2.model, customer_writer.username, 3, "2021-10-10", "details")

        await create_tables();
        await cleanup();
        jest.spyOn(db, "get");
        jest.spyOn(db, "all");
        jest.spyOn(db, "run"); 

        
        db.serialize(async () => {
            db.run(`
            INSERT INTO products (model, sellingPrice, category, arrivalDate, details, quantity)
            VALUES (?, ?, ?, ?, ?, ?),
                   (?, ?, ?, ?, ?, ?)`,
            [prodotto1.model, prodotto1.sellingPrice, prodotto1.category, prodotto1.arrivalDate, prodotto1.details, prodotto1.quantity,
             prodotto2.model, prodotto2.sellingPrice, prodotto2.category, prodotto2.arrivalDate, prodotto2.details, prodotto2.quantity]);

             db.run(`
                INSERT INTO users (username, name, surname, password, role, salt)
                VALUES (?, ?, ?, ?, ?, ?),
                          (?, ?, ?, ?, ?, ?),
                          (?, ?, ?, ?, ?, ?)   
                       
            `, [
                customer_writer.username, customer_writer.name, customer_writer.surname, hashedPassword, customer_writer.role,salt,
                customer.username, customer.name, customer.surname, hashedPassword, customer.role, salt,
                manager.username, manager.name, manager.surname, hashedPassword, manager.role, salt
            ]);

            db.run(`
            INSERT INTO productReview (model, user, score, date, comment)
            VALUES (?, ?, ?, ?, ?),
                   (?, ?, ?, ?, ?)`,
            [review1.model, review1.user, review1.score, review1.date, review1.comment,
             review2.model, review2.user, review2.score, review2.date, review2.comment]);
        })


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

    describe ("POST /:model", ()=>{

        test("start session", async () => {
            const response = await request(app).post(`${routePath}/sessions`).send({username: "testUser", password: "password"}).expect(401);
        });

        test("Corretto Funzionamento", async()=>{
            customerCookie = await login(customer)
            await request(app)
                .post(`${routePath}/reviews/${prodotto2.model}`)
                .set('Cookie', customerCookie)
                .send({score: 5, comment: "comment"})
                .expect(200)
        })

        test("Errore del formato del model", async()=>{
            customerCookie = await login(customer)
            await request(app)
                .post(`${routePath}/reviews/${encodeURIComponent(" ")}`)
                .set('Cookie', customerCookie)
                .send({score: 5, comment: "comment"})
                .expect(400)
                .then((response) =>{
                    expect(response.body.error).toBe("Invalid format of the model")
                })
        })

        test("Prodotto non esistente", async()=>{
            customerCookie = await login(customer)
            await request(app)
                .post(`${routePath}/reviews/${"modello_non_esistente"}`)
                .set('Cookie', customerCookie)
                .send({score: 5, comment: "comment"})
                .expect(404)
                .then((response) =>{
                    expect(response.body.error).toBe("Product does not exist")
                })
        })

        test("L'utente ha già scritto una recensione",async()=>{
            customerWriterCookie = await login(customer_writer)
            return request(app)
                .post(`${routePath}/reviews/${prodotto1.model}`)
                .set('Cookie', customerWriterCookie)
                .send({score: 5, comment: "comment"})
                .expect(409)
                .then((response) =>{
                    expect(response.body.error).toBe("You have already reviewed this product")
                })
        })

    })

    describe("GET /:model", ()=>{
        test("Corretto Funzionamento", async()=>{
            customerWriterCookie = await login(customer_writer)

            await request(app)
                .get(`${routePath}/reviews/${prodotto1.model}`)
                .set('Cookie', customerWriterCookie)
                .expect(200)
                .then((response) =>{
                    expect(response.body).toEqual([review1])
                })
        })

        test("Modello non valido", async()=>{
            customerCookie = await login(customer)
            await request(app)
                .get(`${routePath}/reviews/${encodeURIComponent(" ")}`)
                .set('Cookie', customerCookie)
                .expect(400)
                .then((response) =>{
                    expect(response.body.error).toBe("Invalid format of the model")
                })
        })

        test("Prodotto non esistente", async()=>{
            customerCookie = await login(customer)
            await request(app)
                .get(`${routePath}/reviews/model_not_exist`)
                .set('Cookie', customerCookie)
                .expect(404)
                .then((response) =>{
                    expect(response.body.error).toBe("Product does not exist")
                })
        })
    })

    describe("DELETE /:model", ()=>{
        test("Corretto Funzionamento", async()=>{
            customerCookie = await login(customer)
            await request(app)
                .delete(`${routePath}/reviews/${prodotto2.model}`)
                .set('Cookie', customerCookie)
                .expect(200)
        })

        test("Modello non valido", async()=>{
            customerCookie = await login(customer)
            await request(app)
                .delete(`${routePath}/reviews/${encodeURIComponent(" ")}`)
                .set('Cookie', customerCookie)
                .expect(400)
                .then((response) =>{
                    expect(response.body.error).toBe("Invalid format of the model")
                })
        })

        test("Prodotto non esistente", async()=>{
            customerCookie = await login(customer)
            await request(app)
                .delete(`${routePath}/reviews/model_not_exist`)
                .set('Cookie', customerCookie)
                .expect(404)
                .then((response) =>{
                    expect(response.body.error).toBe("Product does not exist")
                })
        })

        test("Recensione non esistente", async()=>{
            customerCookie = await login(customer)
            await request(app)
                .delete(`${routePath}/reviews/${prodotto2.model}`)
                .set('Cookie', customerCookie)
                .expect(404)
                .then((response) =>{
                    expect(response.body.error).toBe("You have not reviewed this product")
                })
        })

    })


    describe("DELETE all/", ()=>{
        test("Corretto Funzionamento", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .delete(`${routePath}/reviews/${prodotto1.model}/all`)
                .set('Cookie', managerCookie)
                .expect(200)
        })

        test("Modello non valido", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .delete(`${routePath}/reviews/${encodeURIComponent(" ")}/all`)
                .set('Cookie', managerCookie)
                .expect(400)
                .then((response) =>{
                    expect(response.body.error).toBe("Invalid format of the model")
                })
        })

        test("Prodotto non esistente", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .delete(`${routePath}/reviews/model_not_exist/all`)
                .set('Cookie', managerCookie)
                .expect(404)
                .then((response) =>{
                    expect(response.body.error).toBe("Product does not exist")
                })
        })


    })

    describe("DELETE /", ()=>{
        
        test("Corretto Funzionamento", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .delete(`${routePath}/reviews/`)
                .set('Cookie', managerCookie)
                .expect(200)
        })

    })






})