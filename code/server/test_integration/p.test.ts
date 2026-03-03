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



describe("Integration Test DAO Products", ()=>{

    let productDao:ProductDAO;
    let prodotto1:Product;
    let prodotto2:Product;
    let prodotto_modello_non_esiste:Product;
    let prodotto_quantità_esaurita:Product;
    let prodotto_laptop1:Product;
    let prodotto_laptop2:Product;
    let prodotto_applicance1:Product;

    beforeAll(async () => {

        productDao = new ProductDAO()

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

        db.serialize(async () => {
            db.run(`
            INSERT INTO products (model, sellingPrice, category, arrivalDate, details, quantity)
            VALUES (?, ?, ?, ?, ?, ?),
                   (?, ?, ?, ?, ?, ?),
                   (?, ?, ?, ?, ?, ?),
                   (?, ?, ?, ?, ?, ?),
                   (?, ?, ?, ?, ?, ?)
            `, [
            prodotto1.model, prodotto1.sellingPrice, prodotto1.category, prodotto1.arrivalDate, prodotto1.details, prodotto1.quantity,
            prodotto_quantità_esaurita.model, prodotto_quantità_esaurita.sellingPrice, prodotto_quantità_esaurita.category, prodotto_quantità_esaurita.arrivalDate, prodotto_quantità_esaurita.details, prodotto_quantità_esaurita.quantity,
            prodotto_laptop1.model, prodotto_laptop1.sellingPrice, prodotto_laptop1.category, prodotto_laptop1.arrivalDate, prodotto_laptop1.details, prodotto_laptop1.quantity,
            prodotto_laptop2.model, prodotto_laptop2.sellingPrice, prodotto_laptop2.category, prodotto_laptop2.arrivalDate, prodotto_laptop2.details, prodotto_laptop2.quantity,
            prodotto_applicance1.model, prodotto_applicance1.sellingPrice, prodotto_applicance1.category, prodotto_applicance1.arrivalDate, prodotto_applicance1.details, prodotto_applicance1.quantity
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

        test("Corretto Funzionamento", async ()=>{

            await productDao.registerProducts(prodotto2.model,prodotto2.category, prodotto2.quantity, prodotto2.details, prodotto2.sellingPrice, prodotto2.arrivalDate)  

            const prodotto_Db = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM products WHERE model = ?", [prodotto2.model], (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row);
                });
            });

            expect(prodotto_Db).toEqual({
                model: prodotto2.model,
                category: prodotto2.category,
                quantity: prodotto2.quantity,
                details: prodotto2.details,
                sellingPrice: prodotto2.sellingPrice,
                arrivalDate: prodotto2.arrivalDate
            })
            
        });

        test("Modello già esistente", async () => {
    
            await expect(ProductDAO.prototype.registerProducts(prodotto1.model, prodotto1.category, prodotto1.quantity, prodotto1.details, prodotto1.sellingPrice, prodotto1.arrivalDate))
                .rejects
                .toThrow(new ProductAlreadyExistsError());
        });


    });

    describe("Change Product Quantity", ()=>{

        test("Corretto Funzionamento", async ()=>{

            const newQuantity = 10
            await productDao.changeProductQuantity(prodotto1.model, newQuantity, "2021-10-10")

            const prodotto_Db = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM products WHERE model = ?", [prodotto1.model], (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row);
                });
            });

            prodotto1.quantity += newQuantity

            expect(prodotto_Db).toEqual({
                model: prodotto1.model,
                category: prodotto1.category,
                details: prodotto1.details,
                sellingPrice: prodotto1.sellingPrice,
                arrivalDate: prodotto1.arrivalDate,
                quantity: prodotto1.quantity
            })
            
            
        });

        test("Modello non esistente", async () => {
    
            await expect(ProductDAO.prototype.changeProductQuantity(prodotto_modello_non_esiste.model, 10, "2021-10-10"))
                .rejects
                .toThrow(new ProductNotFoundError());
        });

    });

    describe("Sell Product", ()=>{

        test("Corretto Funzionamento", async ()=>{

            const quantity = 5
            await productDao.sellProduct(prodotto2.model, quantity, "2021-10-10")

            const prodotto_Db = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM products WHERE model = ?", [prodotto2.model], (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row);
                });
            });

            prodotto2.quantity -= quantity

            expect(prodotto_Db).toEqual({
                model: prodotto2.model,
                category: prodotto2.category,
                details: prodotto2.details,
                sellingPrice: prodotto2.sellingPrice,
                arrivalDate: prodotto2.arrivalDate,
                quantity: prodotto2.quantity
            })
            
        });

        test("Modello non esistente", async () => {
    
            await expect(ProductDAO.prototype.sellProduct(prodotto_modello_non_esiste.model, 10, "2021-10-10"))
                .rejects
                .toThrow(new ProductNotFoundError());
        });

       

        test("Quantità del prodotto esaurita", async()=>{
            await expect(ProductDAO.prototype.sellProduct(prodotto_quantità_esaurita.model, 10, "2021-10-10"))
                .rejects
                .toThrow(new EmptyProductStockError());
        })

        test("Quantità del prodotto non sufficiente", async()=>{
            await expect(ProductDAO.prototype.sellProduct(prodotto1.model, 5000, "2021-10-10"))
                .rejects
                .toThrow(new LowProductStockError);
        })


    });

    describe("Get Products", ()=>{

        test("Ottieni tutti i prodotti", async ()=>{
            const products = await productDao.getProducts(null, null, null)
            expect(products).toEqual([prodotto1, prodotto_quantità_esaurita, prodotto_laptop1, prodotto_laptop2, prodotto_applicance1, prodotto2])
        })

        test("Ottieni tutti i prodotti di una categoria", async ()=>{
            const products = await productDao.getProducts("category", Category.LAPTOP, null)
            expect(products).toEqual([prodotto_laptop1, prodotto_laptop2])
        })

        test("Ottieni tutti i prodotti di un modello", async ()=>{
            const products = await productDao.getProducts("model", null, "model1")
            expect(products).toEqual([prodotto1])
        })

        

        test("Nessun prodotto trovato", async()=>{
            await expect(productDao.getProducts("model", null, prodotto_modello_non_esiste.model))
            .resolves.toEqual([])
        })

 
    });

    describe("Get Available Products", ()=>{

        test("Ottieni tutti i prodotti", async ()=>{
            const products = await productDao.getAvailableProducts(null, null, null)
            expect(products).toEqual([prodotto1, prodotto_laptop1, prodotto_laptop2, prodotto_applicance1, prodotto2])
        })

        test("Ottieni tutti i prodotti di una categoria", async ()=>{
            const products = await productDao.getAvailableProducts("category", Category.LAPTOP, null)
            expect(products).toEqual([prodotto_laptop1, prodotto_laptop2])
        })

        test("Ottieni tutti i prodotti di un modello", async ()=>{
            const products = await productDao.getAvailableProducts("model", null, "model1")
            expect(products).toEqual([prodotto1])
        })

        

        test("Nessun prodotto trovato", async()=>{
            await expect(productDao.getAvailableProducts("model", null, prodotto_modello_non_esiste.model))
            .resolves.toEqual([])
        })


    });

    describe("Delete Product", ()=>{

        test("Corretto Funzionamento", async ()=>{
            await productDao.deleteProduct(prodotto1.model)

            const products = await new Promise((resolve, reject) => {
                db.all("SELECT * FROM products", (err, rows) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(rows);
                });
            });

            expect(products).toEqual([prodotto_quantità_esaurita, prodotto_laptop1, prodotto_laptop2, prodotto_applicance1, prodotto2])
        })

        

        test("Nessun prodotto trovato", async()=>{
            await expect(productDao.deleteProduct(prodotto_modello_non_esiste.model))
            .rejects.toThrowError(new ProductNotFoundError())
        })
    });

    describe("Delete All Products", ()=>{

        test("Corretto Funzionamento", async ()=>{
            await productDao.deleteAllProducts()

            const products = await new Promise((resolve, reject) => {
                db.all("SELECT * FROM products", (err, rows) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(rows);
                });
            });

            expect(products).toEqual([])
        })

        

        test("Nessun prodotto trovato", async()=>{
            await expect(productDao.deleteAllProducts())
                .rejects
                .toThrow(new EmptyProductStockError())
        })


    });

    

})


