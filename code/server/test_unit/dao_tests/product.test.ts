import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import ProductDao from "../../src/dao/productDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError"
import { Category, Product } from "../../src/components/product"
import dayjs from "dayjs"

jest.mock("../../src/db/db.ts")

describe("ProductController", () => {

    describe("RegisterProduct DAO test", () => {
        const productDao = new ProductDao()

        test("Ritorna errore per un parametro errato", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(), undefined);
                return {} as any;
            });
        
            await expect(productDao.registerProducts("moder", "Tablet", 1, "", 10, null)).rejects.toThrow(new ProductAlreadyExistsError());
        
            mockDBRun.mockRestore();
        });

        test("Ritorna errore per un modello già esistente", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("UNIQUE constraint failed: products.model"), undefined);
                return {} as any;
            });
        
            await expect(productDao.registerProducts("moder", "Tablet", 1, "", 10, null)).rejects.toThrow(new ProductAlreadyExistsError());
        
            mockDBRun.mockRestore();
        });

        test("Viene eseguito correttamente la registrazione di un nuovo prodotto", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as any;
            });
        
            await expect(productDao.registerProducts("model", "Tablet", 1, "", 10, "2023-11-10")).resolves.not.toThrow();
            
            mockDBRun.mockRestore();
        });
    })

    describe("ChangeProductQuantity DAO test", () => {
        const productDao = new ProductDao()

        test("Modello non esistente nel database", async ()=>{
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, undefined);
                return {} as any;
            });
        
            await expect(productDao.changeProductQuantity("model", 10, null)).rejects.toThrow(new ProductNotFoundError());
        
            mockDBGet.mockRestore();
        });

        test("Parametri errati nella richiesta di select", async ()=>{
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error(), undefined);
                return {} as any;
            });
        
            await expect(productDao.changeProductQuantity("model", 10, null)).rejects.toThrow();
        
            mockDBGet.mockRestore();
        });

        test("Parametri errati nella richiesta di Update", async ()=>{
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {quantity: 10});
                return {} as any;
            });

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error());
                return {} as any;
            });
        
            await expect(productDao.changeProductQuantity("model", 10, null)).rejects.toThrow();
        
            mockDBGet.mockRestore();
        });

        test("Modifica della quantità eseguita correttamente", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {quantity: 10});
                return {} as any;
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as any;
            });
        
            await expect(productDao.changeProductQuantity("model", 5, null)).resolves.toBe(15);
        
            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
            
        });
    });

    describe("SellProduct DAO test", () => {
        const productDao = new ProductDao()

        test("Parametri non corretti inseriti", async()=>{
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error(), undefined);
                return {} as any;
            });

            await expect(productDao.sellProduct("model", 10, null)).rejects.toThrow(); 
            mockDBGet.mockRestore();   

        });

        test("Modello non esistente nel database", async ()=>{
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, undefined);
                return {} as any;
            });
        
            await expect(productDao.sellProduct("model", 10, null)).rejects.toThrow(new ProductNotFoundError());
        
            mockDBGet.mockRestore();
        });

        test("Quantità non deve essere nulla", async ()=>{
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {quantity: 0});
                return {} as any;
            });
        
            await expect(productDao.sellProduct("model", 10, null)).rejects.toThrow(new EmptyProductStockError());
        
            mockDBGet.mockRestore();
        });

        test("Quantità venduta maggiore della quantità disponibile", async ()=>{
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {quantity: 5});
                return {} as any;
            });
        
            await expect(productDao.sellProduct("model", 10, null)).rejects.toThrow(new LowProductStockError());
        
            mockDBGet.mockRestore();
        });

        test("Parametri della funzione Update non corretti", async()=>{
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {quantity: 10});
                return {} as any;
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(), undefined);
                return {} as any;
            });
        
            await expect(productDao.sellProduct("model", 10, null)).rejects.toThrow();
        
            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        });

        test("Vendita eseguita correttamente", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {quantity: 10});
                return {} as any;
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as any;
            });
        
            await expect(productDao.sellProduct("model", 5, null)).resolves.toBe(5);
        
            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        });

    });

    describe("GetProduct DAO test", () => {

        const productDao = new ProductDao()

        test("Parametri non corretti inseriti", async()=>{
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error(), undefined);
                return {} as any;
            });

            await expect(productDao.getProducts("model", null, null)).rejects.toThrow(); 
            mockDBGet.mockRestore();   
        });

        test("Modello non esistente nel database", async ()=>{
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, {length: 0});
                return {} as any;
            });
        
            await expect(productDao.getProducts("model", "model", "model")).resolves.toEqual([]);
        
            mockDBGet.mockRestore();
        });

        test("Filtro per categoria", async()=>{
            const product = new Product(20, "model",Category.SMARTPHONE,"2024-05-12" , "description", 10);
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [product]);
                return {} as any;
            });
        
            await expect(productDao.getProducts("category", "category", null)).resolves.toEqual([product]);
        
            mockDBGet.mockRestore();
        })

        test("Filtro per modello", async()=>{
            const product = new Product(20, "model",Category.SMARTPHONE,"2024-05-12" , "description", 10);
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [product]);
                return {} as any;
            });
        
            await expect(productDao.getProducts("model", null , "model")).resolves.toEqual([product]);
        
            mockDBGet.mockRestore();
        })

        test("Nessun filtro selezionato", async()=>{
            const product = new Product(20, "model",Category.SMARTPHONE,"2024-05-12" , "description", 10);
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [product]);
                return {} as any;
            });
        
            await expect(productDao.getProducts(null, null , "model")).resolves.toEqual([product]);
        
            mockDBGet.mockRestore();
        })

    });

    describe("GetAvailableProduct DAO test", () => {

        const productDao = new ProductDao()

        test("Parametri non corretti inseriti", async()=>{
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error(), undefined);
                return {} as any;
            });

            await expect(productDao.getAvailableProducts("model", null, null)).rejects.toThrow(); 
            mockDBGet.mockRestore();   
        });

        test("Modello non esistente nel database", async ()=>{
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, {length: 0});
                return {} as any;
            });
        
            await expect(productDao.getAvailableProducts("model", "model", "model")).resolves.toEqual([]);
        
            mockDBGet.mockRestore();
        });

        test("Filtro per categoria", async()=>{
            const product = new Product(20, "model",Category.SMARTPHONE,"2024-05-12" , "description", 10);
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [product]);
                return {} as any;
            });
        
            await expect(productDao.getAvailableProducts("category", "category", null)).resolves.toEqual([product]);
        
            mockDBGet.mockRestore();
        })

        test("Filtro per modello", async()=>{
            const product = new Product(20, "model",Category.SMARTPHONE,"2024-05-12" , "description", 10);
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [product]);
                return {} as any;
            });
        
            await expect(productDao.getAvailableProducts("model", null , "model")).resolves.toEqual([product]);
        
            mockDBGet.mockRestore();
        })

        test("Nessun filtro selezionato", async()=>{
            const product = new Product(20, "model",Category.SMARTPHONE,"2024-05-12" , "description", 10);
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [product]);
                return {} as any;
            });
        
            await expect(productDao.getAvailableProducts(null, null , "model")).resolves.toEqual([product]);
        
            mockDBGet.mockRestore();
        })


    });

    describe("DeleteAllProduct DAO test", () => {
        const productDao = new ProductDao()

        test('Errore nella cancellazione', async () => {
            const mockDBRun = jest.spyOn(db, 'run').mockImplementation(function (sql, callback) {
            callback(new Error(), null);
            return {} as any;
            });
        
            await expect(productDao.deleteAllProducts()).rejects.toThrow();
            mockDBRun.mockRestore();
        });
        
        test('Cancellazione Prodotti da Carrello vuoto', async () => {
            const mockDBRun = jest.spyOn(db, 'run').mockImplementation(function (sql,  callback) {
            callback.call({ changes: 0 }, null);
            return {} as any;
            });
        
            await expect(productDao.deleteAllProducts()).rejects.toThrow(new EmptyProductStockError());
            mockDBRun.mockRestore();
        });

        test("Cancellazione di tutti i prodotti eseguita correttamente", async()=>{
            const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, callback) =>  {
                callback.call( { changes: 1 },null);
                return {} as any;
            });
        
            await expect(productDao.deleteAllProducts()).resolves.toEqual(true);
            mockDBRun.mockRestore();
        })
    });

    describe("Delete Product DAO test", () => {
        const productDao = new ProductDao()

        test('Errore nella cancellazione', async () => {
            const mockDBRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
            callback(new Error(), null);
            return {} as any;
            });
        
            await expect(productDao.deleteProduct("model")).rejects.toThrow();
            mockDBRun.mockRestore();
        });
        
        test('Cancellazione prodotto non esistente', async () => {
            const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback.call({ changes: 0 }, null);
            return {} as any;
            });
        
            await expect(productDao.deleteProduct("model")).rejects.toThrow(ProductNotFoundError);
            mockDBRun.mockRestore();
        });
        
        test('Cancellazione di un prodotto eseguita correttamente', async () => {
            const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback.call({ changes: 1 },null);
            return {} as any;
            });
        
            await expect(productDao.deleteProduct("model")).resolves.toEqual(true);
            mockDBRun.mockRestore();
        });
    });
})


