import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
import { cleanup, create_tables } from "../src/db/cleanup"
import CartController from "../src/controllers/cartController"
import CartDAO from "../src/dao/cartDAO"
import ProductDAO from "../src/dao/productDAO";
import { Cart, ProductInCart } from "../src/components/cart"
import { User, Role} from "../src/components/user"
import {Product, Category} from "../src/components/product"
import * as cartErrors from "../src/errors/cartError"
import { ProductNotFoundError } from "../src/errors/productError";
import { rejects } from "assert"
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

describe("Integration Test Route Carts", ()=>{

    let cartController:CartController;
    let cart1:Cart;
    let cart2:Cart;
    let cart3:Cart;
    let cart4:Cart;
    let cart5:Cart;
    let cart6:Cart;

    let customer1:User;
    let customer2:User;
    let customer3:User;
    let customer4:User;
    let customer5:User;
    let manager:User;
    

    let prodottoCart1:ProductInCart;
    let prodottoCart2:ProductInCart;
    let prodottoCart3:ProductInCart;  //usato per simulare prodotto che pero non è stato inserito nel db
    let prodottoCart4:ProductInCart; 
    let prodotto_Cart_gia_esistente:ProductInCart;

    let product1:Product;
    let product2:Product;
    let product3:Product;

    let customer1Cookie: string
    let customer2Cookie: string
    let customer3Cookie: string
    let customer4Cookie: string
    let customer5Cookie: string

    let managerCookie: string

   
    

    interface CartInterface {
        idCart: number;
        customer: string;
        paid: boolean;
        paymentDate: Date;
        total: number;
    }
 
    beforeAll(async () => {


        cartController = new CartController()
        product1= new Product(10, "modelSmartphone", Category.SMARTPHONE, "2021-10-10", "details", 100);
        product2= new Product(10, "modelLaptotp1", Category.LAPTOP, "2021-10-10", "details", 3);
        product3= new Product(10, "modelLaptotp2", Category.LAPTOP, "2021-10-10", "details", 0);
        
        customer1 = new User("testUser", "customer", "customer", Role.CUSTOMER, "Via Rossi 123", "2004-04-21");
        customer2 = new User("testUser2", "customer2", "customer2", Role.CUSTOMER, "Via Bianchi 123", "2014-04-21");
        customer3 = new User("testUser3", "customer3", "customer3", Role.CUSTOMER, "Via Bianchi 123", "2014-04-21");
        customer4 = new User("testUser4", "customer4", "customer4", Role.CUSTOMER, "Via Bianchi 123", "2014-04-21");
        customer5 = new User("testUser5", "customer5", "customer5", Role.CUSTOMER, "Via Bianchi 123", "2014-04-21");
        manager = new User("manager", "manager", "manager", Role.MANAGER, "Via Bianchi 123", "2014-04-21");

        prodottoCart1 = new ProductInCart(product1.model, 1, product1.category, product1.sellingPrice)
        prodottoCart2=  new ProductInCart(product2.model,2, product2.category, product2.sellingPrice)
        prodottoCart3=  new ProductInCart(product3.model,1, product3.category, product3.sellingPrice)
        prodottoCart4=  new ProductInCart(product1.model,2, product1.category, product1.sellingPrice)

        cart1 = new Cart(customer1.username, true, '2024-05-29', 10, [prodottoCart1]);
        cart2 = new Cart(customer2.username, true, "2024-04-21", 10, [prodottoCart2]);
        cart3 = new Cart(customer3.username, false, ' ', 10, [prodottoCart3]);  // simula cart non pagato per utente3 
        cart4 = new Cart(customer4.username,false, ' ' ,0, []) // Cart senza prodotti 
        cart5= new Cart(customer1.username, false, ' ', 10, []); //usato per il checkout del cart user1
        cart6 = new Cart(customer5.username, false, ' ', 10, [prodottoCart2]); //usato per il checkout del cart user1

        await create_tables();
        await cleanup();

        jest.spyOn(db, "get");
        jest.spyOn(db, "all");
        jest.spyOn(db, "run");     


        db.serialize(async () => {

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
                customer2.username, customer2.name, customer2.surname, hashedPassword, customer2.role, salt,
                customer3.username, customer3.name, customer3.surname, hashedPassword, customer3.role, salt,
                customer4.username, customer4.name, customer4.surname, hashedPassword, customer4.role, salt,
                customer5.username, customer5.name, customer5.surname, hashedPassword, customer5.role, salt,
                manager.username, manager.name, manager.surname, hashedPassword, manager.role, salt
            ]);


            db.run(`
                INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity)
                VALUES (?, ?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?, ?)
            `, [
                product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity,
                product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity,
                product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity
            ]);

            db.run(`
                INSERT INTO carts (idCart, customer, paid, paymentDate, total)
                VALUES (?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?),
                        (?, ?, ?, ?, ?)
            `, [
                1, customer1.username, cart1.paid, cart1.paymentDate, cart1.total,
                2, customer2.username, cart2.paid, cart2.paymentDate, cart2.total,
                3, customer3.username, cart3.paid, cart3.paymentDate, cart3.total,
                4, customer4.username, cart4.paid, cart4.paymentDate, cart4.total,
                5, customer1.username, cart5.paid, cart5.paymentDate, cart5.total,
                6, customer5.username, cart6.paid, cart6.paymentDate, cart6.total
            ]);

            db.run(`
                INSERT INTO cartProducts (idCart, product, cartQuantity)
                VALUES (?, ?, ?),
                       (?, ?, ?),
                       (?, ?, ?),
                       (?, ?, ?),
                        (?, ?, ?)
            `, [
                1, prodottoCart1.model, 1,
                2, prodottoCart2.model, 2,
                3, prodottoCart3.model, 2,
                5, prodottoCart2.model, 1,
                6, prodottoCart2.model, 5
            ]);
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

    describe("GET /carts", () => {
        test("start session", async () => {
            const response = await request(app).post(`${routePath}/sessions`).send({username: "testUser", password: "password"}).expect(401);
        });
        test("Correct functionality", async () => {
            customer1Cookie = await login(customer1)
            await request(app)
            .get(`${routePath}/carts`)
            .set('Cookie',customer1Cookie)
            .expect(200);

        });

    })

    describe("POST /carts", () => {
        test("Correct functionality", async () => {
            customer1Cookie = await login(customer1)
            await request(app)
            .post(`${routePath}/carts`)
            .send({model: prodottoCart1.model })
            .set('Cookie', customer1Cookie)
            .expect(200);
        });
       
        test("Modello vuoto", async()=>{
            customer1Cookie = await login(customer1)
            await request(app)
            .post(routePath +"/carts").send({model: " "}).set('Cookie', customer1Cookie)
            .expect(422)
            .then((response) => {
                expect(response.body).toEqual({error: "Model cannot be empty"})
            })

        })

        test("Modello non esistente", async()=>{
            customer1Cookie = await login(customer1)
            await request(app).post(routePath +"/carts").send({model: "modelloInesistente"}).set('Cookie', customer1Cookie).expect(404)
            .then((response) => {
                expect(response.body).toEqual({error: "Model not exists"})
            })
                        
        })

        test("Quantità insufficiente", async()=>{
            customer1Cookie = await login(customer1)
            await request(app).post(routePath +"/carts").send({model: prodottoCart3.model}).set('Cookie', customer1Cookie).expect(409)
            .then((response) => {
                expect(response.body).toEqual({error: "Insufficient quantity"})
            })
        })
    })

    describe("Patch /carts", () => {
        test("Correct functionality", async()=>{
            customer1Cookie = await login(customer1)
            const response = await request(app).patch(routePath +"/carts").set('Cookie', customer1Cookie);
            expect(response.status).toBe(200);
        })

        test("Carrello non esistente", async()=>{
            customer2Cookie = await login(customer2)
            await request(app).patch(routePath +"/carts").set('Cookie',customer2Cookie).expect(404)
            .then((response) => {
                expect(response.body).toEqual({error: "Cart not found"})
            })
        })


            test("Carrello vuoto", async () => {
                customer4Cookie = await login(customer4)
                await request(app)
                    .patch(routePath+'/carts')
                    .set('Cookie', customer4Cookie)
                    .expect(400)
                    .then((response) => {
                        expect(response.body).toEqual({ error: "Cart is empty" });
                    });
            });

        

        test("Prodotto nel negozio con quantità uguale a 0", async()=>{
            customer3Cookie = await login(customer3)
            await request(app).patch(routePath +"/carts").set('Cookie',customer3Cookie).expect(409)
            .then((response) => {
                expect(response.body).toEqual({error: "Insufficient quantity"})
            })
        })

        test("Prodotto nel negozio in quantità inferiore a quella nel carrello", async()=>{
            customer5Cookie = await login(customer5)
            await request(app).patch(routePath +"/carts").set('Cookie', customer5Cookie).expect(409)
            .then((response) => {
                expect(response.body).toEqual({error: "Not enough products"})
            })
        })
    })

    describe("GET history", ()=>{
        test("Correct functionality", async()=>{
            customer1Cookie = await login(customer1)
            const response = await request(app).get(routePath +"/carts/history").set('Cookie', customer1Cookie);
     
            expect(response.status).toBe(200);
        })
    
    })

    describe("DELETE /carts/:model", () => {
        test("Correct functionality", async () => {
            customer5Cookie = await login(customer5)
            const response = await request(app).delete(routePath +`/carts/products/${prodottoCart2.model}`).set('Cookie', customer5Cookie);
            expect(response.status).toBe(200);
        });

        test("Modello non esistente", async()=>{
            customer3Cookie = await login(customer3)
            await request(app).delete(routePath +`/carts/products/${encodeURIComponent("modelloInesistente")}`).set('Cookie',customer3Cookie).expect(404)
            .then((response) => {
                expect(response.body).toEqual({error: "Model not exists"})
            })
        })

        test("Modello vuoto", async()=>{
            customer1Cookie = await login(customer1)
            await request(app).delete(routePath +`/carts/products/${encodeURIComponent(" ")}`).set('Cookie', customer1Cookie).expect(400)
            .then((response) => {
                expect(response.body).toEqual({error: "Model cannot be empty"})
            })
        })

        test("Carrello vuoto o non esistente", async()=>{
            customer4Cookie = await login(customer4)
            await request(app).delete(routePath +`/carts/products/${prodottoCart2.model}`).set('Cookie', customer4Cookie).expect(404)
            .then((response) => {
                expect(response.body).toEqual({error: "Cart is empty"})
            })
        })

        test("Prodotto non presente nel carrello", async()=>{
            customer5Cookie = await login(customer5)
            await request(app).delete(routePath +`/carts/products/${prodottoCart1.model}`).set('Cookie', customer5Cookie).expect(404)
            .then((response) => {
                expect(response.body).toEqual({error: "Product not in cart"})
            })
        })

    })

    describe("DELETE /current", ()=>{
        test("Correct functionality", async()=>{
            customer5Cookie = await login(customer5)
            const response = await request(app).delete(routePath +"/carts/current").set('Cookie', customer5Cookie);
            expect(response.status).toBe(200);
        })

        test("Carrello vuoto o non esistente", async()=>{
            customer4Cookie = await login(customer4)
            await request(app).delete(routePath +"/carts/current").set('Cookie', customer4Cookie).expect(404)
            .then((response) => {
                expect(response.body).toEqual({error: new cartErrors.CartNotFoundError().customMessage})
            })
        })

    })

    describe("Get all carts", ()=>{
        test("Correct functionality", async()=>{
            managerCookie = await login(manager)
            const response = await request(app).get(routePath +"/carts/all").set('Cookie', managerCookie);
            expect(response.status).toBe(200);
        })

    })

    describe("Delete all carts", ()=>{
        test("Correct functionality", async()=>{
            managerCookie = await login(manager)
            const response = await request(app).delete(routePath +"/carts").set('Cookie', managerCookie);
            expect(response.status).toBe(200);
        })


    })

    
})

    