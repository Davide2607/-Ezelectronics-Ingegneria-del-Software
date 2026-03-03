import { test, expect, jest, describe, afterEach, beforeEach} from "@jest/globals"
import ProductController from "../../src/controllers/productController"
import request from 'supertest'
import { app } from "../../index"
import Authenticator from "../../src/routers/auth"
import { Category, Product } from "../../src/components/product"
import ErrorHandler from "../../src/helper"
import ProductRoutes from "../../src/routers/productRoutes"
import { Request, Response, NextFunction } from 'express';
import ProductDAO from "../../src/dao/productDAO"

const baseURL = "/ezelectronics/products"

jest.mock("../../src/controllers/productController")
jest.mock("../../src/routers/auth")

describe("Product Route Tests", ()=>{
    
    const productController = new ProductController()
    
    afterEach(() => {
        jest.clearAllMocks();
    })

    describe("Inserisci nuovo prodotto", () => {
        
        test("Corretto Funzionamento", async () => {
            const inputProduct = {model: "test", category: "Smartphone", quantity: 10, details: "", sellingPrice: 10,  arrivalDate: "2023-01-01"}
            const product = new Product(10, "model", Category.SMARTPHONE, "2021-01-01", "", 10)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([]);
            jest.spyOn(ProductController.prototype, "registerProducts").mockImplementation(() => Promise.resolve());
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.registerProducts).toHaveBeenCalled()
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(inputProduct.model, inputProduct.category,inputProduct.quantity,  inputProduct.details, inputProduct.sellingPrice,  inputProduct.arrivalDate)
        })

        test("Modello già esistente", async () => {
            const inputProduct = {model: "model", category: "Smartphone", quantity: 10, details: "", sellingPrice: 10,  arrivalDate: "2023-01-01"}
            const product = new Product(10, "model", Category.SMARTPHONE, "2021-01-01", "", 10)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([product]);
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(409)
            expect(response.body).toEqual({"error":"Product Already Exists"})
        })

        test("Errore controller", async () => {
            const inputProduct = {model: "test", category: "Smartphone", quantity: 10, details: "", sellingPrice: 10,  arrivalDate: "2023-01-01"}
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValue(new Error());
            const response = await request(app).post(baseURL + "/").send(inputProduct).catch((err) => {
                expect(err).toBeInstanceOf(Error);
            });
            
        })

        test("Modello non fornito", async () => {
            const arrivalDate: string|null = null
            const inputProduct = { model: "", category: "Smartphone", sellingPrice: 10, quantity: 10, arrivalDate: arrivalDate, details: ""}
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            
            jest.spyOn(ProductController.prototype, "registerProducts")
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(422)
            expect(ProductController.prototype.registerProducts).not.toHaveBeenCalled()
            expect(response.body).toEqual({"error":"Model cannot be empty"})
        })

        test("Quantità insufficiente", async () => {
            const arrivalDate: string|null = null
            const inputProduct = { model: "model", category: "Smartphone", sellingPrice: 10, quantity: 0, arrivalDate: arrivalDate, details: ""}
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            
            jest.spyOn(ProductController.prototype, "registerProducts")
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(422)
            expect(ProductController.prototype.registerProducts).not.toHaveBeenCalled()
            expect(response.body).toEqual({"error":"Insufficient quantity"})
        })

        test("Prezzo di vendita insufficiente", async () => {
            const arrivalDate: string|null = null
            const inputProduct = { model: "model", category: "Smartphone", sellingPrice: 0, quantity: 10, arrivalDate: arrivalDate, details: ""}
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            
            jest.spyOn(ProductController.prototype, "registerProducts")
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(422)
            expect(ProductController.prototype.registerProducts).not.toHaveBeenCalled()
            expect(response.body).toEqual({"error":"Insufficient selling Price"})
        })

        test("Categoria errata", async () => {
            const arrivalDate: string|null = null
            const inputProduct = { model: "model", category: "Computer", sellingPrice: 10, quantity: 10, arrivalDate: arrivalDate, details: ""}
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            
            jest.spyOn(ProductController.prototype, "registerProducts")
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(422)
            expect(ProductController.prototype.registerProducts).not.toHaveBeenCalled()
            expect(response.body).toEqual({"error":"invalid category"})
        })

        test("Data di arrivo dopo la data odierna", async () => {
            const arrivalDate: string|null = "2026-02-02"
            const inputProduct = { model: "iPhone13", category: "Smartphone", sellingPrice: 10, quantity: 10, arrivalDate: arrivalDate, details: ""}
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            
            jest.spyOn(ProductController.prototype, "registerProducts")
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(400)
            expect(ProductController.prototype.registerProducts).not.toHaveBeenCalled()
            expect(response.body).toEqual({"error":"arrival date cannot be after today"})
        })
          
    });

    describe("Modifica quantità prodotto", () => {

        test("Corretto Funzionamento", async()=>{
            const newQuantity:number = 10;
            const model = "iPhone13";
            const inputProduct = {quantity: newQuantity, changeDate: "2023-01-01" };
            const product = new Product(10, "iPhone13", Category.SMARTPHONE, "2021-01-01", "", 10)

            jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
                isNumeric: () => ({ isLength: () => ({}) }),
            })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
            return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
            return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);
            const mockChangeProductQuantity = jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValue(10);

            const response = await request(app).patch(baseURL + `/${model}`).send(inputProduct);

            // Check the status and response
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ quantity: 10 });

            // Ensure the changeProductQuantity method was called with correct parameters
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(model, inputProduct.quantity, inputProduct.changeDate);
        })

        test("Errore verifica esistenza modello", async()=>{
            const newQuantity:number = 10;
            const model = "iPhone13";
            const inputProduct = {quantity: newQuantity, changeDate: "2023-01-01" };
            const product = new Product(10, "model", Category.SMARTPHONE, "2021-01-01", "", 10)

            jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
                isNumeric: () => ({ isLength: () => ({}) }),
            })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
            return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
            return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new Error());
            const response = await request(app).patch(baseURL + `/${model}`).send(inputProduct).catch((err) => {
                expect(err).toBeInstanceOf(Error);
            });
        })

        test("Errore controller", async()=>{
            const newQuantity:number = 10;
            const model = "iPhone13";
            const inputProduct = {quantity: newQuantity, changeDate: "2023-01-01" };
            const product = new Product(10, "model", Category.SMARTPHONE, "2021-01-01", "", 10)

            jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
                isNumeric: () => ({ isLength: () => ({}) }),
            })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
            return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
            return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);
            const mockChangeProductQuantity = jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValue(new Error());

            const response = await request(app).patch(baseURL + `/${model}`).send(inputProduct).catch((err) => {
                expect(err).toBeInstanceOf(Error);
            });

        });

        test("Modello non fornito", async()=>{
            const newQuantity:number = 10;
            const model = " ";
            const inputProduct = {quantity: newQuantity, changeDate: "2023-01-01" };
            const product = new Product(10, "model", Category.SMARTPHONE, "2021-01-01", "", 10)

            jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
                isNumeric: () => ({ isLength: () => ({}) }),
            })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
            return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
            return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);
            const response = await request(app).patch(baseURL + `/${encodeURIComponent(model)}`).send(inputProduct);
            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: 'Model cannot be empty' });
        
        })

        test("Data non valida", async()=>{
            const inputProduct = { model: "model", newQuantity: 10, changeDate: "data"}
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            
            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockImplementation(() =>{
                return Promise.resolve([product]);
            });

            const newQuantity = 10; 
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValue(newQuantity);

            const response = await request(app).patch(baseURL + `/${inputProduct.model}`).send(inputProduct);
            expect(response.status).toBe(422)
            expect(ProductController.prototype.changeProductQuantity).not.toHaveBeenCalled()
            expect(response.body).toEqual({"error":"Invalid Date"})
        })

        test("Data dopo la data attuale", async()=>{
            const inputProduct = { model: "model", newQuantity: 10, changeDate: "2029-01-01"}
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            
            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockImplementation(() =>{
                return Promise.resolve([product]);
            });

            const newQuantity = 10; 
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValue(newQuantity);

            const response = await request(app).patch(baseURL + `/${inputProduct.model}`).send(inputProduct);
            expect(response.status).toBe(400)
            expect(ProductController.prototype.changeProductQuantity).not.toHaveBeenCalled()
            expect(response.body).toEqual({"error":"change date cannot be after today"})
        })

        test("Modello non esistente", async()=>{
            const inputProduct = { model: "model", quantity: 10, changeDate: "2023-01-01"}
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([]);

            const response = await request(app).patch(baseURL + `/${inputProduct.model}`).send(inputProduct);
            expect(response.status).toBe(404)
            expect(ProductController.prototype.changeProductQuantity).not.toHaveBeenCalled()
            expect(response.body).toEqual({"error":"Product not found"})
        })

        test("La data di cambiamento è prima della data di arrivo", async () => {
            const inputProduct = { model: "model", quantity: 10, changeDate: "1800-12-31" }
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
        
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
        
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
        
            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product])
        
            const response = await request(app).patch(baseURL + `/${inputProduct.model}`).send(inputProduct);
            expect(response.status).toBe(400)
            expect(ProductController.prototype.changeProductQuantity).not.toHaveBeenCalled()
            expect(response.body).toEqual({ error: 'changeDate cannot be before arrival date' })
        })

        test("La nuova quantità è 0 o negativa", async()=>{
            const inputProduct = { model: "model", quantity: -2, changeDate: "2023-01-01" }
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
        
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
        
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
        
           
        
            const response = await request(app).patch(baseURL + `/${inputProduct.model}`).send(inputProduct);
            expect(response.status).toBe(422)
            expect(ProductController.prototype.changeProductQuantity).not.toHaveBeenCalled()
            expect(response.body).toEqual({ error: 'Insufficient quantity' })
        
        })
    });

    describe("Route Vendita prodotto", ()=>{

        test("Corretto Funzionamento", async()=>{
            const quantity:number = 10;
            const model = "iPhone13";
            const inputProduct = {quantity: quantity, sellingDate: "2023-01-01" };
            const product = new Product(10, "iPhone13", Category.SMARTPHONE, "2021-01-01", "", 10)

            jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
                isNumeric: () => ({ isLength: () => ({}) }),
            })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
            return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
            return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);
            const mockSellProduct = jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValue(10);

            const response = await request(app).patch(baseURL + `/${model}` + "/sell").send(inputProduct);

      
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ quantity: 10 });

    
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(model, inputProduct.quantity, inputProduct.sellingDate);
        })

        test("Errore verifica esistenza modello", async()=>{
            const quantity:number = 10;
            const model = "iPhone13";
            const inputProduct = {quantity: quantity, sellingDate: "2023-01-01" };
            const product = new Product(10, "model", Category.SMARTPHONE, "2021-01-01", "", 10)

            jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
                isNumeric: () => ({ isLength: () => ({}) }),
            })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
            return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
            return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new Error());

            const response = await request(app).patch(baseURL + `/${model}` + "/sell").send(inputProduct).catch((err) => { 
                expect(err).toBeInstanceOf(Error);
            });

        })

        test("Errore controller", async()=>{
            const quantity:number = 10;
            const model = "iPhone13";
            const inputProduct = {quantity: quantity, sellingDate: "2023-01-01" };
            const product = new Product(10, "model", Category.SMARTPHONE, "2021-01-01", "", 10)

            jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
                isNumeric: () => ({ isLength: () => ({}) }),
            })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
            return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
            return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);
            const mockSellProduct = jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new Error());

            const response = await request(app).patch(baseURL + `/${model}` + "/sell").send(inputProduct).catch((err) => {
                expect(err).toBeInstanceOf(Error);
            });
        })

        test("Data non valida", async()=>{
            const inputProduct = { model: "model", quantity: 10, sellingDate: "data"}
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockImplementation(() =>{
                return Promise.resolve([product]);
            });

            const newQuantity = 10;
            const mockSellProduct = jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValue(10);

            const response = await request(app).patch(baseURL + `/${inputProduct.model}` + "/sell").send(inputProduct);
            expect(response.status).toBe(422)
            expect(ProductController.prototype.changeProductQuantity).not.toHaveBeenCalled()
            expect(response.body).toEqual({"error":"Wrong date format"})

        })

        test("Data dopo la data attuale", async()=>{
            const inputProduct = { model: "model", quantity: 10, sellingDate: "2029-01-01"}
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockImplementation(() =>{
                return Promise.resolve([product]);
            });

            const newQuantity = 10;
            const mockSellProduct = jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValue(10);

            const response = await request(app).patch(baseURL + `/${inputProduct.model}` + "/sell" ).send(inputProduct);
            expect(response.status).toBe(400)
            expect(ProductController.prototype.changeProductQuantity).not.toHaveBeenCalled()
            expect(response.body).toEqual({"error":"selling date cannot be after today"})
        })

        test("Modello non fornito", async()=>{
            const inputProduct = { model: " ", quantity: 10, sellingDate: "2023-01-01"}
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const response = await request(app).patch(baseURL + `/${inputProduct.model}` + "/sell").send(inputProduct);
            expect(response.status).toBe(422)
            expect(ProductController.prototype.sellProduct).not.toHaveBeenCalled()
            expect(response.body).toEqual({"error":"Model cannot be empty"})
        })

        test("Quantità insufficiente", async()=>{
            const inputProduct = { model: "model", quantity: 0, sellingDate: "2023-01-01"}
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);

            const response = await request(app).patch(baseURL + `/${inputProduct.model}` + "/sell").send(inputProduct);
            expect(response.status).toBe(422)
            expect(ProductController.prototype.sellProduct).not.toHaveBeenCalled()
            expect(response.body).toEqual({"error":"Insufficient quantity"})
        })

        test("Modello non esistente", async()=>{
            const inputProduct = { model: "model", quantity: 10, changeDate: "2023-01-01"}
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([]);

            const response = await request(app).patch(baseURL + `/${inputProduct.model}` + "/sell").send(inputProduct);
            expect(response.status).toBe(404)
            expect(ProductController.prototype.changeProductQuantity).not.toHaveBeenCalled()
            expect(response.body).toEqual({"error":"Product not found"})
        })

        test("La data di vendita è prima della data di arrivo", async () => {
            const inputProduct = { model: "model", quantity: 10, sellingDate: "1800-12-31" }
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
        
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
        
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
        
            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product])
        
            const response = await request(app).patch(baseURL + `/${inputProduct.model}` + "/sell").send(inputProduct);
            expect(response.status).toBe(400)
            expect(ProductController.prototype.sellProduct).not.toHaveBeenCalled()
            expect(response.body).toEqual({ error: 'selling date cannot be before arrival date' })
        });

        test("La quantità venduta è maggiore della quantità disponibile", async () => {
            const inputProduct = { model: "model", quantity: 20, sellingDate: "2023-01-01" }
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
        
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
        
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
        
            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product])
        
            const response = await request(app).patch(baseURL + `/${inputProduct.model}` + "/sell").send(inputProduct);
            expect(response.status).toBe(409)
            expect(ProductController.prototype.sellProduct).not.toHaveBeenCalled()
            expect(response.body).toEqual({ error: 'Product stock cannot satisfy the requested quantity' })
        });

    });


    describe("Route Get Products", () => {

        test("Corretto Funzionamento category", async () => {
            const grouping: string|null = "category";
            const category:string|null = "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(grouping, category, "");

        })

        test("Corretto funzionamento model", async()=>{

            const grouping:string|null = "model";
            const category:string|null = null;
            const model:string|null = "model";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(grouping,"", model);
        })

        test("Corretto funzionamento senza parametri", async()=>{
            const grouping:string|null = null;
            const category:string|null= null;
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL)
            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(undefined, undefined, undefined);  
        })

        test("Grouping nullo, ma categoria o modello non nulli", async()=>{
            const grouping:string|null = null;
            const category:string|null= "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "Category and model must be null" });
            
        })

        test("Grouping non valido", async()=>{
            const grouping:string|null = "GroupingNonValido";
            const category:string|null= "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "Invalid grouping" });
        })

        test("Categoria non valida", async()=>{
            const grouping:string|null = "category";
            const category:string|null= "CategoryNonValida";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue(products);

            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "Invalid category" });
        })

        test("Grouping su categoria, ma categoria nulla", async()=>{
            const grouping:string|null = "category";
            const category:string|null= null;
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            
            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "Parameters error" });
        })

        test("Grouping su modello, ma modello vuoto", async()=>{
            const grouping:string|null = "model";
            const category:string|null=  null;
            const model:string|null = " ";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "Model cannot be empty" });
        })

        test("Grouping su modello, ma modello nullo", async()=>{
            const grouping:string|null = "model";
            const category:string|null= "CategoryNonValida";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
       
            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "Parameters error" });
        })
        test("Errore controller", async()=>{
            const grouping: string|null = "category";
            const category:string|null = "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new Error());
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model }).catch((err) => {
                expect(err).toBeTruthy();
            });
        })
    });

    describe("Route Get Available Products", () => {

        test("Corretto Funzionamento category", async () => {
            const grouping: string|null = "category";
            const category:string|null = "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(grouping, category, "");

        })

        test("Corretto funzionamento model", async()=>{

            const grouping:string|null = "model";
            const category:string|null = null;
            const model:string|null = "model";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });


            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL+ "/available").query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(grouping,"", model);
        })

        test("Corretto funzionamento senza parametri", async()=>{
            const grouping:string|null = null;
            const category:string|null= null;
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL+ "/available");
            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(undefined, undefined, undefined);
        })

        test("Grouping nullo, ma categoria o modello non nulli", async()=>{
            const grouping:string|null = null;
            const category:string|null= "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "Category and model must be null" });
            
        })

        test("Grouping non valido", async()=>{
            const grouping:string|null = "GroupingNonValido";
            const category:string|null= "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "Invalid grouping" });
        })

        test("Categoria non valida", async()=>{
            const grouping:string|null = "category";
            const category:string|null= "CategoryNonValida";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });


            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);

            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "Invalid category" });
        })

        test("Grouping su categoria, ma categoria nulla", async()=>{
            const grouping:string|null = "category";
            const category:string|null= null;
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model });
        
            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "Parameters error" });
        })

        test("Grouping su modello, ma modello vuoto", async()=>{
            const grouping:string|null = "model";
            const category:string|null=  null;
            const model:string|null = " ";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "Model cannot be empty" });
        })

        test("Grouping su modello, ma modello nullo", async()=>{
            const grouping:string|null = "model";
            const category:string|null= "CategoryNonValida";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model });
            
            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "Parameters error" });
        })

    


        test("Errore controller", async()=>{
            const grouping: string|null = "category";
            const category:string|null = "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProductsDAO = jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValue([product]);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue(new Error());
            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model }).catch((err) => {
                expect(err).toBeTruthy();
            });
        })
    });

    describe("Route Cancellazione tutti prodotti", ()=>{
    
        test("Corretto funzionamento", async()=>{

            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
            return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
            return next();
            });

            const mockDeleteAllProducts = jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValue(true);
            const response = await request(app).delete(baseURL);
            expect(response.status).toBe(200);
            expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalled();
        })  

        test("Errore controller", async()=>{
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
            return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
            return next();
            });

            const mockDeleteAllProducts = jest.spyOn(ProductController.prototype, "deleteAllProducts").mockRejectedValue(new Error());
            const response = await request(app).delete(baseURL).catch((err) => {
                expect(err).toBeTruthy();
            });
        })
    
    });

    describe("Route Cancellazione prodotto", ()=>{

        test("Corretto funzionamento", async()=>{

            const model = "model";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);

            const mockDeleteProduct = jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValue(true);
            const response = await request(app).delete(baseURL + `/${model}`);
            expect(response.status).toBe(200);
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith(model);
        }) 
        
        test("Errore controller", async()=>{
            const model = "model";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);

            const mockDeleteProduct = jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValue(new Error());
            const response = await request(app).delete(baseURL + `/${model}`).catch((err) => {
                expect(err).toBeTruthy();
            });
        })
    
        test("Modello non esistente", async()=>{

            const model = "model";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
            return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
            return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([]);

            const mockDeleteProduct = jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValue(false);
            const response = await request(app).delete(baseURL + `/${model}`);
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "Product not found" });
        })  

        test("Errore verifica esistenza modello", async()=> {
            const model = "model";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
            return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
            return next();
            });

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new Error());
            const response = await request(app).delete(baseURL + `/${model}`).catch((err) => {
                expect(err).toBeTruthy();
            });
        })

        test("Modello vuoto", async()=>{

            const model = "  ";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
            return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
            return next();
            });

            const mockDeleteProduct = jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValue(true);
            const response = await request(app).delete(baseURL + `/${encodeURIComponent(model)}`);
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: "Model cannot be empty" });
        })
  
    
    });
    
  });