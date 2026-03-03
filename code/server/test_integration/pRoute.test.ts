import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
import { cleanup, create_tables} from "../src/db/cleanup"
import ProductController from "../src/controllers/productController"
import {User, Role} from "../src/components/user"
import crypto from "crypto"
import  ProductDAO from "../src/dao/productDAO"
import {Product, Category} from "../src/components/product"
import { EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError} from "../src/errors/productError"


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

describe("Integration Test Route Products", ()=>{

    let productDao:ProductDAO;
    let productController: ProductController;
    let prodotto1:Product;
    let prodotto2:Product;
    let prodotto_modello_non_esiste:Product;
    let prodotto_quantità_esaurita:Product;
    let prodotto_laptop1:Product;
    let prodotto_laptop2:Product;
    let prodotto_applicance1:Product;

    let customer:User;
    let manager:User;

    let customerCookie: string
    let managerCookie: string
 


    beforeAll(async () => {
        
        productDao = new ProductDAO()
        productController = new ProductController()
        customer = new User("customer", "customer", "customer", Role.CUSTOMER, "address", "2000-05-04")
        manager = new User("manager", "manager", "manager", Role.MANAGER, "address", "2000-05-04")

        prodotto1 = new Product(10, "model1", Category.SMARTPHONE, "2021-10-10", "details", 10)
        prodotto2 = new Product(10, "model2", Category.SMARTPHONE, "2021-10-10", "details", 10)
        prodotto_modello_non_esiste = new Product(10, "modelloNonEsiste", Category.SMARTPHONE, "2021-10-10", "details", 10)
        prodotto_quantità_esaurita = new Product(10, "modelQE", Category.SMARTPHONE, "2021-10-10", "details", 0)
        prodotto_laptop1 = new Product(10, "modelLaptop1", Category.LAPTOP, "2021-10-10", "details", 10)
        prodotto_laptop2 = new Product(10, "modelLaptop2", Category.LAPTOP, "2021-10-10", "details", 10)
        prodotto_applicance1 = new Product(10, "modelAppliance1", Category.APPLIANCE, "2021-10-10", "details", 10)

        await create_tables();
        await cleanup();

        jest.spyOn(db, "get");
        jest.spyOn(db, "all");
        jest.spyOn(db, "run"); 


        db.serialize(()=>{

            db.run(`
                INSERT INTO users (username, name, surname, password, role, salt)
                VALUES (?, ?, ?, ?, ?, ?),
                       (?, ?, ?, ?, ?, ?)
            `, [
                customer.username, customer.name, customer.surname, hashedPassword, customer.role,salt,
                manager.username, manager.name, manager.surname, hashedPassword, manager.role, salt
            ]);

            db.run(`
                INSERT INTO products (model, category, quantity, details, sellingPrice, arrivalDate)
                VALUES (?, ?, ?, ?, ?, ?),
                    (?, ?, ?, ?, ?, ?),
                    (?, ?, ?, ?, ?, ?),
                    (?, ?, ?, ?, ?, ?),
                    (?, ?, ?, ?, ?, ?)
            `, [
                prodotto1.model, prodotto1.category, prodotto1.quantity, prodotto1.details, prodotto1.sellingPrice, prodotto1.arrivalDate,
                prodotto_quantità_esaurita.model, prodotto_quantità_esaurita.category, prodotto_quantità_esaurita.quantity, prodotto_quantità_esaurita.details, prodotto_quantità_esaurita.sellingPrice, prodotto_quantità_esaurita.arrivalDate,
                prodotto_laptop1.model, prodotto_laptop1.category, prodotto_laptop1.quantity, prodotto_laptop1.details, prodotto_laptop1.sellingPrice, prodotto_laptop1.arrivalDate,
                prodotto_laptop2.model, prodotto_laptop2.category, prodotto_laptop2.quantity, prodotto_laptop2.details, prodotto_laptop2.sellingPrice, prodotto_laptop2.arrivalDate,
                prodotto_applicance1.model, prodotto_applicance1.category, prodotto_applicance1.quantity, prodotto_applicance1.details, prodotto_applicance1.sellingPrice, prodotto_applicance1.arrivalDate
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

    describe("Register a product", ()=>{

        test("start session", async () => {
            const response = await request(app).post(`${routePath}/sessions`).send({username: "testUser", password: "password"}).expect(401);
        });

        test("Corretto Funzionamento", async ()=>{
            managerCookie = await login(manager)
            const product2 = {model: prodotto2.model, category: prodotto2.category, quantity: prodotto2.quantity, details: prodotto2.details, sellingPrice: prodotto2.sellingPrice, arrivalDate: prodotto2.arrivalDate}
            await request(app)
                .post(`${routePath}/products/`)
                .send(product2)
                .set('Cookie', managerCookie)
                .expect(200)

            const products = await productController.getProducts("model", null, prodotto2.model)
            expect(products).toHaveLength(1);
            expect(products[0].model).toEqual(prodotto2.model);
            expect(products[0].category).toEqual(prodotto2.category);
            expect(products[0].quantity).toEqual(prodotto2.quantity);
            expect(products[0].details).toEqual(prodotto2.details);
            expect(products[0].sellingPrice).toEqual(prodotto2.sellingPrice);
            expect(products[0].arrivalDate).toEqual(prodotto2.arrivalDate);
        })

        test("Modello non indicato", async ()=>{
            managerCookie = await login(manager)
            const product2 = {model: " ", category: prodotto2.category, quantity: prodotto2.quantity, details: prodotto2.details, sellingPrice: prodotto2.sellingPrice, arrivalDate: prodotto2.arrivalDate}
            await request(app)
                .post(`${routePath}/products/`)
                .send(product2)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Model cannot be empty"})
                })
        })

        test("Quantità insufficiente", async()=>{
            managerCookie = await login(manager)
            const product2 = {model: prodotto2.model, category: prodotto2.category, quantity: -1, details: prodotto2.details, sellingPrice: prodotto2.sellingPrice, arrivalDate: prodotto2.arrivalDate}
            await request(app)
                .post(`${routePath}/products/`)
                .send(product2)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Insufficient quantity"})
                })
        })

        test("Prezzo di vendità insufficiente", async()=>{
            managerCookie = await login(manager)
            const product2 = {model: prodotto2.model, category: prodotto2.category, quantity: prodotto2.quantity, details: prodotto2.details, sellingPrice: -1, arrivalDate: prodotto2.arrivalDate}
            await request(app)
                .post(`${routePath}/products/`)
                .send(product2)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Insufficient selling Price"})
                })
        })

        test("Categoria non valida", async()=>{
            managerCookie = await login(manager)
            const product2 = {model: prodotto2.model, category: "invalid", quantity: prodotto2.quantity, details: prodotto2.details, sellingPrice: prodotto2.sellingPrice, arrivalDate: prodotto2.arrivalDate}
            await request(app)
                .post(`${routePath}/products/`)
                .send(product2)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "invalid category"})
                })
        })

        test("Data di arrivo successiva alla data attuale", async()=>{
            managerCookie = await login(manager)
            const product2 = {model: prodotto2.model, category: prodotto2.category, quantity: prodotto2.quantity, details: prodotto2.details, sellingPrice: prodotto2.sellingPrice, arrivalDate: "2028-10-10"}
            await request(app)
                .post(`${routePath}/products/`)
                .send(product2)
                .set('Cookie', managerCookie)
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({error: "arrival date cannot be after today"})
                })
        })

        test("Modello già esistente", async ()=>{
            managerCookie = await login(manager)
            const product1 = {model: prodotto1.model, category: prodotto1.category, quantity: prodotto1.quantity, details: prodotto1.details, sellingPrice: prodotto1.sellingPrice, arrivalDate: prodotto1.arrivalDate}
            await request(app)
                .post(`${routePath}/products/`)
                .send(product1)
                .set('Cookie', managerCookie)
                .expect(409)
                .then((response) => {
                    expect(response.body).toEqual({error: "Product Already Exists"})
                })
        })

    })

    describe("Change Product Quantity", ()=>{

        test("Corretto Funzionamento", async ()=>{
            managerCookie = await login(manager)
            const newQuantity = 10
            await request(app)
                .patch(`${routePath}/products/${prodotto1.model}`)
                .send({quantity: newQuantity, changeDate: "2021-10-10"})
                .set('Cookie', managerCookie)
                .expect(200)

            prodotto1.quantity += newQuantity
            const products = await productDao.getProducts("model", null, prodotto1.model)
            expect(products).toHaveLength(1);
            expect(products[0].model).toEqual(prodotto1.model);
            expect(products[0].category).toEqual(prodotto1.category);
            expect(products[0].quantity).toEqual(prodotto1.quantity);
            expect(products[0].details).toEqual(prodotto1.details);
            expect(products[0].sellingPrice).toEqual(prodotto1.sellingPrice);
            expect(products[0].arrivalDate).toEqual(prodotto1.arrivalDate);
        })

        test("Modello non esistente", async ()=>{
            managerCookie = await login(manager)
            await request(app)
                .patch(`${routePath}/products/${prodotto_modello_non_esiste.model}`)
                .send({quantity: 10, changeDate: "2021-10-10"})
                .set('Cookie', managerCookie)
                .expect(404)
                .then((response) => {
                    expect(response.body).toEqual({error: "Product not found", status: 404})
                })
        })

        test("Data di update non valida", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .patch(`${routePath}/products/${prodotto1.model}`)
                .send({quantity: 10, changeDate: "data"})
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Invalid Date"})
                })
        })

        test("Data di update successiva alla data attuale", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .patch(`${routePath}/products/${prodotto1.model}`)
                .send({quantity: 10, changeDate: "20280-10-10"})
                .set('Cookie', managerCookie)
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({error: "change date cannot be after today"})
                })
        })

        test("Data di cambiamento precedente alla data di arrivo", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .patch(`${routePath}/products/${prodotto1.model}`)
                .send({quantity: 10, changeDate: "1500-10-09"})
                .set('Cookie', managerCookie)
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({error: "changeDate cannot be before arrival date"})
                })
        })

        test("Nuova quantità non valida", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .patch(`${routePath}/products/${prodotto1.model}`)
                .send({quantity: -1, changeDate: "2021-10-10"})
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Insufficient quantity"})
                })
        })
    

        test("Modello non fornito", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .patch(`${routePath}/products/${encodeURIComponent(" ")}`)
                .send({quantity: 10, changeDate: "2021-10-10"})
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Model cannot be empty"})
                })
        })
       
    })

    describe("Sell Product", ()=>{
        test("Corretto Funzionamento", async ()=>{
            managerCookie = await login(manager)
            const quantity = 5
            await request(app)
                .patch(`${routePath}/products/${prodotto1.model}/sell`)
                .send({quantity: quantity, sellingDate: "2021-10-10"})
                .set('Cookie', managerCookie)
                .expect(200)

            prodotto1.quantity -= quantity
            const products = await productDao.getProducts("model", null, prodotto1.model)
            expect(products).toHaveLength(1);
            expect(products[0].model).toEqual(prodotto1.model);
            expect(products[0].category).toEqual(prodotto1.category);
            expect(products[0].quantity).toEqual(prodotto1.quantity);
            expect(products[0].details).toEqual(prodotto1.details);
            expect(products[0].sellingPrice).toEqual(prodotto1.sellingPrice);
            expect(products[0].arrivalDate).toEqual(prodotto1.arrivalDate);
        })

        test("Modello non esistente", async ()=>{
            managerCookie = await login(manager)
            await request(app)
                .patch(`${routePath}/products/${prodotto_modello_non_esiste.model}/sell`)
                .send({quantity: 10, sellingDate: "2021-10-10"})
                .set('Cookie', managerCookie)
                .expect(404)
                .then((response) => {
                    expect(response.body).toEqual({error: "Product not found", status: 404})
                })
        })

        test("Modello non fornito", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .patch(`${routePath}/products/${" "}/sell`)
                .send({quantity: 10, sellingDate: "2021-10-10"})
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Model cannot be empty"})
                })
        })

        test("Quantità uguale a 0 o negativa", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .patch(`${routePath}/products/${prodotto1.model}/sell`)
                .send({quantity: -1, sellingDate: "2021-10-10"})
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Insufficient quantity"})
                })
        })

        test("Data di vendita non valida", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .patch(`${routePath}/products/${prodotto1.model}/sell`)
                .send({quantity: 10, sellingDate: "data"})
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Wrong date format"})
                })
        })

        test("Data di vendita successiva alla data attuale", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .patch(`${routePath}/products/${prodotto1.model}/sell`)
                .send({quantity: 10, sellingDate: "20280-10-10"})
                .set('Cookie', managerCookie)
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({error: "selling date cannot be after today"})
                })
        })

        test("Quantità del prodotto esaurita", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .patch(`${routePath}/products/${prodotto_quantità_esaurita.model}/sell`)
                .send({quantity: 100000000, sellingDate: "2021-10-10"})
                .set('Cookie', managerCookie)
                .expect(409)
                .then((response) => {
                    expect(response.body).toEqual({error: "Product stock cannot satisfy the requested quantity"})
                })
        })

        test("La data di vendita non può essere prima della data di arrivo", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .patch(`${routePath}/products/${prodotto1.model}/sell`)
                .send({quantity: 10, sellingDate: "1500-10-10"})
                .set('Cookie', managerCookie)
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({error: "selling date cannot be before arrival date"})
                })
        })

    })

    describe("Get Products", ()=>{

        test("Ottieni tutti i prodotti", async ()=>{
            managerCookie = await login(manager)
            const grouping:string|null = null
            const category:string|null = null
            const model:string|null = null

            let url = `${routePath}/products/`;
      
            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual([prodotto1, prodotto_quantità_esaurita, prodotto_laptop1, prodotto_laptop2, prodotto_applicance1, prodotto2])
                })
        })

        test("Ottieni tutti i prodotti di una categoria", async ()=>{
            managerCookie = await login(manager)
            const grouping:string|null = "category"
            const category = Category.LAPTOP
            const model:string|null = null

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual([prodotto_laptop1, prodotto_laptop2])
                })
        })

        test("Ottieni tutti i prodotti di un modello", async ()=>{
            managerCookie = await login(manager)
            const grouping:string|null = "model"
            const category:string|null = null
            const model = "model1"

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual([prodotto1])
                })
        })

        test("Categoria non fornita quando il grouping è per categoria", async()=>{
            managerCookie = await login(manager)
            const grouping = "category"
            const category:string|null = null
            const model:string|null = null

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Parameters error"})
                })
        })

        test("Categoria non valida", async()=>{
            managerCookie = await login(manager)
            const grouping = "category"
            const category = "invalid"
            const model:string|null = null

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Invalid category"})
                })
        })

        test("Modello non fornito quando il grouping è per modello", async()=>{
            managerCookie = await login(manager)
            const grouping = "model"
            const category:string|null = null
            const model:string|null = null

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Parameters error"})
                })
        })

        test("Modello vuoto", async()=>{
            managerCookie = await login(manager)
            const grouping = "model"
            const category:string|null = null
            const model = " "

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${encodeURIComponent(model)}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Model cannot be empty"})
                })
        })

        test("Prodotto non trovato", async()=>{
            managerCookie = await login(manager)
            const grouping:string|null = "model"
            const category:string|null = null
            const model = "modelloNonEsiste"

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(404)
                .then((response) => {
                    expect(response.body).toEqual({error: "Product not found", status: 404})
                })
        })

        test("Grouping non valido", async()=>{
            managerCookie = await login(manager)
            const grouping = "invalid"
            const category:string|null = null
            const model:string|null = null

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Invalid grouping"})
                })
        })

        test("Grouping non fornito, ma categoria o modello forniti", async()=>{
            managerCookie = await login(manager)
            const grouping:string|null = null
            const category = Category.LAPTOP
            const model:string|null = null

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Category and model must be null"})
                })
        })

        test("Grouping su modello, ma modello nullo", async()=>{
            managerCookie = await login(manager)
            const grouping = "model"
            const category:string|null = null
            const model:string|null = null

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Parameters error"})
                })
        })
        
    })

    describe("Get Available Products", ()=>{

        test("Ottieni tutti i prodotti", async ()=>{
            
            managerCookie = await login(manager)
            const grouping:string|null = null
            const category:string|null = null
            const model:string|null = null

            let url = `${routePath}/products/available/`;
   

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual([prodotto1, prodotto_laptop1, prodotto_laptop2, prodotto_applicance1, prodotto2])
                })
        })

        test("Ottieni tutti i prodotti di una categoria", async ()=>{
            managerCookie = await login(manager)
            const grouping:string|null = "category"
            const category = Category.LAPTOP
            const model:string|null = null

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual([prodotto_laptop1, prodotto_laptop2])
                })
        })

        test("Ottieni tutti i prodotti di un modello", async ()=>{
            managerCookie = await login(manager)
            const grouping:string|null = "model"
            const category:string|null = null
            const model = "model1"

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual([prodotto1])
                })
        })

        test("Categoria non fornita quando il grouping è per categoria", async()=>{
            managerCookie = await login(manager)
            const grouping = "category"
            const category:string|null = null
            const model:string|null = null

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Parameters error"})
                })
        })

        test("Categoria non valida", async()=>{
            managerCookie = await login(manager)
            const grouping = "category"
            const category = "invalid"
            const model:string|null = null

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Invalid category"})
                })
        })

        test("Modello non fornito quando il grouping è per modello", async()=>{
            managerCookie = await login(manager)
            const grouping = "model"
            const category:string|null = null
            const model:string|null = null

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Parameters error"})
                })
        })

        test("Modello vuoto", async()=>{
            managerCookie = await login(manager)
            const grouping = "model"
            const category:string|null = null
            const model = " "

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${encodeURIComponent(model)}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Model cannot be empty"})
                })
        })

        test("Prodotto non trovato", async()=>{
            managerCookie = await login(manager)
            const grouping:string|null = "model"
            const category:string|null = null
            const model = "modelloNonEsiste"

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(404)
                .then((response) => {
                    expect(response.body).toEqual({error: "Product not found", status: 404})
                })
        })

        test("Grouping non valido", async()=>{
            managerCookie = await login(manager)
            const grouping = "invalid"
            const category:string|null = null
            const model:string|null = null

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Invalid grouping"})
                })
        })

        test("Grouping non fornito, ma categoria o modello forniti", async()=>{
            managerCookie = await login(manager)
            const grouping:string|null = null
            const category = Category.LAPTOP
            const model:string|null = null

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Category and model must be null"})
                })
        })

        test("Grouping su modello, ma modello nullo", async()=>{
            managerCookie = await login(manager)
            const grouping = "model"
            const category:string|null = null
            const model:string|null = null

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({error: "Parameters error"})
                })
        })
       
    })

    describe("Delete Product", ()=>{
        test("Corretto Funzionamento", async ()=>{
            managerCookie = await login(manager)
            await request(app)
                .delete(`${routePath}/products/${prodotto1.model}`)
                .set('Cookie', managerCookie)
                .expect(200)

            const products = await productDao.getProducts(null, null, null)
            expect(products).toEqual([prodotto_quantità_esaurita, prodotto_laptop1, prodotto_laptop2, prodotto_applicance1, prodotto2])
        })

        test("Prodotto non trovato", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .delete(`${routePath}/products/${prodotto_modello_non_esiste.model}`)
                .set('Cookie', managerCookie)
                .expect(404)
                .then((response) => {
                    expect(response.body).toEqual({error: "Product not found", status: 404})
                })
        })

        test("Modello non fornito", async()=>{
            managerCookie = await login(manager)
            await request(app)
                .delete(`${routePath}/products/${encodeURIComponent(" ")}`)
                .set('Cookie', managerCookie)
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({error: "Model cannot be empty"})
                })
        })

        


    })

    describe("Delete All Products", ()=>{
        test("Corretto Funzionamento", async ()=>{
            managerCookie = await login(manager)
            await request(app)
                .delete(`${routePath}/products/`)
                .set('Cookie', managerCookie)
                .expect(200)

            await expect(productDao.getProducts(null, null, null)).resolves.toEqual([])
        })

    })

    

})
