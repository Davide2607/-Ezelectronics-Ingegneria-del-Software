import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
import { cleanup, create_tables} from "../src/db/cleanup"
import ProductController from "../src/controllers/productController"
import {User, Role} from "../src/components/user"

import  ProductDAO from "../src/dao/productDAO"
import {Product, Category} from "../src/components/product"
import { EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError} from "../src/errors/productError"


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

describe("Integration Test Controller Products", ()=>{
    let productDao:ProductDAO;
    let productController: ProductController;
    let prodotto1:Product;
    let prodotto2:Product;
    let prodotto_modello_non_esiste:Product;
    let prodotto_quantità_esaurita:Product;
    let prodotto_laptop1:Product;
    let prodotto_laptop2:Product;
    let prodotto_applicance1:Product;

    beforeAll(async () => {

        await create_tables();
        await cleanup();
        productDao = new ProductDAO()
        productController = new ProductController()

        prodotto1 = new Product(10, "model1", Category.SMARTPHONE, "2021-10-10", "details", 10)
        prodotto2 = new Product(10, "model2", Category.SMARTPHONE, "2021-10-10", "details", 10)
        prodotto_modello_non_esiste = new Product(10, "modelloNonEsiste", Category.SMARTPHONE, "2021-10-10", "details", 10)
        prodotto_quantità_esaurita = new Product(10, "modelQE", Category.SMARTPHONE, "2021-10-10", "details", 0)
        prodotto_laptop1 = new Product(10, "modelLaptop1", Category.LAPTOP, "2021-10-10", "details", 10)
        prodotto_laptop2 = new Product(10, "modelLaptop2", Category.LAPTOP, "2021-10-10", "details", 10)
        prodotto_applicance1 = new Product(10, "modelAppliance1", Category.APPLIANCE, "2021-10-10", "details", 10)

        db.serialize(()=>{
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
        })
        

        jest.spyOn(db, "get");
        jest.spyOn(db, "all");
        jest.spyOn(db, "run");

    })

    afterAll(async()=>{
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
        test("Corretto Funzionamento", async ()=>{
            await productController.registerProducts(prodotto2.model,prodotto2.category, prodotto2.quantity, prodotto2.details, prodotto2.sellingPrice, prodotto2.arrivalDate)  

            const products = await productDao.getProducts("model", null, prodotto2.model)
            expect(products).toHaveLength(1);
            expect(products[0].model).toEqual(prodotto2.model);
            expect(products[0].category).toEqual(prodotto2.category);
            expect(products[0].quantity).toEqual(prodotto2.quantity);
            expect(products[0].details).toEqual(prodotto2.details);
            expect(products[0].sellingPrice).toEqual(prodotto2.sellingPrice);
            expect(products[0].arrivalDate).toEqual(prodotto2.arrivalDate);
        })

        test("Modello già esistente", async ()=>{
            await expect(productController.registerProducts(prodotto1.model, prodotto1.category, prodotto1.quantity, prodotto1.details, prodotto1.sellingPrice, prodotto1.arrivalDate))
                .rejects
                .toThrow(new ProductAlreadyExistsError());
        })

    })

    describe("Change Product Quantity", ()=>{
        test("Corretto Funzionamento", async ()=>{
            const newQuantity = 10
            await productController.changeProductQuantity(prodotto1.model, newQuantity, "2021-10-10")
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
            await expect(productController.changeProductQuantity(prodotto_modello_non_esiste.model, 10, "2021-10-10"))
                .rejects
                .toThrow(new ProductNotFoundError());
        })


    })

    describe("Sell Product", ()=>{
        test("Corretto Funzionamento", async ()=>{
            const quantity = 5
            await productController.sellProduct(prodotto1.model, quantity, "2021-10-10")
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
            await expect(productController.sellProduct(prodotto_modello_non_esiste.model, 10, "2021-10-10"))
                .rejects
                .toThrow(new ProductNotFoundError());
        })

        

        test("Quantità del prodotto esaurita", async()=>{
            await expect(productController.sellProduct(prodotto_quantità_esaurita.model, 10, "2021-10-10"))
                .rejects
                .toThrow(new EmptyProductStockError());
        })

        test("Quantità del prodotto non sufficiente", async()=>{
            await expect(productController.sellProduct(prodotto1.model, 5000, "2021-10-10"))
                .rejects
                .toThrow(new LowProductStockError());
        })

    })

    describe("Get Products", ()=>{
        test("Ottieni tutti i prodotti", async ()=>{
            const products = await productController.getProducts(null, null, null)
            expect(products).toEqual([prodotto1, prodotto_quantità_esaurita, prodotto_laptop1, prodotto_laptop2, prodotto_applicance1, prodotto2])
        })

        test("Ottieni tutti i prodotti di una categoria", async ()=>{
            const products = await productController.getProducts("category", Category.LAPTOP, null)
            expect(products).toEqual([prodotto_laptop1, prodotto_laptop2])
        })

        test("Ottieni tutti i prodotti di un modello", async ()=>{
            const products = await productController.getProducts("model", null, "model1")
            expect(products).toEqual([prodotto1])
        })

        

        test("Nessun prodotto trovato", async()=>{
            await expect(productController.getProducts("model", null, prodotto_modello_non_esiste.model))
                .rejects
                .toThrow(new ProductNotFoundError())
        })


    })

    describe("Get Available Products", ()=>{
        test("Ottieni tutti i prodotti", async ()=>{
            const products = await productController.getAvailableProducts(null, null, null)
            expect(products).toEqual([prodotto1, prodotto_laptop1, prodotto_laptop2, prodotto_applicance1, prodotto2])
        })

        test("Ottieni tutti i prodotti di una categoria", async ()=>{
            const products = await productController.getAvailableProducts("category", Category.LAPTOP, null)
            expect(products).toEqual([prodotto_laptop1, prodotto_laptop2])
        })

        test("Ottieni tutti i prodotti di un modello", async ()=>{
            const products = await productController.getAvailableProducts("model", null, "model1")
            expect(products).toEqual([prodotto1])
        })

        

        test("Nessun prodotto trovato", async()=>{
            await expect(productController.getAvailableProducts("model", null, prodotto_modello_non_esiste.model))
                .rejects
                .toThrow(new ProductNotFoundError())
        })


    })

    describe("Delete Product", ()=>{
        test("Corretto Funzionamento", async ()=>{
            await productController.deleteProduct(prodotto1.model)

            const products = await productDao.getProducts(null, null, null)
            expect(products).toEqual([prodotto_quantità_esaurita, prodotto_laptop1, prodotto_laptop2, prodotto_applicance1,prodotto2])
        })

       

        test("Nessun prodotto trovato", async()=>{
            await expect(productController.deleteProduct(prodotto_modello_non_esiste.model))
                .rejects
                .toThrow(new ProductNotFoundError())
        })

    })

    describe("Delete All Products", ()=>{
        test("Corretto Funzionamento", async ()=>{
            await productController.deleteAllProducts()

            await expect(productDao.getProducts(null, null, null)).resolves.toEqual([])
        })

        

        test("Nessun prodotto trovato", async()=>{
            await expect(productController.deleteAllProducts())
                .rejects
                .toThrow(new EmptyProductStockError())
        })

    })

    
})

